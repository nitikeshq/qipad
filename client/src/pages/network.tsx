import { useState } from "react";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { UserPlus, Search, Users, MessageCircle, Mail, Phone, MapPin, Filter, ChevronLeft, ChevronRight } from "lucide-react";

export function NetworkPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<Set<string>>(new Set());
  const [pendingConnections, setPendingConnections] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  // Query to get all users
  const { data: allUsers = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users/all'],
    queryFn: async () => {
      const response = await fetch('/api/users/all');
      const users = await response.json();
      return users.filter((u: User) => u.id !== userId); // Exclude current user
    }
  });

  // Query to get user's connections
  const { data: userConnections = [] } = useQuery({
    queryKey: ['/api/connections/my'],
    queryFn: async () => {
      const response = await fetch('/api/connections/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    }
  });

  // Set up connected and pending users based on actual connection data
  React.useEffect(() => {
    if (userConnections?.length > 0) {
      const accepted = new Set<string>();
      const pending = new Set<string>();
      
      userConnections.forEach((connection: any) => {
        const otherUserId = connection.requesterId === userId ? connection.recipientId : connection.requesterId;
        if (connection.status === 'accepted' || connection.isAccepted) {
          accepted.add(otherUserId);
        } else if (connection.status === 'pending') {
          pending.add(otherUserId);
        }
      });
      
      setConnectedUsers(accepted);
      setPendingConnections(pending);
    }
  }, [userConnections, userId]);

  const filteredUsers = allUsers.filter((user: User) => {
    const matchesSearch = user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (connectedUsers.has(user.id) && user.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLocation = locationFilter === 'all' || 
                           (user.phone && user.phone.includes(locationFilter));
    
    const matchesUserType = userTypeFilter === 'all' || user.userType === userTypeFilter;
    
    return matchesSearch && matchesLocation && matchesUserType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const connectMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const response = await apiRequest("POST", "/api/investors/connect", { investorId: targetUserId });
      return response;
    },
    onSuccess: (data, targetUserId) => {
      toast({ title: "Connection request sent successfully!" });
      setPendingConnections(prev => new Set(prev).add(targetUserId));
      queryClient.invalidateQueries({ queryKey: ['/api/connections/my'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to send connection request", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleConnect = (user: User) => {
    connectMutation.mutate(user.id);
  };

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setIsProfileModalOpen(true);
  };

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

            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-users"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                    <SelectTrigger className="w-48" data-testid="select-user-type-filter">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="business_owner">Business Owners</SelectItem>
                      <SelectItem value="investor">Investors</SelectItem>
                      <SelectItem value="individual">Individuals</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-48" data-testid="select-location-filter">
                      <SelectValue placeholder="Filter by location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="+91">India</SelectItem>
                      <SelectItem value="+1">USA</SelectItem>
                      <SelectItem value="+44">UK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{allUsers.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Connected</CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{connectedUsers.size}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingConnections.size}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Filtered</CardTitle>
                  <Filter className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredUsers.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Users Grid */}
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {paginatedUsers.map((user: User) => {
                    const isConnected = connectedUsers.has(user.id);
                    const isPending = pendingConnections.has(user.id);
                    
                    return (
                      <Card key={user.id} className="hover:shadow-lg transition-shadow" data-testid={`card-user-${user.id}`}>
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4 mb-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={user.profileImage || undefined} alt={`${user.firstName} ${user.lastName}`} />
                              <AvatarFallback>
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground" data-testid={`text-user-name-${user.id}`}>
                                {user.firstName} {user.lastName}
                              </h3>
                              <p className="text-sm text-muted-foreground">{user.userType?.replace('_', ' ')}</p>
                            </div>
                            <Badge variant="outline">{user.userType}</Badge>
                          </div>
                          
                          {/* Contact Info - Only show if connected */}
                          {isConnected ? (
                            <div className="space-y-2 mb-4">
                              {user.email && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Mail className="h-4 w-4 mr-2" />
                                  {user.email}
                                </div>
                              )}
                              {user.phone && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Phone className="h-4 w-4 mr-2" />
                                  {user.phone}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="mb-4 p-3 bg-muted rounded-lg text-center">
                              <p className="text-sm text-muted-foreground">
                                Connect to view contact details
                              </p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewProfile(user)}
                              className="flex-1"
                              data-testid={`button-view-profile-${user.id}`}
                            >
                              View Profile
                            </Button>
                            
                            {isConnected ? (
                              <Badge variant="default" className="px-3 py-1">Connected</Badge>
                            ) : isPending ? (
                              <Badge variant="secondary" className="px-3 py-1">Pending</Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleConnect(user)}
                                disabled={connectMutation.isPending}
                                data-testid={`button-connect-${user.id}`}
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Connect
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-4">
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
                    
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages} ({filteredUsers.length} users)
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
              </>
            )}

            {/* Profile Modal */}
            <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>User Profile</DialogTitle>
                </DialogHeader>
                {selectedUser && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={selectedUser.profileImage || undefined} />
                        <AvatarFallback>
                          {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">{selectedUser.firstName} {selectedUser.lastName}</h3>
                        <p className="text-muted-foreground">{selectedUser.userType?.replace('_', ' ')}</p>
                      </div>
                    </div>
                    
                    {connectedUsers.has(selectedUser.id) ? (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Contact Information</Label>
                        {selectedUser.email && (
                          <div className="flex items-center text-sm">
                            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                            {selectedUser.email}
                          </div>
                        )}
                        {selectedUser.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                            {selectedUser.phone}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          Connect with this user to view their contact details
                        </p>
                        {!pendingConnections.has(selectedUser.id) && (
                          <Button
                            size="sm"
                            onClick={() => handleConnect(selectedUser)}
                            disabled={connectMutation.isPending}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Send Connection Request
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}

export default NetworkPage;