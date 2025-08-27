import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Users, MessageSquare, Plus, Image, Video, Ban, UserCheck, Shield, Eye } from "lucide-react";
import type { User } from "@/lib/auth";

interface CommunityDetailProps {
  community: any;
  members: any[];
  posts: any[];
  currentUser: User;
}

export default function CommunityDetailPage() {
  const [, params] = useRoute("/communities/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [postContent, setPostContent] = useState("");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const { data: community, isLoading: communityLoading } = useQuery({
    queryKey: ['/api/communities', params?.id],
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['/api/communities', params?.id, 'members'],
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['/api/communities', params?.id, 'posts'],
  });

  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/communities/${params?.id}/join`);
    },
    onSuccess: () => {
      toast({ title: "Successfully joined community!" });
      queryClient.invalidateQueries({ queryKey: ['/api/communities', params?.id, 'members'] });
    },
    onError: () => {
      toast({ title: "Failed to join community", variant: "destructive" });
    }
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/communities/${params?.id}/leave`);
    },
    onSuccess: () => {
      toast({ title: "Successfully left community!" });
      queryClient.invalidateQueries({ queryKey: ['/api/communities', params?.id, 'members'] });
    },
    onError: () => {
      toast({ title: "Failed to leave community", variant: "destructive" });
    }
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: { content: string; images?: string[]; videos?: string[] }) => {
      return await apiRequest("POST", `/api/communities/${params?.id}/posts`, postData);
    },
    onSuccess: () => {
      toast({ title: "Post created successfully!" });
      setPostContent("");
      setIsPostModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/communities', params?.id, 'posts'] });
    },
    onError: () => {
      toast({ title: "Failed to create post", variant: "destructive" });
    }
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return await apiRequest("PUT", `/api/communities/${params?.id}/members/${userId}/role`, { role });
    },
    onSuccess: () => {
      toast({ title: "Member role updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/communities', params?.id, 'members'] });
    },
    onError: () => {
      toast({ title: "Failed to update member role", variant: "destructive" });
    }
  });

  if (communityLoading || !community) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="text-center">Loading community...</div>
          </main>
        </div>
      </div>
    );
  }

  const currentUserMember = members.find(m => m.userId === user?.id);
  const isMember = !!currentUserMember;
  const canManageMembers = currentUserMember?.role === 'admin' || currentUserMember?.role === 'creator';

  const handleCreatePost = () => {
    if (!postContent.trim()) return;
    createPostMutation.mutate({ content: postContent });
  };

  const handleRoleUpdate = (userId: string, role: string) => {
    updateMemberRoleMutation.mutate({ userId, role });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setLocation("/communities")}
              className="mb-4"
              data-testid="button-back-to-communities"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Communities
            </Button>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-community-name">
                  {community.name}
                </h1>
                <p className="text-muted-foreground mb-4">{community.description}</p>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {members.length} members
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {posts.length} posts
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                {isMember ? (
                  <>
                    <Button
                      onClick={() => setIsPostModalOpen(true)}
                      data-testid="button-create-post"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Post
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => leaveMutation.mutate()}
                      disabled={leaveMutation.isPending}
                      data-testid="button-leave-community"
                    >
                      {leaveMutation.isPending ? 'Leaving...' : 'Leave Community'}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => joinMutation.mutate()}
                    disabled={joinMutation.isPending}
                    data-testid="button-join-community"
                  >
                    {joinMutation.isPending ? 'Joining...' : 'Join Community'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="posts" className="space-y-4">
            <TabsList>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              {canManageMembers && <TabsTrigger value="manage">Manage</TabsTrigger>}
            </TabsList>

            {/* Posts Tab */}
            <TabsContent value="posts" className="space-y-4">
              {posts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post: any) => (
                  <Card key={post.id} data-testid={`post-${post.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <Avatar>
                          <AvatarImage src={post.authorProfileImage} />
                          <AvatarFallback>
                            {post.authorFirstName?.[0]}{post.authorLastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium">
                              {post.authorFirstName} {post.authorLastName}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-foreground">{post.content}</p>
                          
                          {post.images && post.images.length > 0 && (
                            <div className="mt-3 flex space-x-2">
                              {post.images.map((image: string, index: number) => (
                                <div key={index} className="flex items-center text-sm text-muted-foreground">
                                  <Image className="h-4 w-4 mr-1" />
                                  Image {index + 1}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {post.videos && post.videos.length > 0 && (
                            <div className="mt-3 flex space-x-2">
                              {post.videos.map((video: string, index: number) => (
                                <div key={index} className="flex items-center text-sm text-muted-foreground">
                                  <Video className="h-4 w-4 mr-1" />
                                  Video {index + 1}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Community Members ({members.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {members.map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`member-${member.userId}`}>
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={member.profileImage} />
                            <AvatarFallback>
                              {member.firstName?.[0]}{member.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.firstName} {member.lastName}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {new Date(member.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={member.role === 'admin' || member.role === 'creator' ? 'default' : 'secondary'}>
                            {member.role}
                          </Badge>
                          {canManageMembers && member.userId !== user?.id && (
                            <Select
                              value={member.role}
                              onValueChange={(role) => handleRoleUpdate(member.userId, role)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="banned">Banned</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Manage Tab (Admin Only) */}
            {canManageMembers && (
              <TabsContent value="manage" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Community Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Member Statistics</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">{members.filter(m => m.role === 'member').length}</div>
                            <div className="text-sm text-muted-foreground">Members</div>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">{members.filter(m => m.role === 'admin').length}</div>
                            <div className="text-sm text-muted-foreground">Admins</div>
                          </div>
                          <div className="text-center p-4 border rounded-lg">
                            <div className="text-2xl font-bold">{members.filter(m => m.role === 'banned').length}</div>
                            <div className="text-sm text-muted-foreground">Banned</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>

          {/* Create Post Modal */}
          <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Share something with the community..."
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    rows={4}
                    data-testid="textarea-post-content"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsPostModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePost}
                    disabled={!postContent.trim() || createPostMutation.isPending}
                    data-testid="button-submit-post"
                  >
                    {createPostMutation.isPending ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}