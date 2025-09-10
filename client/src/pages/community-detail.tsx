import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, MessageCircle, Hash, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LinkedInStylePostCreator } from "@/components/community/LinkedInStylePostCreator";
import { LinkedInStyleCommunityPost } from "@/components/community/LinkedInStyleCommunityPost";

export default function CommunityDetailPage() {
  const [, params] = useRoute("/communities/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: community, isLoading: communityLoading } = useQuery<any>({
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
        description: "Successfully left the community!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to leave community",
        variant: "destructive",
      });
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: { content: string; images?: string[]; videos?: string[] }) => {
      const response = await apiRequest("POST", `/api/communities/${params?.id}/posts`, postData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communities', params?.id, 'posts'] });
      toast({
        title: "Success",
        description: "Post created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    },
  });

  if (!community) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Community Not Found</h2>
          <p className="text-muted-foreground mb-4">The community you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation('/community')}>
            Back to Communities
          </Button>
        </div>
      </div>
    );
  }

  const isUserMember = (Array.isArray(members) && members.some((member: any) => member.userId === user?.id)) ||
                       (Array.isArray(userCommunities) && userCommunities.some((membership: any) => membership.communityId === params?.id));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation('/community')}
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
                    {Array.isArray(members) ? members.length : 0} members
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {Array.isArray(posts) ? posts.length : 0} posts
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isUserMember ? (
                <>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    Member
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => leaveMutation.mutate()}
                    disabled={leaveMutation.isPending}
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    {leaveMutation.isPending ? "Leaving..." : "Leave"}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  {joinMutation.isPending ? "Joining..." : "Join Community"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Creator - Only for members */}
          {isUserMember && user && (
            <LinkedInStylePostCreator
              communityId={params?.id || ''}
              user={user}
              onPostCreated={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/communities', params?.id, 'posts'] });
              }}
            />
          )}

          {/* Posts Feed */}
          <div className="space-y-4">
            {Array.isArray(posts) && posts.length > 0 ? (
              posts.map((post: any) => (
                <LinkedInStyleCommunityPost
                  key={post.id}
                  post={post}
                />
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                  <p className="text-muted-foreground">
                    {Array.isArray(posts) && posts.length === 0 ? "Be the first to share something!" : "Loading posts..."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Community Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Community Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm font-medium">Members:</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  {Array.isArray(members) ? members.length : 0}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium">Posts:</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  {Array.isArray(posts) ? posts.length : 0}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium">Category:</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  {community.category || 'General'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Recent Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.isArray(members) && members.slice(0, 5).map((member: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.userProfileImage} />
                      <AvatarFallback>
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
                {Array.isArray(members) && members.length > 5 && (
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
  );
}