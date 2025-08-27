import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Users, MessageCircle, Calendar, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Community } from "@shared/schema";
import { CommunityModal } from "@/components/modals/CommunityModal";
import type { User } from "@shared/schema";

export default function CommunityPage() {
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // 3x3 grid
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: communities = [], isLoading } = useQuery<Community[]>({
    queryKey: ['/api/communities'],
  });

  const { data: user } = useQuery<any>({
    queryKey: ['/api/user'],
  });

  const { data: userMemberships = [] } = useQuery({
    queryKey: ['/api/user/communities'],
    enabled: !!user?.id,
  });

  const filteredCommunities = communities.filter((community: any) => {
    const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (community.description && community.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredCommunities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCommunities = filteredCommunities.slice(startIndex, startIndex + itemsPerPage);

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

  // Join/Enter Community Button Component
  const CommunityActionButton = ({ community, onSuccess }: { community: any; onSuccess: () => void }) => {
    const isUserMember = Array.isArray(userMemberships) && userMemberships.some((membership: any) => membership.communityId === community.id);
    
    const joinMutation = useMutation({
      mutationFn: async () => {
        return await apiRequest("POST", `/api/communities/${community.id}/join`);
      },
      onSuccess,
      onError: () => {
        toast({ title: "Failed to join community", variant: "destructive" });
      }
    });

    if (isUserMember) {
      return (
        <Button 
          size="sm" 
          className="flex-1"
          onClick={() => setLocation(`/communities/${community.id}`)}
          data-testid={`button-enter-community-${community.id}`}
        >
          Enter Community
        </Button>
      );
    }

    return (
      <Button 
        size="sm" 
        className="flex-1"
        onClick={() => joinMutation.mutate()}
        disabled={joinMutation.isPending}
        data-testid={`button-join-community-${community.id}`}
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
            ) : paginatedCommunities.length > 0 ? (
              paginatedCommunities.map((community: Community) => (
                <div key={community.id} className="bg-card rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow" data-testid={`card-community-${community.id}`}>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-foreground" data-testid={`text-community-name-${community.id}`}>
                        {community.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor('general')}`} data-testid={`badge-community-category-${community.id}`}>
                        GENERAL
                      </span>
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-3" data-testid={`text-community-description-${community.id}`}>
                      {community.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span data-testid={`text-community-members-${community.id}`}>
                          {(community as any).memberCount || 0} members
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
                      <CommunityActionButton 
                        community={community}
                        onSuccess={() => {
                          toast({
                            title: "Success",
                            description: `Joined ${community.name} community!`,
                          });
                          queryClient.invalidateQueries({ queryKey: ['/api/communities'] });
                          queryClient.invalidateQueries({ queryKey: ['/api/user/communities'] });
                        }}
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setLocation(`/communities/${community.id}`)}
                        data-testid={`button-view-community-${community.id}`}
                      >
                        <Eye className="h-4 w-4" />
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground" data-testid="text-pagination-info">
                Page {currentPage} of {totalPages} ({filteredCommunities.length} communities)
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                data-testid="button-next-page"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </main>
      </div>

      <CommunityModal 
        open={isCommunityModalOpen} 
        onOpenChange={setIsCommunityModalOpen} 
      />
    </div>
  );
}