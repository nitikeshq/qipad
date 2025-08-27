import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserPlus, Search, Users, MessageCircle, Mail } from "lucide-react";

export function NetworkPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/users/all']
  });

  const { data: connections = [] } = useQuery<any[]>({
    queryKey: ['/api/connections']
  });

  const connectMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('POST', '/api/connections', { userId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection Request Sent",
        description: "Your connection request has been sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to send connection request",
        variant: "destructive",
      });
    }
  });

  const handleConnect = (userId: string) => {
    connectMutation.mutate(userId);
  };

  const handleViewProfile = (userId: string) => {
    window.open(`/profile/${userId}`, '_blank');
  };

  const isConnected = (userId: string) => {
    return connections.some((conn: any) => 
      conn.userId === userId || conn.connectedUserId === userId
    );
  };

  const filteredUsers = users.filter((user: any) => 
    user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">Network</h1>
              <p className="text-muted-foreground">Connect with entrepreneurs and investors</p>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-users"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Connections</CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{connections.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Messages</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                </CardContent>
              </Card>
            </div>

            {/* Users Grid */}
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user: any) => (
                  <Card key={user.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.profileImage} />
                          <AvatarFallback>
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">
                            {user.firstName} {user.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <Badge variant={user.userType === 'investor' ? 'default' : 'secondary'}>
                          {user.userType === 'investor' ? 'Investor' : 'Business Owner'}
                        </Badge>
                      </div>

                      <div className="flex space-x-2">
                        {isConnected(user.id) ? (
                          <Button size="sm" variant="outline" className="flex-1" disabled>
                            Connected
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            className="flex-1" 
                            onClick={() => handleConnect(user.id)}
                            disabled={connectMutation.isPending}
                            data-testid={`button-connect-${user.id}`}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Connect
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewProfile(user.id)}
                          data-testid={`button-view-profile-${user.id}`}
                        >
                          View Profile
                        </Button>
                        {isConnected(user.id) && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(`mailto:${user.email}`)}
                            data-testid={`button-email-${user.id}`}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredUsers.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                No users found matching your search.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}