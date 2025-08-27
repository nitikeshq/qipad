import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, Users, Calendar, MessageCircle, Heart, Share2, Image, Plus, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function CommunityDetailPage() {
  const [, params] = useRoute("/communities/:id");
  const [, setLocation] = useLocation();
  const [newPost, setNewPost] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: community = {}, isLoading: communityLoading } = useQuery({
    queryKey: ['/api/communities', params?.id],
    enabled: !!params?.id,
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['/api/communities', params?.id, 'posts'],
    enabled: !!params?.id,
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['/api/communities', params?.id, 'members'],
    enabled: !!params?.id,
  });

  const { data: user } = useQuery({
    queryKey: ['/api/user'],
  });

  const joinMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/communities/${params?.id}/join`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communities', params?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/communities', params?.id, 'members'] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/communities"] });
      toast({
        title: "Success",
        description: "Successfully joined the community!",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message?.includes("KYC verification required") 
        ? "Complete your KYC verification to join communities. Only verified members can participate."
        : error.message || "Failed to join community";
      toast({
        title: "Access Restricted",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleJoinCommunity = () => {
    joinMutation.mutate();
  };

  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      // If images are selected, upload them first
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        for (const image of selectedImages) {
          const formData = new FormData();
          formData.append('image', image);
          const uploadResponse = await fetch('/api/upload/image', {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          const uploadResult = await uploadResponse.json();
          if (uploadResult.imageUrl) {
            imageUrls.push(uploadResult.imageUrl);
          }
        }
      }

      return await apiRequest("POST", `/api/communities/${params?.id}/posts`, {
        content: postData.content,
        images: imageUrls,
        eventId: postData.eventId || null,
        videos: []
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post created successfully!",
      });
      setNewPost("");
      setSelectedImages([]);
      setSelectedEvent("");
      queryClient.invalidateQueries({ queryKey: ['/api/communities', params?.id, 'posts'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleCreatePost = () => {
    if (!newPost.trim() && selectedImages.length === 0) return;
    createPostMutation.mutate({
      content: newPost.trim(),
      eventId: selectedEvent
    });
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files).slice(0, 4 - selectedImages.length); // Max 4 images
      setSelectedImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const likePostMutation = useMutation({
    mutationFn: (postId: string) => apiRequest("POST", `/api/community-posts/${postId}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communities', params?.id, 'posts'] });
    }
  });

  const commentOnPostMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) => 
      apiRequest("POST", `/api/community-posts/${postId}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communities', params?.id, 'posts'] });
    }
  });

  if (communityLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="mt-4 text-muted-foreground">Loading community...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!community?.id) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Community Not Found</h2>
                <p className="text-muted-foreground mb-4">The community you're looking for doesn't exist.</p>
                <Button onClick={() => setLocation('/communities')}>
                  Back to Communities
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Check membership from both members list and user communities
  const { data: userCommunities = [] } = useQuery({
    queryKey: ["/api/user/communities"],
  });

  const { data: events = [] } = useQuery({
    queryKey: ["/api/events"],
  });
  
  const isUserMember = (Array.isArray(members) && members.some((member: any) => member.userId === user?.id)) ||
                       (Array.isArray(userCommunities) && userCommunities.some((membership: any) => membership.communityId === params?.id));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/communities')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Communities
              </Button>
            </div>

            {/* Community Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{community.name}</CardTitle>
                    <p className="text-muted-foreground mt-2">{community.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {community.category || 'GENERAL'}
                    </Badge>
                    {!isUserMember && (
                      <Button 
                        onClick={handleJoinCommunity}
                        disabled={joinMutation.isPending}
                        data-testid="button-join-community"
                      >
                        {joinMutation.isPending ? 'Joining...' : 'Join Community'}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{members.length} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(community.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Create Post Section - Only for members */}
            {isUserMember && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Create Post</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="What would you like to share with the community?"
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="min-h-[120px] resize-none"
                      data-testid="textarea-new-post"
                    />
                    
                    {/* Event Selection */}
                    <div>
                      <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                        <SelectTrigger>
                          <SelectValue placeholder="Share an event (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(events) && events.map((event: any) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.title} - {new Date(event.date).toLocaleDateString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Image Upload Section */}
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('image-upload')?.click()}
                          disabled={selectedImages.length >= 4}
                        >
                          <Image className="h-4 w-4 mr-2" />
                          Add Images ({selectedImages.length}/4)
                        </Button>
                        {selectedEvent && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedEvent("")}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove Event
                          </Button>
                        )}
                      </div>

                      {/* Image Preview */}
                      {selectedImages.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {selectedImages.map((image, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(image)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 h-6 w-6 p-0"
                                onClick={() => removeImage(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleCreatePost}
                        disabled={(!newPost.trim() && selectedImages.length === 0) || createPostMutation.isPending}
                        data-testid="button-create-post"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {createPostMutation.isPending ? 'Posting...' : 'Post'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Posts Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Community Posts</CardTitle>
              </CardHeader>
              <CardContent>
                {postsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="mt-2 text-sm text-muted-foreground">Loading posts...</p>
                  </div>
                ) : posts.length > 0 ? (
                  <div className="space-y-6">
                    {posts.map((post: any) => (
                      <div key={post.id} className="border-b border-border pb-6 last:border-b-0">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={post.authorProfileImage} />
                            <AvatarFallback>
                              {post.authorFirstName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">
                                {post.authorFirstName} {post.authorLastName}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {new Date(post.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-foreground whitespace-pre-wrap mb-3">
                              {post.content}
                            </p>

                            {/* Display shared event */}
                            {post.eventId && post.eventTitle && (
                              <Card className="mb-3 border-l-4 border-l-blue-500">
                                <CardContent className="p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="h-4 w-4 text-blue-500" />
                                    <span className="font-medium text-sm">Shared Event</span>
                                  </div>
                                  <p className="font-medium">{post.eventTitle}</p>
                                  <p className="text-sm text-muted-foreground">{new Date(post.eventDate).toLocaleDateString()}</p>
                                  {post.eventDescription && (
                                    <p className="text-sm mt-1">{post.eventDescription}</p>
                                  )}
                                </CardContent>
                              </Card>
                            )}

                            {/* Display images */}
                            {post.images && post.images.length > 0 && (
                              <div className={`grid gap-2 mb-3 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                {post.images.map((imageUrl: string, index: number) => (
                                  <img
                                    key={index}
                                    src={imageUrl}
                                    alt={`Post image ${index + 1}`}
                                    className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90"
                                    onClick={() => window.open(imageUrl, '_blank')}
                                  />
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <button 
                                className={`flex items-center gap-1 hover:text-red-500 transition-colors ${post.isLiked ? 'text-red-500' : ''}`}
                                onClick={() => likePostMutation.mutate(post.id)}
                                disabled={likePostMutation.isPending}
                              >
                                <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                                <span>{post.likesCount || 0} Likes</span>
                              </button>
                              <button 
                                className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                                onClick={() => {
                                  const content = prompt("Add a comment:");
                                  if (content) {
                                    commentOnPostMutation.mutate({ postId: post.id, content });
                                  }
                                }}
                                disabled={commentOnPostMutation.isPending}
                              >
                                <MessageCircle className="h-4 w-4" />
                                <span>{post.commentsCount || 0} Comments</span>
                              </button>
                              <button 
                                className="flex items-center gap-1 hover:text-green-500 transition-colors"
                                onClick={() => {
                                  navigator.share?.({
                                    title: `Post by ${post.authorFirstName} ${post.authorLastName}`,
                                    text: post.content,
                                    url: window.location.href
                                  }) || navigator.clipboard?.writeText(window.location.href);
                                  toast({ title: "Post link copied to clipboard!" });
                                }}
                              >
                                <Share2 className="h-4 w-4" />
                                <span>Share</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">No posts yet</p>
                    {isUserMember ? (
                      <p className="text-sm text-muted-foreground">
                        Be the first to share something with the community!
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Join the community to start participating in discussions.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Members Sidebar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Members ({members.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  </div>
                ) : members.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {members.slice(0, 12).map((member: any) => (
                      <div key={member.userId} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={member.profileImage} />
                          <AvatarFallback>
                            {member.firstName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {member.role}
                          </p>
                        </div>
                      </div>
                    ))}
                    {members.length > 12 && (
                      <div className="flex items-center justify-center p-3 border rounded-lg text-sm text-muted-foreground">
                        +{members.length - 12} more
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No members yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}