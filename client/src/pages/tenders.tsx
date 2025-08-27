import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Building, Clock, Filter, Search, ExternalLink, Download } from "lucide-react";

export default function Tenders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");

  const { data: tenders = [], isLoading } = useQuery({
    queryKey: ["/api/tenders"],
  });

  const { data: eligibleTenders = [], isLoading: isLoadingEligible } = useQuery({
    queryKey: ["/api/tenders/eligible"],
  });

  const filteredTenders = tenders.filter((tender: any) =>
    tender.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === "" || tender.category === selectedCategory) &&
    (selectedLocation === "" || tender.location.includes(selectedLocation))
  );

  const categories = ["Infrastructure", "Healthcare", "Education", "Technology", "Agriculture", "Manufacturing"];
  const locations = ["Bhubaneswar", "Cuttack", "Berhampur", "Rourkela", "Sambalpur", "Puri"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tenders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Government Tenders</h1>
          <p className="text-gray-600">Discover and apply for government contracts and tenders</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tenders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-tenders"
                  />
                </div>
              </div>
              <div className="min-w-[150px]">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[150px]">
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger data-testid="select-location">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="icon" data-testid="button-filter">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" data-testid="tab-all-tenders">All Tenders</TabsTrigger>
            <TabsTrigger value="eligible" data-testid="tab-eligible-tenders">Eligible for You</TabsTrigger>
            <TabsTrigger value="applied" data-testid="tab-applied-tenders">Applied</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid gap-6">
              {filteredTenders.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Tenders Found</h3>
                    <p className="text-gray-600">Try adjusting your search criteria or check back later for new opportunities.</p>
                  </CardContent>
                </Card>
              ) : (
                filteredTenders.map((tender: any) => (
                  <TenderCard key={tender.id} tender={tender} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="eligible" className="mt-6">
            <div className="grid gap-6">
              {isLoadingEligible ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Checking eligibility...</p>
                </div>
              ) : eligibleTenders.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Eligible Tenders</h3>
                    <p className="text-gray-600">Complete your business profile and KYC to see eligible opportunities.</p>
                  </CardContent>
                </Card>
              ) : (
                eligibleTenders.map((tender: any) => (
                  <TenderCard key={tender.id} tender={tender} isEligible />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="applied" className="mt-6">
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
                <p className="text-gray-600">Applied tenders will appear here for tracking and management.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function TenderCard({ tender, isEligible = false }: { tender: any; isEligible?: boolean }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'closing_soon': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Card className={`${isEligible ? 'ring-2 ring-green-200 bg-green-50' : ''}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{tender.title}</CardTitle>
            <CardDescription className="mt-1">{tender.department}</CardDescription>
          </div>
          <Badge className={`${getStatusColor(tender.status)} border-0`}>
            {tender.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-700 text-sm">{tender.description}</p>
          
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>{tender.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-gray-500" />
              <span>{tender.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>Due: {formatDate(tender.submissionDeadline)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>Est. Value: ₹{tender.estimatedValue?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {tender.eligibilityCriteria && (
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-medium text-sm mb-1">Eligibility Criteria</h4>
              <p className="text-xs text-gray-600">{tender.eligibilityCriteria}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" data-testid={`button-view-tender-${tender.id}`}>
                <ExternalLink className="h-4 w-4 mr-1" />
                View Details
              </Button>
              <Button variant="outline" size="sm" data-testid={`button-download-tender-${tender.id}`}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
            <Button 
              size="sm" 
              disabled={tender.status === 'closed'}
              data-testid={`button-apply-tender-${tender.id}`}
            >
              {tender.status === 'closed' ? 'Closed' : 'Apply Now'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}