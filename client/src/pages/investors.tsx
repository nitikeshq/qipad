import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus, MapPin, Briefcase, TrendingUp } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { User } from "@shared/schema";

export default function Investors() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration - in real app this would come from API
  const mockInvestors = [
    {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@example.com',
      userType: 'investor',
      profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150',
      isVerified: true,
      bio: 'Angel investor focused on fintech and healthcare startups',
      location: 'Mumbai, India',
      investments: 25,
      portfolio: '₹15Cr+',
      industries: ['FinTech', 'HealthTech', 'EdTech']
    },
    {
      id: '2',
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael.chen@example.com',
      userType: 'investor',
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150',
      isVerified: true,
      bio: 'Venture capitalist specializing in early-stage tech companies',
      location: 'Bangalore, India',
      investments: 42,
      portfolio: '₹25Cr+',
      industries: ['AI/ML', 'SaaS', 'CleanTech']
    },
    {
      id: '3',
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya.sharma@example.com',
      userType: 'investor',
      profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150',
      isVerified: true,
      bio: 'Impact investor passionate about sustainable business models',
      location: 'Delhi, India',
      investments: 18,
      portfolio: '₹8Cr+',
      industries: ['CleanTech', 'AgriTech', 'Social Impact']
    }
  ];

  const filteredInvestors = mockInvestors.filter(investor => 
    investor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    investor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    investor.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    investor.industries.some(industry => 
      industry.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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
              <Button data-testid="button-become-investor">
                <UserPlus className="h-4 w-4 mr-2" />
                Become an Investor
              </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search investors by name, expertise, or industry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-investors"
              />
            </div>
          </div>

          {/* Investors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInvestors.length > 0 ? (
              filteredInvestors.map((investor) => (
                <Card key={investor.id} className="hover:shadow-lg transition-shadow" data-testid={`card-investor-${investor.id}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={investor.profileImage} alt={`${investor.firstName} ${investor.lastName}`} />
                        <AvatarFallback>
                          {investor.firstName[0]}{investor.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-foreground" data-testid={`text-investor-name-${investor.id}`}>
                            {investor.firstName} {investor.lastName}
                          </h3>
                          {investor.isVerified && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {investor.location}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4" data-testid={`text-investor-bio-${investor.id}`}>
                      {investor.bio}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center text-primary mb-1">
                          <Briefcase className="h-4 w-4 mr-1" />
                          <span className="font-semibold" data-testid={`text-investor-investments-${investor.id}`}>
                            {investor.investments}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Investments</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center text-green-600 mb-1">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          <span className="font-semibold" data-testid={`text-investor-portfolio-${investor.id}`}>
                            {investor.portfolio}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Portfolio</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2">Industries of Interest:</p>
                      <div className="flex flex-wrap gap-1">
                        {investor.industries.map((industry) => (
                          <Badge key={industry} variant="outline" className="text-xs" data-testid={`badge-industry-${investor.id}-${industry}`}>
                            {industry}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1" data-testid={`button-connect-${investor.id}`}>
                        Connect
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" data-testid={`button-view-profile-${investor.id}`}>
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-muted-foreground" data-testid="text-no-investors-found">
                  {searchTerm ? 'No investors found matching your search criteria.' : 'No investors available.'}
                </div>
              </div>
            )}
          </div>

          {/* Call to Action */}
          <div className="mt-12 bg-card rounded-lg border border-border p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Are you an investor?
            </h2>
            <p className="text-muted-foreground mb-6">
              Join our platform to discover promising startups and connect with entrepreneurs looking for funding.
            </p>
            <Button size="lg" data-testid="button-join-as-investor">
              <UserPlus className="h-4 w-4 mr-2" />
              Join as Investor
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
