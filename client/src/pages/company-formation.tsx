import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Circle, Building, Phone, Mail, MapPin, DollarSign, FileText, Shield, CreditCard, TrendingUp, Award } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const COMPANY_FORMATION_STEPS = [
  {
    id: 1,
    title: "Create a Company",
    description: "Choose company type and register",
    icon: Building,
    fields: ["companyName", "companyType", "preferredLocation"]
  },
  {
    id: 2, 
    title: "Generate DIN Number",
    description: "Director Identification Number generation",
    icon: FileText,
    fields: ["dinNumber"]
  },
  {
    id: 3,
    title: "Get Required Documents", 
    description: "Incorporation certificate, GST, PAN",
    icon: Shield,
    fields: ["incorporationCertificate", "gstNumber", "panNumber"]
  },
  {
    id: 4,
    title: "Get Trademark",
    description: "Optional trademark registration",
    icon: Award,
    fields: ["trademarkNumber"]
  },
  {
    id: 5,
    title: "Create Bank Account",
    description: "Current account for business operations",
    icon: CreditCard,
    fields: ["bankAccountDetails"]
  },
  {
    id: 6,
    title: "Post Your Project",
    description: "List your idea for funding",
    icon: TrendingUp,
    fields: []
  },
  {
    id: 7,
    title: "Scale Your Business",
    description: "Growth and expansion support",
    icon: TrendingUp,
    fields: []
  },
  {
    id: 8,
    title: "Government Schemes",
    description: "Find tenders and empanelment dates",
    icon: Award,
    fields: []
  }
];

const COMPANY_TYPES = [
  "Private Limited",
  "Partnership", 
  "Proprietary",
  "LLP",
  "Public Limited"
];

const RECOMMENDED_BANKS = [
  { name: "HDFC Bank", benefits: "Best for startups, online banking" },
  { name: "ICICI Bank", benefits: "Quick account opening, digital services" },
  { name: "Axis Bank", benefits: "Low fees, good customer support" },
  { name: "Kotak Mahindra Bank", benefits: "Innovative banking solutions" },
  { name: "IndusInd Bank", benefits: "Flexible account options" }
];

export default function CompanyFormation() {
  const [formData, setFormData] = useState({
    companyName: "",
    companyType: "",
    contactPhone: "",
    contactEmail: "",
    preferredLocation: "",
    businessIdea: "",
    estimatedCapital: "",
    // Document fields
    incorporationCertificate: "",
    gstNumber: "",
    panNumber: "",
    dinNumber: "",
    trademarkNumber: "",
    bankAccountDetails: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's company formation progress
  const { data: companyFormation, isLoading } = useQuery({
    queryKey: ["/api/company-formations/my"],
    enabled: true
  });

  // Create or update company formation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/company-formations", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-formations/my"] });
      toast({
        title: "Progress Saved",
        description: "Your company formation progress has been updated"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save progress",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/company-formations/${companyFormation?.id}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-formations/my"] });
      toast({
        title: "Progress Updated",
        description: "Your company formation progress has been updated"
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (companyFormation) {
      await updateMutation.mutateAsync(formData);
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  // Calculate progress percentage
  const completedSteps = companyFormation ? [
    companyFormation.companyCreated,
    companyFormation.dinGenerated,
    companyFormation.documentsObtained,
    companyFormation.trademarkApplied,
    companyFormation.bankAccountCreated,
    companyFormation.projectPosted,
    false, // Scale step - always manual
    companyFormation.governmentSchemesApplied
  ].filter(Boolean).length : 0;

  const progressPercentage = (completedSteps / 8) * 100;
  const currentStep = companyFormation?.currentStep || 1;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold">Start Your Entrepreneurial Journey</h1>
              <p className="text-xl text-muted-foreground">
                Complete step-by-step company formation process with expert guidance
              </p>
              <div className="flex items-center justify-center space-x-4">
                <Progress value={progressPercentage} className="w-64" />
                <span className="text-sm font-medium">{completedSteps}/8 Steps Complete</span>
              </div>
            </div>

            {/* Steps Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Company Formation Process</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {COMPANY_FORMATION_STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = companyFormation ? 
                      Object.keys(companyFormation).some(key => 
                        key.includes(step.title.toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '')) && 
                        companyFormation[key as keyof typeof companyFormation]
                      ) : false;
                    const isCurrent = currentStep === step.id;

                    return (
                      <div 
                        key={step.id}
                        className={`p-4 border rounded-lg transition-colors ${
                          isCompleted ? 'bg-green-50 border-green-200' :
                          isCurrent ? 'bg-blue-50 border-blue-200' :
                          'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {isCompleted ? (
                            <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                          ) : (
                            <Circle className="h-6 w-6 text-muted-foreground mt-1" />
                          )}
                          <div className="flex-1">
                            <Icon className="h-5 w-5 mb-2 text-primary" />
                            <h3 className="font-semibold text-sm">{step.title}</h3>
                            <p className="text-xs text-muted-foreground">{step.description}</p>
                            {isCompleted && (
                              <Badge variant="default" className="mt-2 text-xs">Completed</Badge>
                            )}
                            {isCurrent && !isCompleted && (
                              <Badge variant="secondary" className="mt-2 text-xs">In Progress</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Form Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="Enter your company name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="companyType">Company Type</Label>
                      <Select
                        value={formData.companyType}
                        onValueChange={(value) => setFormData({ ...formData, companyType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select company type" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPANY_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="contactPhone">Contact Phone</Label>
                      <Input
                        id="contactPhone"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        placeholder="Your phone number"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        placeholder="your.email@example.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="preferredLocation">Preferred Location</Label>
                      <Input
                        id="preferredLocation"
                        value={formData.preferredLocation}
                        onChange={(e) => setFormData({ ...formData, preferredLocation: e.target.value })}
                        placeholder="City, State"
                      />
                    </div>

                    <div>
                      <Label htmlFor="businessIdea">Business Idea</Label>
                      <Textarea
                        id="businessIdea"
                        value={formData.businessIdea}
                        onChange={(e) => setFormData({ ...formData, businessIdea: e.target.value })}
                        placeholder="Describe your business idea"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="estimatedCapital">Estimated Capital (₹)</Label>
                      <Input
                        id="estimatedCapital"
                        type="number"
                        value={formData.estimatedCapital}
                        onChange={(e) => setFormData({ ...formData, estimatedCapital: e.target.value })}
                        placeholder="1000000"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {companyFormation ? 'Update Information' : 'Start Company Formation'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Recommended Banks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Recommended Banks for Current Account
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {RECOMMENDED_BANKS.map((bank, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <h4 className="font-semibold">{bank.name}</h4>
                        <p className="text-sm text-muted-foreground">{bank.benefits}</p>
                      </div>
                    ))}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Tip:</strong> We recommend opening accounts with 2-3 banks for better financial flexibility
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Documents Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Required Documents & Numbers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dinNumber">DIN Number</Label>
                    <Input
                      id="dinNumber"
                      value={formData.dinNumber}
                      onChange={(e) => setFormData({ ...formData, dinNumber: e.target.value })}
                      placeholder="Director Identification Number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="incorporationCertificate">Incorporation Certificate</Label>
                    <Input
                      id="incorporationCertificate"
                      value={formData.incorporationCertificate}
                      onChange={(e) => setFormData({ ...formData, incorporationCertificate: e.target.value })}
                      placeholder="Certificate number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="gstNumber">GST Number</Label>
                    <Input
                      id="gstNumber"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                      placeholder="GST registration number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="panNumber">PAN Number</Label>
                    <Input
                      id="panNumber"
                      value={formData.panNumber}
                      onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                      placeholder="Company PAN number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="trademarkNumber">Trademark Number (Optional)</Label>
                    <Input
                      id="trademarkNumber"
                      value={formData.trademarkNumber}
                      onChange={(e) => setFormData({ ...formData, trademarkNumber: e.target.value })}
                      placeholder="Trademark registration number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bankAccountDetails">Bank Account Details</Label>
                    <Input
                      id="bankAccountDetails"
                      value={formData.bankAccountDetails}
                      onChange={(e) => setFormData({ ...formData, bankAccountDetails: e.target.value })}
                      placeholder="Account number and bank name"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-bold mb-2">Need Expert Help?</h3>
                <p className="text-muted-foreground mb-4">
                  Our team of experts can guide you through each step of the company formation process
                </p>
                <div className="flex items-center justify-center space-x-4">
                  <Button>
                    <Phone className="h-4 w-4 mr-2" />
                    Call Expert
                  </Button>
                  <Button variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}