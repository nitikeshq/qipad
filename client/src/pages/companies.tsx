import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Search, MapPin, Globe, Phone, Mail, Building2, Package, Briefcase, MessageCircle, ExternalLink, Plus } from "lucide-react";
import { z } from "zod";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AddCompanyModal } from "@/components/modals/AddCompanyModal";

const inquirySchema = z.object({
  message: z.string().min(10, "Message must be at least 10 characters"),
  contactEmail: z.string().email("Please enter a valid email"),
  contactPhone: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
});

type InquiryForm = z.infer<typeof inquirySchema>;

interface Company {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  isVerified: boolean;
  establishedYear?: number;
  employeeCount?: string;
  tags?: string[];
  services?: CompanyService[];
  products?: CompanyProduct[];
}

interface CompanyService {
  id: string;
  name: string;
  description?: string;
  price?: string;
  duration?: string;
  category?: string;
  tags?: string[];
  images?: string[];
  isActive: boolean;
}

interface CompanyProduct {
  id: string;
  name: string;
  description?: string;
  price?: string;
  category?: string;
  tags?: string[];
  images?: string[];
  specifications?: string;
  isActive: boolean;
}

export default function Companies() {
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedItem, setSelectedItem] = useState<{type: 'service' | 'product', item: CompanyService | CompanyProduct, company: Company} | null>(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch companies with services and products
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["/api/companies"],
  });

  const { data: services = [] } = useQuery({
    queryKey: ["/api/services"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  // Create inquiry mutation
  const inquiryForm = useForm<InquiryForm>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      message: "",
      contactEmail: "",
      contactPhone: "",
      budget: "",
      timeline: "",
    },
  });

  const createInquiryMutation = useMutation({
    mutationFn: async (data: InquiryForm) => {
      const endpoint = selectedItem?.type === 'service' 
        ? `/api/services/${selectedItem.item.id}/inquire`
        : `/api/products/${selectedItem?.item.id}/inquire`;
      
      return apiRequest("POST", endpoint, {
        ...data,
        companyId: selectedItem?.company.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Inquiry Sent",
        description: "Your inquiry has been sent to the company successfully.",
      });
      setShowInquiryModal(false);
      inquiryForm.reset();
      setSelectedItem(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send inquiry",
        variant: "destructive",
      });
    },
  });

  const handleInquirySubmit = (data: InquiryForm) => {
    createInquiryMutation.mutate(data);
  };

  const openInquiryModal = (type: 'service' | 'product', item: CompanyService | CompanyProduct, company: Company) => {
    setSelectedItem({ type, item, company });
    setShowInquiryModal(true);
  };

  // Filter companies based on search and category
  const filteredCompanies = companies.filter((company: Company) => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Filter services and products
  const filteredServices = services.filter((service: CompanyService) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter((product: CompanyProduct) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          {!isMobile && <Sidebar />}
          <SidebarInset>
            <main className={`flex-1 p-6 ${isMobile ? 'pb-20' : ''}`}>
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Companies Directory
                </h1>
                <p className="text-muted-foreground">
                  Discover companies, their services, and products in the Qipad ecosystem
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowAddCompanyModal(true)} data-testid="button-add-company">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your Company
                </Button>
                <Button variant="outline" onClick={() => setLocation("/company-formation")} data-testid="button-start-company">
                  Start New Company
                </Button>
              </div>
            </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              data-testid="search-companies"
              placeholder="Search companies, services, or products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" data-testid="tab-companies">
              <Building2 className="w-4 h-4 mr-2" />
              Companies ({filteredCompanies.length})
            </TabsTrigger>
            <TabsTrigger value="services" data-testid="tab-services">
              <Briefcase className="w-4 h-4 mr-2" />
              Services ({filteredServices.length})
            </TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products">
              <Package className="w-4 h-4 mr-2" />
              Products ({filteredProducts.length})
            </TabsTrigger>
          </TabsList>

          {/* Companies Tab */}
          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company: Company) => (
                <Card key={company.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {company.logo ? (
                          <img 
                            src={company.logo} 
                            alt={company.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">{company.name}</CardTitle>
                          {company.isVerified && (
                            <Badge variant="secondary" className="text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {company.description || "No description available"}
                    </p>
                    
                    <div className="space-y-2 text-xs text-gray-500">
                      {company.city && (
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {company.city}{company.state && `, ${company.state}`}
                        </div>
                      )}
                      {company.establishedYear && (
                        <div>Established: {company.establishedYear}</div>
                      )}
                      {company.employeeCount && (
                        <div>Employees: {company.employeeCount}</div>
                      )}
                    </div>

                    {company.tags && company.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {company.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {company.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{company.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex space-x-2">
                        {company.website && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={company.website} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        {company.email && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`mailto:${company.email}`}>
                              <Mail className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        {company.phone && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`tel:${company.phone}`}>
                              <Phone className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setLocation(`/companies/${company.id}`)}
                        data-testid={`view-company-${company.id}`}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service: CompanyService) => {
                const company = companies.find((c: Company) => 
                  c.services?.some(s => s.id === service.id)
                );
                
                return (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      {service.category && (
                        <Badge variant="secondary" className="text-xs w-fit">
                          {service.category}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {service.description || "No description available"}
                      </p>
                      
                      <div className="space-y-2 text-xs text-gray-500">
                        {service.price && (
                          <div>Price: {service.price}</div>
                        )}
                        {service.duration && (
                          <div>Duration: {service.duration}</div>
                        )}
                        {company && (
                          <div>Company: {company.name}</div>
                        )}
                      </div>

                      {service.tags && service.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {service.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => company && openInquiryModal('service', service, company)}
                          data-testid={`inquire-service-${service.id}`}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Inquire
                        </Button>
                        {company && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setLocation(`/companies/${company.id}`)}
                          >
                            View Company
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product: CompanyProduct) => {
                const company = companies.find((c: Company) => 
                  c.products?.some(p => p.id === product.id)
                );
                
                return (
                  <Card key={product.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      {product.category && (
                        <Badge variant="secondary" className="text-xs w-fit">
                          {product.category}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {product.description || "No description available"}
                      </p>
                      
                      <div className="space-y-2 text-xs text-gray-500">
                        {product.price && (
                          <div>Price: {product.price}</div>
                        )}
                        {company && (
                          <div>Company: {company.name}</div>
                        )}
                      </div>

                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {product.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => company && openInquiryModal('product', product, company)}
                          data-testid={`inquire-product-${product.id}`}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Inquire
                        </Button>
                        {company && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setLocation(`/companies/${company.id}`)}
                          >
                            View Company
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Company Modal */}
        <AddCompanyModal 
          open={showAddCompanyModal} 
          onOpenChange={setShowAddCompanyModal}
          onSuccess={() => {
            toast({
              title: "Company Added",
              description: "Your company has been added to the directory!",
            });
          }}
        />

        {/* Inquiry Modal */}
        <Dialog open={showInquiryModal} onOpenChange={setShowInquiryModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Send Inquiry for {selectedItem?.item.name}
              </DialogTitle>
            </DialogHeader>
            <Form {...inquiryForm}>
              <form onSubmit={inquiryForm.handleSubmit(handleInquirySubmit)} className="space-y-4">
                <FormField
                  control={inquiryForm.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Describe your requirements..."
                          rows={4}
                          data-testid="inquiry-message"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={inquiryForm.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email"
                          placeholder="your@email.com"
                          data-testid="inquiry-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={inquiryForm.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="tel"
                          placeholder="+91 9876543210"
                          data-testid="inquiry-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={inquiryForm.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Range</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="₹10,000 - ₹50,000"
                            data-testid="inquiry-budget"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={inquiryForm.control}
                    name="timeline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timeline</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="2-3 weeks"
                            data-testid="inquiry-timeline"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowInquiryModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createInquiryMutation.isPending}
                    data-testid="submit-inquiry"
                  >
                    {createInquiryMutation.isPending ? "Sending..." : "Send Inquiry"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
          </div>
        </main>
          </SidebarInset>
        </div>
      </div>
      {isMobile && <BottomNav />}
    </SidebarProvider>
  );
}