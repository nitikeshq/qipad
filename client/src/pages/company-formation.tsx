import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Circle, Building, FileText, CreditCard, Users, Calendar, Award, Shield, Rocket } from "lucide-react";

const companyFormationSteps = [
  { id: 1, title: "Company Name Selection", description: "Choose and verify company name availability", icon: Building },
  { id: 2, title: "Documentation Preparation", description: "Gather required documents and certificates", icon: FileText },
  { id: 3, title: "Registration Filing", description: "Submit incorporation documents to authorities", icon: CreditCard },
  { id: 4, title: "Director Appointments", description: "Appoint directors and define their roles", icon: Users },
  { id: 5, title: "Compliance Setup", description: "Set up statutory compliance and registrations", icon: Shield },
  { id: 6, title: "Banking & Finance", description: "Open corporate bank accounts and financial setup", icon: CreditCard },
  { id: 7, title: "Tax Registrations", description: "Complete GST, PAN, and other tax registrations", icon: Award },
  { id: 8, title: "Operational Setup", description: "Finalize operational framework and launch", icon: Rocket },
  { id: 9, title: "Post-Incorporation", description: "Complete post-incorporation compliances", icon: Calendar }
];

export default function CompanyFormation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    companyType: "",
    authorizedCapital: "",
    paidUpCapital: "",
    registeredAddress: "",
    businessActivity: "",
    directorDetails: "",
    shareholderDetails: "",
    status: "draft" as const
  });

  const { data: myFormation, isLoading } = useQuery({
    queryKey: ["/api/company-formations/my"],
  });

  const createFormationMutation = useMutation({
    mutationFn: async (formationData: any) => {
      return apiRequest("POST", "/api/company-formations", formationData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company formation process started successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company-formations/my"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateFormationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PUT", `/api/company-formations/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company formation updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company-formations/my"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formationData = {
      ...formData,
      currentStep,
      progressPercentage: Math.round((currentStep / companyFormationSteps.length) * 100)
    };

    if (myFormation && (myFormation as any).id) {
      updateFormationMutation.mutate({ id: (myFormation as any).id, data: formationData });
    } else {
      createFormationMutation.mutate(formationData);
    }
  };

  const progress = Math.round((currentStep / companyFormationSteps.length) * 100);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading company formation details...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Company Formation Process</h1>
              <p className="text-muted-foreground">Complete 9-step process to incorporate your company</p>
            </div>

        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              Formation Progress
            </CardTitle>
            <CardDescription>
              {myFormation ? `Step ${(myFormation as any).currentStep || 1} of ${companyFormationSteps.length}` : "Ready to start"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-gray-600">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {companyFormationSteps.map((step) => {
            const Icon = step.icon;
            const isCompleted = myFormation && step.id < ((myFormation as any).currentStep || 1);
            const isCurrent = step.id === ((myFormation as any)?.currentStep || 1);
            
            return (
              <Card key={step.id} className={`relative ${isCurrent ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${isCompleted ? 'bg-green-100' : isCurrent ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Icon className={`h-5 w-5 ${isCurrent ? 'text-blue-600' : 'text-gray-600'}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{step.title}</h3>
                      <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                      <Badge variant={isCompleted ? "default" : isCurrent ? "secondary" : "outline"} className="mt-2 text-xs">
                        {isCompleted ? "Completed" : isCurrent ? "In Progress" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Formation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Company Formation Details</CardTitle>
            <CardDescription>
              {myFormation ? "Update your company formation information" : "Start your company formation process"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName || (myFormation as any)?.companyName || ""}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    placeholder="Enter proposed company name"
                    required
                    data-testid="input-company-name"
                  />
                </div>
                <div>
                  <Label htmlFor="companyType">Company Type</Label>
                  <Select 
                    value={formData.companyType || (myFormation as any)?.companyType || ""} 
                    onValueChange={(value) => setFormData({...formData, companyType: value})}
                  >
                    <SelectTrigger data-testid="select-company-type">
                      <SelectValue placeholder="Select company type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private_limited">Private Limited Company</SelectItem>
                      <SelectItem value="public_limited">Public Limited Company</SelectItem>
                      <SelectItem value="llp">Limited Liability Partnership</SelectItem>
                      <SelectItem value="opc">One Person Company</SelectItem>
                      <SelectItem value="partnership">Partnership Firm</SelectItem>
                      <SelectItem value="proprietorship">Sole Proprietorship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="authorizedCapital">Authorized Capital (₹)</Label>
                  <Input
                    id="authorizedCapital"
                    type="number"
                    value={formData.authorizedCapital || (myFormation as any)?.authorizedCapital || ""}
                    onChange={(e) => setFormData({...formData, authorizedCapital: e.target.value})}
                    placeholder="1000000"
                    data-testid="input-authorized-capital"
                  />
                </div>
                <div>
                  <Label htmlFor="paidUpCapital">Paid-up Capital (₹)</Label>
                  <Input
                    id="paidUpCapital"
                    type="number"
                    value={formData.paidUpCapital || (myFormation as any)?.paidUpCapital || ""}
                    onChange={(e) => setFormData({...formData, paidUpCapital: e.target.value})}
                    placeholder="100000"
                    data-testid="input-paid-capital"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="registeredAddress">Registered Address</Label>
                <Textarea
                  id="registeredAddress"
                  value={formData.registeredAddress || (myFormation as any)?.registeredAddress || ""}
                  onChange={(e) => setFormData({...formData, registeredAddress: e.target.value})}
                  placeholder="Enter complete registered address"
                  required
                  data-testid="textarea-address"
                />
              </div>

              <div>
                <Label htmlFor="businessActivity">Main Business Activity</Label>
                <Textarea
                  id="businessActivity"
                  value={formData.businessActivity || (myFormation as any)?.businessActivity || ""}
                  onChange={(e) => setFormData({...formData, businessActivity: e.target.value})}
                  placeholder="Describe your main business activities"
                  required
                  data-testid="textarea-business-activity"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="directorDetails">Director Details</Label>
                  <Textarea
                    id="directorDetails"
                    value={formData.directorDetails || (myFormation as any)?.directorDetails || ""}
                    onChange={(e) => setFormData({...formData, directorDetails: e.target.value})}
                    placeholder="Name, PAN, address of directors"
                    data-testid="textarea-directors"
                  />
                </div>
                <div>
                  <Label htmlFor="shareholderDetails">Shareholder Details</Label>
                  <Textarea
                    id="shareholderDetails"
                    value={formData.shareholderDetails || (myFormation as any)?.shareholderDetails || ""}
                    onChange={(e) => setFormData({...formData, shareholderDetails: e.target.value})}
                    placeholder="Name, shares allocation details"
                    data-testid="textarea-shareholders"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep <= 1}
                  data-testid="button-previous-step"
                >
                  Previous Step
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createFormationMutation.isPending || updateFormationMutation.isPending}
                    data-testid="button-save-formation"
                  >
                    {createFormationMutation.isPending || updateFormationMutation.isPending 
                      ? "Saving..." 
                      : myFormation ? "Update Formation" : "Start Formation"
                    }
                  </Button>
                  {currentStep < companyFormationSteps.length ? (
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(Math.min(companyFormationSteps.length, currentStep + 1))}
                      data-testid="button-next-step"
                    >
                      Next Step
                    </Button>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center ml-2">
                      <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-green-800 text-sm mb-2">Formation Complete!</h3>
                      <p className="text-xs text-green-700 mb-3">
                        Ready to launch your business operations.
                      </p>
                      <Button 
                        size="sm"
                        onClick={() => window.location.href = '/dashboard'}
                        data-testid="button-view-dashboard"
                      >
                        <Rocket className="h-4 w-4 mr-1" />
                        View Dashboard
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
          </div>
        </main>
      </div>
    </div>
  );
}