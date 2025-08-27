import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, MessageCircle, Hash, Settings } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LinkedInStylePostCreator } from "@/components/community/LinkedInStylePostCreator";
import { LinkedInStyleCommunityPost } from "@/components/community/LinkedInStyleCommunityPost";

export default function CommunityDetailPage() {
  const [, params] = useRoute("/communities/:id");
  const [, setLocation] = useLocation();
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

  const { data: userCommunities = [] } = useQuery({
    queryKey: ["/api/user/communities"],
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

  const leaveMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/communities/${params?.id}/leave`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communities', params?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/communities', params?.id, 'members'] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/communities"] });
      setLocation("/communities");
      toast({
        title: "Success",
        description: "Left the community",
      });
    },
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

  const isUserMember = (Array.isArray(members) && members.some((member: any) => member.userId === user?.id)) ||
                       (Array.isArray(userCommunities) && userCommunities.some((membership: any) => membership.communityId === params?.id));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
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

            {/* Community Header */}
            <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-lg bg-white/20 flex items-center justify-center">
                      <Hash className="h-8 w-8" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">{community.name}</h1>
                      <p className="text-blue-100 mt-1">{community.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-blue-100">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {members.length} members
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {posts.length} posts
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!isUserMember ? (
                      <Button
                        onClick={() => joinMutation.mutate()}
                        disabled={joinMutation.isPending}
                        className="bg-white text-blue-600 hover:bg-blue-50"
                        data-testid="button-join-community"
                      >
                        {joinMutation.isPending ? "Joining..." : "Join Community"}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => leaveMutation.mutate()}
                        disabled={leaveMutation.isPending}
                        className="border-white text-white hover:bg-white/10"
                        data-testid="button-leave-community"
                      >
                        {leaveMutation.isPending ? "Leaving..." : "Leave"}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="border-white text-white hover:bg-white/10">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Feed */}
              <div className="lg:col-span-3 space-y-4">
                {/* Post Creator - Only show if user is a member */}
                {isUserMember && user && (
                  <LinkedInStylePostCreator
                    communityId={params?.id || ""}
                    user={user}
                    onPostCreated={() => {
                      queryClient.invalidateQueries({ queryKey: ['/api/communities', params?.id, 'posts'] });
                    }}
                  />
                )}

                {/* Posts Feed */}
                <div className="space-y-4">
                  {postsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                          <CardContent className="p-4">
                            <div className="flex space-x-3">
                              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : posts.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          No posts yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Be the first to start a conversation in this community!
                        </p>
                        {isUserMember && (
                          <Button onClick={() => document.querySelector('[data-testid="textarea-post-content"]')?.focus()}>
                            Create First Post
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    posts.map((post: any) => (
                      <LinkedInStyleCommunityPost
                        key={post.id}
                        post={post}
                        communityId={params?.id || ""}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Community Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Community Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Members</span>
                        <Badge variant="secondary">{members.length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Posts</span>
                        <Badge variant="secondary">{posts.length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Category</span>
                        <Badge>{community.category || "General"}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Members */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {members.slice(0, 5).map((member: any) => (
                        <div key={member.userId} className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              {member.userFirstName?.[0]}{member.userLastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {member.userFirstName} {member.userLastName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {member.role}
                            </p>
                          </div>
                        </div>
                      ))}
                      {members.length > 5 && (
                        <Button variant="outline" size="sm" className="w-full">
                          View All Members
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}