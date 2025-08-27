import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Calendar, MapPin, DollarSign, Eye, Download, ExternalLink } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Tender {
  id: string;
  title: string;
  description: string;
  department: string;
  category: string;
  estimatedValue: string;
  location: string;
  publishDate: string;
  submissionDeadline: string;
  status: "open" | "closed" | "awarded";
  eligibilityCriteria: string[];
  documentUrl?: string;
  contactEmail: string;
  referenceNumber: string;
}

export function TendersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  // Mock data for now - in production this would come from API
  const mockTenders: Tender[] = [
    {
      id: "1",
      title: "Supply of LED Street Lights for Bhubaneswar Municipal Corporation",
      description: "Procurement of energy-efficient LED street lights for street lighting across Bhubaneswar city. Includes installation and 5-year maintenance.",
      department: "Bhubaneswar Municipal Corporation",
      category: "Infrastructure",
      estimatedValue: "₹2.5 Crore",
      location: "Bhubaneswar, Odisha",
      publishDate: "2024-01-15",
      submissionDeadline: "2024-02-15",
      status: "open",
      eligibilityCriteria: [
        "Valid electrical contractor license",
        "Minimum 3 years experience in LED lighting",
        "Annual turnover of ₹50 lakhs"
      ],
      contactEmail: "procurement@bmc.gov.in",
      referenceNumber: "BMC/LED/2024/001"
    },
    {
      id: "2", 
      title: "Construction of Rural Roads under PMGSY Phase III",
      description: "Construction and upgrading of rural roads connecting remote villages to main highways. Total length: 25 km.",
      department: "Rural Development Department",
      category: "Construction",
      estimatedValue: "₹15 Crore",
      location: "Mayurbhanj District, Odisha",
      publishDate: "2024-01-10",
      submissionDeadline: "2024-02-20",
      status: "open",
      eligibilityCriteria: [
        "Class A contractor registration",
        "Experience in rural road construction",
        "Financial capacity of ₹5 crore"
      ],
      contactEmail: "pmgsy@odisha.gov.in",
      referenceNumber: "RDD/PMGSY/2024/025"
    },
    {
      id: "3",
      title: "Digital Learning Platform for Government Schools",
      description: "Development and deployment of comprehensive digital learning platform for 500+ government schools across Odisha.",
      department: "School & Mass Education Department",
      category: "Technology",
      estimatedValue: "₹8 Crore",
      location: "State-wide, Odisha",
      publishDate: "2024-01-08",
      submissionDeadline: "2024-02-25",
      status: "open",
      eligibilityCriteria: [
        "ISO 27001 certified company",
        "Experience in education technology",
        "Minimum team of 10 developers"
      ],
      contactEmail: "digitallearning@sme.odisha.gov.in",
      referenceNumber: "SME/DL/2024/003"
    },
    {
      id: "4",
      title: "Waste Management System for Cuttack City",
      description: "Implementation of comprehensive solid waste management system including collection, transportation, and processing.",
      department: "Cuttack Municipal Corporation",
      category: "Environment",
      estimatedValue: "₹12 Crore",
      location: "Cuttack, Odisha",
      publishDate: "2024-01-05",
      submissionDeadline: "2024-01-30",
      status: "closed",
      eligibilityCriteria: [
        "Environmental clearance certificate",
        "Experience in waste management projects",
        "Valid pollution control board license"
      ],
      contactEmail: "waste@cmc.gov.in",
      referenceNumber: "CMC/WM/2024/001"
    }
  ];

  const tenders = mockTenders;

  const categories = ["all", "Infrastructure", "Construction", "Technology", "Environment", "Healthcare", "Education"];
  const departments = ["all", "Bhubaneswar Municipal Corporation", "Rural Development Department", "School & Mass Education Department", "Cuttack Municipal Corporation"];

  const filteredTenders = tenders.filter(tender => {
    const matchesSearch = tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tender.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tender.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || tender.category === selectedCategory;
    const matchesDepartment = selectedDepartment === "all" || tender.department === selectedDepartment;
    
    return matchesSearch && matchesCategory && matchesDepartment;
  });

  const openTenders = filteredTenders.filter(t => t.status === "open");
  const closedTenders = filteredTenders.filter(t => t.status === "closed");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-500";
      case "closed": return "bg-red-500";
      case "awarded": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const TenderCard = ({ tender }: { tender: Tender }) => (
    <Card className="hover:shadow-lg transition-shadow" data-testid={`tender-card-${tender.id}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2" data-testid={`tender-title-${tender.id}`}>
              {tender.title}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="secondary" data-testid={`tender-category-${tender.id}`}>
                {tender.category}
              </Badge>
              <Badge 
                className={`text-white ${getStatusColor(tender.status)}`}
                data-testid={`tender-status-${tender.id}`}
              >
                {tender.status.toUpperCase()}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-lg text-primary" data-testid={`tender-value-${tender.id}`}>
              {tender.estimatedValue}
            </div>
            <div className="text-sm text-muted-foreground">
              Ref: {tender.referenceNumber}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4 line-clamp-2" data-testid={`tender-description-${tender.id}`}>
          {tender.description}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm" data-testid={`tender-location-${tender.id}`}>
              {tender.location}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm" data-testid={`tender-deadline-${tender.id}`}>
              Due: {new Date(tender.submissionDeadline).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-medium mb-2">Department:</h4>
          <p className="text-sm text-muted-foreground" data-testid={`tender-department-${tender.id}`}>
            {tender.department}
          </p>
        </div>

        <div className="mb-4">
          <h4 className="font-medium mb-2">Eligibility Criteria:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {tender.eligibilityCriteria.map((criteria, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{criteria}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" data-testid={`button-view-tender-${tender.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button variant="outline" size="sm" data-testid={`button-download-tender-${tender.id}`}>
            <Download className="h-4 w-4 mr-2" />
            Download Document
          </Button>
          <Button variant="outline" size="sm" data-testid={`button-contact-tender-${tender.id}`}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2" data-testid="page-title-tenders">
                Government Tenders
              </h1>
              <p className="text-muted-foreground">
                Find and bid on government tenders and empanelment opportunities in Odisha
              </p>
            </div>

            {/* Search and Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tenders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-tenders"
                    />
                  </div>
                  
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category === "all" ? "All Categories" : category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger data-testid="select-department">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept === "all" ? "All Departments" : dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button variant="outline" className="w-full" data-testid="button-advanced-filters">
                    <Filter className="h-4 w-4 mr-2" />
                    Advanced Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tender Tabs */}
            <Tabs defaultValue="open" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                <TabsTrigger value="open" data-testid="tab-open-tenders">
                  Open Tenders ({openTenders.length})
                </TabsTrigger>
                <TabsTrigger value="closed" data-testid="tab-closed-tenders">
                  Closed Tenders ({closedTenders.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="open" className="space-y-6">
                {openTenders.length > 0 ? (
                  <div className="grid gap-6">
                    {openTenders.map((tender) => (
                      <TenderCard key={tender.id} tender={tender} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">No Open Tenders Found</h3>
                        <p className="text-muted-foreground">
                          Try adjusting your search criteria or check back later for new opportunities.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="closed" className="space-y-6">
                {closedTenders.length > 0 ? (
                  <div className="grid gap-6">
                    {closedTenders.map((tender) => (
                      <TenderCard key={tender.id} tender={tender} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">No Closed Tenders Found</h3>
                        <p className="text-muted-foreground">
                          No closed tenders match your current search criteria.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}