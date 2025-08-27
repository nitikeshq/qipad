import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Mail, Phone, MapPin, DollarSign } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { User } from "@shared/schema";

export default function Investors() {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [investmentRangeFilter, setInvestmentRangeFilter] = useState('all');

  // Query to get all investors (users with userType = 'investor')
  const { data: allUsers = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users', 'investors'],
    queryFn: async () => {
      const response = await fetch('/api/users/all');
      const users = await response.json();
      return users.filter((user: User) => user.userType === 'investor');
    }
  });

  const filteredInvestors = allUsers.filter((investor: User) => {
    const matchesSearch = investor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         investor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         investor.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = locationFilter === 'all' || 
                           (investor.phone && investor.phone.includes(locationFilter));
    
    return matchesSearch && matchesLocation;
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {/* Investors Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground" data-testid="text-investors-title">
                  Find Investors
                </h1>
                <p className="text-muted-foreground mt-1">
                  Connect with verified investors looking for investment opportunities
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        {investor.email}
                      </span>
                    </div>
                    {investor.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span data-testid={`text-investor-phone-${investor.id}`}>
                          {investor.phone}
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
                    <Button className="w-full" data-testid={`button-connect-investor-${investor.id}`}>
                      Connect
                    </Button>
                    <Button variant="outline" className="w-full" data-testid={`button-view-profile-${investor.id}`}>
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
      </div>
    </div>
  );
}