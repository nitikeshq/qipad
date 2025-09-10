import { useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Globe, Phone, Mail, Building2, Package, Briefcase, MessageCircle, ExternalLink, Calendar, Users, Check, Plus, Edit } from "lucide-react";
import { z } from "zod";
import { AddServiceModal } from "@/components/modals/AddServiceModal";
import { AddProductModal } from "@/components/modals/AddProductModal";
import { EditCompanyModal } from "@/components/modals/EditCompanyModal";
import { useAuth } from "@/contexts/AuthContext";

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
  ownerId: string;
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

export default function CompanyDetail() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/companies/:id");
  const companyId = params?.id;
  const [selectedItem, setSelectedItem] = useState<{type: 'service' | 'product', item: CompanyService | CompanyProduct} | null>(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch company details
  const { data: company, isLoading } = useQuery<Company>({
    queryKey: ["/api/companies", companyId],
    enabled: !!companyId,
  });

  // Fetch company services
  const { data: services = [], isLoading: servicesLoading } = useQuery<CompanyService[]>({
    queryKey: ["/api/companies", companyId, "services"],
    enabled: !!companyId,
  });

  // Fetch company products
  const { data: products = [], isLoading: productsLoading } = useQuery<CompanyProduct[]>({
    queryKey: ["/api/companies", companyId, "products"],
    enabled: !!companyId,
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
        companyId,
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

  const openInquiryModal = (type: 'service' | 'product', item: CompanyService | CompanyProduct) => {
    setSelectedItem({ type, item });
    setShowInquiryModal(true);
  };

  if (!match) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Company Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            The company you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => setLocation("/companies")}>
            Back to Companies
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/companies")}
                className="mb-4"
                data-testid="back-to-companies"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Companies
              </Button>
            </div>

        {/* Company Header Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              <div className="flex items-start space-x-4">
                {company.logo ? (
                  <img 
                    src={company.logo} 
                    alt={company.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {company.name}
                      </h1>
                      {company.isVerified && (
                        <Badge variant="secondary" className="flex items-center">
                          <Check className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    {/* Edit Company Button - only show for company owner */}
                    {user && company.ownerId === user.id && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowEditCompanyModal(true)}
                        data-testid="button-edit-company"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {company.description || "No description available"}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {company.city && (
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{company.city}{company.state && `, ${company.state}`}</span>
                </div>
              )}
              {company.establishedYear && (
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Est. {company.establishedYear}</span>
                </div>
              )}
              {company.employeeCount && (
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{company.employeeCount} employees</span>
                </div>
              )}
              {company.website && (
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Globe className="w-4 h-4 mr-2" />
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-primary underline"
                  >
                    Website
                  </a>
                </div>
              )}
            </div>

            {company.tags && company.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {company.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="flex flex-wrap gap-2">
              {company.email && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`mailto:${company.email}`}>
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </a>
                </Button>
              )}
              {company.phone && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`tel:${company.phone}`}>
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </a>
                </Button>
              )}
              {company.website && (
                <Button variant="outline" size="sm" asChild>
                  <a href={company.website} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit Website
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Services and Products Tabs */}
        <Tabs defaultValue="services" className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="services" data-testid="tab-services">
                <Briefcase className="w-4 h-4 mr-2" />
                Services ({services.length})
              </TabsTrigger>
              <TabsTrigger value="products" data-testid="tab-products">
                <Package className="w-4 h-4 mr-2" />
                Products ({products.length})
              </TabsTrigger>
            </TabsList>
            
            {/* Add Service/Product buttons for company owner */}
            {user && company && company.ownerId === user.id && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddServiceModal(true)}
                  data-testid="button-add-service"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddProductModal(true)}
                  data-testid="button-add-product"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>
            )}
          </div>

          {/* Services Tab */}
          <TabsContent value="services">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service: CompanyService) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <div className="flex items-center justify-between">
                      {service.category && (
                        <Badge variant="secondary" className="text-xs">
                          {service.category}
                        </Badge>
                      )}
                      {!service.isActive && (
                        <Badge variant="destructive" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                      {service.description || "No description available"}
                    </p>
                    
                    <div className="space-y-2 text-xs text-gray-500 mb-4">
                      {service.price && (
                        <div><strong>Price:</strong> {service.price}</div>
                      )}
                      {service.duration && (
                        <div><strong>Duration:</strong> {service.duration}</div>
                      )}
                    </div>

                    {service.tags && service.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {service.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {service.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{service.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => openInquiryModal('service', service)}
                      disabled={!service.isActive}
                      data-testid={`inquire-service-${service.id}`}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send Inquiry
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {services.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No services available at this time</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: CompanyProduct) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <div className="flex items-center justify-between">
                      {product.category && (
                        <Badge variant="secondary" className="text-xs">
                          {product.category}
                        </Badge>
                      )}
                      {!product.isActive && (
                        <Badge variant="destructive" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                      {product.description || "No description available"}
                    </p>
                    
                    <div className="space-y-2 text-xs text-gray-500 mb-4">
                      {product.price && (
                        <div><strong>Price:</strong> {product.price}</div>
                      )}
                      {product.specifications && (
                        <div><strong>Specifications:</strong> {product.specifications}</div>
                      )}
                    </div>

                    {product.tags && product.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {product.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {product.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{product.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => openInquiryModal('product', product)}
                      disabled={!product.isActive}
                      data-testid={`inquire-product-${product.id}`}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send Inquiry
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {products.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No products available at this time</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

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
      
      {/* Add Service Modal */}
      {companyId && (
        <AddServiceModal
          isOpen={showAddServiceModal}
          onClose={() => setShowAddServiceModal(false)}
          companyId={companyId}
        />
      )}
      
      {/* Add Product Modal */}
      {companyId && (
        <AddProductModal
          isOpen={showAddProductModal}
          onClose={() => setShowAddProductModal(false)}
          companyId={companyId}
        />
      )}
      
      {/* Edit Company Modal */}
      {company && (
        <EditCompanyModal
          company={company}
          open={showEditCompanyModal}
          onOpenChange={setShowEditCompanyModal}
        />
      )}
    </div>
  );
}