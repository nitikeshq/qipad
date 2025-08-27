import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Users, Calendar, MessageCircle, Heart, Share2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
// Remove unused import

export default function CommunityDetailPage() {
  const [, params] = useRoute("/communities/:id");
  const [, setLocation] = useLocation();
  const [newPost, setNewPost] = useState("");
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
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/communities/${params?.id}/posts`, {
        content,
        images: [],
        videos: []
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post created successfully!",
      });
      setNewPost("");
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
    if (!newPost.trim()) return;
    createPostMutation.mutate(newPost);
  };

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

  const isUserMember = Array.isArray(members) && members.some((member: any) => member.userId === user?.id);

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
                    <div className="flex justify-end">
                      <Button
                        onClick={handleCreatePost}
                        disabled={!newPost.trim() || createPostMutation.isPending}
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
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                                <Heart className="h-4 w-4" />
                                <span>Like</span>
                              </button>
                              <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                                <MessageCircle className="h-4 w-4" />
                                <span>Comment</span>
                              </button>
                              <button className="flex items-center gap-1 hover:text-foreground transition-colors">
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