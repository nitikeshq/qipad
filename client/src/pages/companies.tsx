import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Building2, 
  MapPin, 
  Globe, 
  Users, 
  TrendingUp, 
  Calendar,
  Search,
  Filter,
  Plus,
  Eye,
  ExternalLink
} from "lucide-react";
import { Company } from "@shared/schema";
import { CompanyModal } from "@/components/modals/CompanyModal";

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['/api/companies'],
  });

  const filteredCompanies = companies.filter((company: Company) => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = !industryFilter || company.industry === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  const industries = [...new Set(companies.map((c: Company) => c.industry))];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground" data-testid="text-companies-title">
                  Companies
                </h1>
                <p className="text-muted-foreground mt-1">
                  Discover verified companies and business opportunities
                </p>
              </div>
              <Button onClick={() => setIsCompanyModalOpen(true)} data-testid="button-list-company">
                <Plus className="h-4 w-4 mr-2" />
                List Your Company
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-companies"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background text-foreground"
                data-testid="select-industry-filter"
              >
                <option value="">All Industries</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm" data-testid="button-filter">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          {/* Companies Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-muted rounded-lg"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-32"></div>
                        <div className="h-3 bg-muted rounded w-24"></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company: Company) => (
                <Card key={company.id} className="hover:shadow-lg transition-shadow" data-testid={`card-company-${company.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={company.logo} alt={company.name} />
                          <AvatarFallback>
                            <Building2 className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{company.name}</CardTitle>
                          <CardDescription className="flex items-center">
                            <Badge variant="secondary" className="text-xs">
                              {company.industry}
                            </Badge>
                          </CardDescription>
                        </div>
                      </div>
                      {company.isVerified && (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {company.description}
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      {company.city && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {company.city}, {company.state}
                        </div>
                      )}
                      {company.website && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Globe className="h-3 w-3 mr-1" />
                          <a href={company.website} target="_blank" rel="noopener noreferrer" 
                             className="hover:text-primary">
                            {company.website}
                          </a>
                        </div>
                      )}
                      {company.employeeCount && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="h-3 w-3 mr-1" />
                          {company.employeeCount} employees
                        </div>
                      )}
                      {company.foundedYear && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          Founded {company.foundedYear}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-${company.id}`}>
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      {company.website && (
                        <Button variant="ghost" size="sm" asChild data-testid={`button-visit-${company.id}`}>
                          <a href={company.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredCompanies.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No companies found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || industryFilter 
                  ? "Try adjusting your search criteria" 
                  : "Be the first to list your company!"}
              </p>
              <Button onClick={() => setIsCompanyModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                List Your Company
              </Button>
            </div>
          )}
        </main>
      </div>

      <CompanyModal 
        open={isCompanyModalOpen} 
        onOpenChange={setIsCompanyModalOpen} 
      />
    </div>
  );
}