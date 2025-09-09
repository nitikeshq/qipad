import { useState } from "react";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search, Filter, Mail, Phone, MapPin, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";

export default function Investors() {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [investmentRangeFilter, setInvestmentRangeFilter] = useState('all');
  const [selectedInvestor, setSelectedInvestor] = useState<User | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [connectedInvestors, setConnectedInvestors] = useState<Set<string>>(new Set());
  const [pendingConnections, setPendingConnections] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  // Query to get all investors (users with userType = 'investor')
  const { data: allUsers = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users', 'investors'],
    queryFn: async () => {
      const response = await fetch('/api/users/all');
      const users = await response.json();
      return users.filter((user: User) => user.userType === 'investor');
    }
  });

  // Query to get user's connections to check which investors are actually connected
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

  // Set up connected and pending investors based on actual connection data
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
      
      setConnectedInvestors(accepted);
      setPendingConnections(pending);
    }
  }, [userConnections]);

  const filteredInvestors = allUsers.filter((investor: User) => {
    const matchesSearch = investor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         investor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (connectedInvestors.has(investor.id) && investor.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLocation = locationFilter === 'all' || 
                           (investor.phone && investor.phone.includes(locationFilter));
    
    return matchesSearch && matchesLocation;
  });

  const connectMutation = useMutation({
    mutationFn: async (investorId: string) => {
      const response = await apiRequest("POST", "/api/investors/connect", { investorId });
      return response;
    },
    onSuccess: (data, investorId) => {
      toast({ title: "Connection request sent successfully!" });
      setPendingConnections(prev => new Set(prev).add(investorId));
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

  const getInvestmentRangeText = (range: string) => {
    switch (range) {
      case 'small':
        return '₹1L - ₹10L';
      case 'medium':
        return '₹10L - ₹1Cr';
      case 'large':
        return '₹1Cr+';
      default:
        return 'Any Range';
    }
  };

  const handleConnect = (investor: User) => {
    connectMutation.mutate(investor.id);
  };

  const handleViewProfile = (investor: User) => {
    setSelectedInvestor(investor);
    setIsProfileModalOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          {!isMobile && <Sidebar />}
          <SidebarInset>
            <main className={`flex-1 p-4 md:p-6 ${isMobile ? 'pb-20' : ''}`}>
              {/* Investors Header */}
              <div className="mb-6 md:mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-investors-title">
                      Find Investors
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      Connect with verified investors looking for investment opportunities
                    </p>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search investors by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-investors"
                />
              </div>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-location-filter">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="91 98">Mumbai</SelectItem>
                  <SelectItem value="91 87">Delhi</SelectItem>
                  <SelectItem value="91 76">Bangalore</SelectItem>
                  <SelectItem value="91 65">Pune</SelectItem>
                </SelectContent>
              </Select>
              <Select value={investmentRangeFilter} onValueChange={setInvestmentRangeFilter}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-investment-range-filter">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Investment Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ranges</SelectItem>
                  <SelectItem value="small">₹1L - ₹10L</SelectItem>
                  <SelectItem value="medium">₹10L - ₹1Cr</SelectItem>
                  <SelectItem value="large">₹1Cr+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

              {/* Investors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {isLoading ? (
              <div className="col-span-full text-center py-12">
                <div className="text-muted-foreground" data-testid="text-loading-investors">
                  Loading investors...
                </div>
              </div>
            ) : filteredInvestors.length > 0 ? (
              filteredInvestors.map((investor: User) => (
                <div key={investor.id} className="bg-card rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow" data-testid={`card-investor-${investor.id}`}>
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      {investor.profileImage ? (
                        <img 
                          src={investor.profileImage} 
                          alt={`${investor.firstName} ${investor.lastName}`}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-primary text-xl font-semibold">
                          {investor.firstName.charAt(0)}{investor.lastName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground" data-testid={`text-investor-name-${investor.id}`}>
                      {investor.firstName} {investor.lastName}
                    </h3>
                    <p className="text-primary text-sm font-medium">Verified Investor</p>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span data-testid={`text-investor-email-${investor.id}`} className="truncate">
                        {connectedInvestors.has(investor.id) ? investor.email : '••••••@••••.com'}
                      </span>
                    </div>
                    {investor.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span data-testid={`text-investor-phone-${investor.id}`}>
                          {connectedInvestors.has(investor.id) ? investor.phone : '••••••••••'}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span data-testid={`text-investor-range-${investor.id}`}>
                        {getInvestmentRangeText(investmentRangeFilter)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      onClick={() => handleConnect(investor)}
                      disabled={connectedInvestors.has(investor.id) || pendingConnections.has(investor.id) || connectMutation.isPending}
                      data-testid={`button-connect-investor-${investor.id}`}
                    >
                      {connectedInvestors.has(investor.id) 
                        ? 'Connected' 
                        : pendingConnections.has(investor.id)
                        ? 'Request Sent'
                        : 'Connect to View Contact'}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => handleViewProfile(investor)}
                      data-testid={`button-view-profile-${investor.id}`}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-card rounded-lg border border-border">
                <div className="text-muted-foreground" data-testid="text-no-investors-found">
                  {searchTerm || locationFilter !== 'all' || investmentRangeFilter !== 'all'
                    ? 'No investors found matching your criteria.' 
                    : 'No investors available yet.'
                  }
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your search filters or check back later for new investors.
                </p>
              </div>
            )}
          </div>
        </main>
          </SidebarInset>
        </div>
      </div>
      {isMobile && <BottomNav />}

      {/* Investor Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-2xl" data-testid="dialog-investor-profile">
          <DialogHeader>
            <DialogTitle>Investor Profile</DialogTitle>
          </DialogHeader>
          {selectedInvestor && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  {selectedInvestor.profileImage ? (
                    <img 
                      src={selectedInvestor.profileImage} 
                      alt={`${selectedInvestor.firstName} ${selectedInvestor.lastName}`}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-primary text-2xl font-semibold">
                      {selectedInvestor.firstName.charAt(0)}{selectedInvestor.lastName.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{selectedInvestor.firstName} {selectedInvestor.lastName}</h3>
                  <Badge variant="default" className="mt-1">Verified Investor</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <p className="font-medium">{selectedInvestor.email}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="font-medium">{selectedInvestor.phone || 'Not provided'}</p>
                </div>
                <div>
                  <Label>User Type</Label>
                  <Badge variant="secondary">{selectedInvestor.userType}</Badge>
                </div>
                <div>
                  <Label>KYC Status</Label>
                  <Badge variant={selectedInvestor.isKycComplete ? 'default' : 'secondary'}>
                    {selectedInvestor.isKycComplete ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
                <div>
                  <Label>Member Since</Label>
                  <p className="font-medium">{new Date(selectedInvestor.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Investment Range</Label>
                  <p className="font-medium">₹1L - ₹1Cr+</p>
                </div>
              </div>

              {connectedInvestors.has(selectedInvestor.id) && (
                <div className="border-t pt-4">
                  <Label>Contact Information (Available after connection)</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedInvestor.email}</span>
                    </div>
                    {selectedInvestor.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedInvestor.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}