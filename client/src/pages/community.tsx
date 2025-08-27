import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Users, MessageCircle, Calendar, Eye } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Community } from "@shared/schema";
import { CommunityModal } from "@/components/modals/CommunityModal";
import type { User } from "@/lib/auth";

export default function CommunityPage() {
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: communities = [], isLoading } = useQuery<Community[]>({
    queryKey: ['/api/communities'],
  });

  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  const filteredCommunities = communities.filter((community: Community) => {
    const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         community.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technology':
        return 'bg-blue-100 text-blue-800';
      case 'finance':
        return 'bg-green-100 text-green-800';
      case 'healthcare':
        return 'bg-red-100 text-red-800';
      case 'education':
        return 'bg-purple-100 text-purple-800';
      case 'networking':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Join Community Button Component
  const JoinCommunityButton = ({ communityId, onSuccess }: { communityId: string; onSuccess: () => void }) => {
    const joinMutation = useMutation({
      mutationFn: async () => {
        return await apiRequest("POST", `/api/communities/${communityId}/join`);
      },
      onSuccess,
      onError: () => {
        toast({ title: "Failed to join community", variant: "destructive" });
      }
    });

    return (
      <Button 
        size="sm" 
        className="flex-1"
        onClick={() => joinMutation.mutate()}
        disabled={joinMutation.isPending}
        data-testid={`join-community-${communityId}`}
      >
        {joinMutation.isPending ? 'Joining...' : 'Join Community'}
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {/* Community Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground" data-testid="text-communities-title">
                  Business Communities
                </h1>
                <p className="text-muted-foreground mt-1">
                  Connect, collaborate, and grow with like-minded entrepreneurs
                </p>
              </div>
              <Button onClick={() => setIsCommunityModalOpen(true)} data-testid="button-create-community">
                <Plus className="h-4 w-4 mr-2" />
                Create Community
              </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search communities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-communities"
              />
            </div>
          </div>

          {/* Communities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center py-12">
                <div className="text-muted-foreground" data-testid="text-loading-communities">
                  Loading communities...
                </div>
              </div>
            ) : filteredCommunities.length > 0 ? (
              filteredCommunities.map((community: Community) => (
                <div key={community.id} className="bg-card rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow" data-testid={`card-community-${community.id}`}>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-foreground" data-testid={`text-community-name-${community.id}`}>
                        {community.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(community.category)}`} data-testid={`badge-community-category-${community.id}`}>
                        {community.category?.toUpperCase() || 'GENERAL'}
                      </span>
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-3" data-testid={`text-community-description-${community.id}`}>
                      {community.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span data-testid={`text-community-members-${community.id}`}>
                          {community.memberCount || 0} members
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span data-testid={`text-community-created-${community.id}`}>
                          {new Date(community.createdAt || '').toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <JoinCommunityButton 
                        communityId={community.id}
                        onSuccess={() => {
                          toast({
                            title: "Success",
                            description: `Joined ${community.name} community!`,
                          });
                          queryClient.invalidateQueries({ queryKey: ['/api/communities'] });
                        }}
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setLocation(`/communities/${community.id}`)}
                        data-testid={`button-view-community-${community.id}`}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-card rounded-lg border border-border">
                <div className="text-muted-foreground" data-testid="text-no-communities-found">
                  {searchTerm 
                    ? 'No communities found matching your criteria.' 
                    : 'No communities available yet.'
                  }
                </div>
                {!searchTerm && (
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsCommunityModalOpen(true)}
                    data-testid="button-create-first-community"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Community
                  </Button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <CommunityModal 
        open={isCommunityModalOpen} 
        onOpenChange={setIsCommunityModalOpen} 
      />
    </div>
  );
}