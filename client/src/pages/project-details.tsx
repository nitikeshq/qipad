import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Edit, DollarSign, Calendar, Users, TrendingUp, Award, ArrowLeft, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { ProjectModal } from "@/components/modals/ProjectModal";
import { InvestmentModal } from "@/components/modals/InvestmentModal";
import { SupportModal } from "@/components/modals/SupportModal";
import { EditProjectModal } from "@/components/modals/EditProjectModal";
import { ConnectionRequestButton } from "@/components/ConnectionRequestButton";
import { useAuth } from "@/contexts/AuthContext";

export function ProjectDetailsPage() {
  const [match, params] = useRoute("/projects/:id");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<any>({});

  const projectId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: project, isLoading } = useQuery<any>({
    queryKey: ['/api/projects', projectId],
    enabled: !!projectId
  });

  const { data: investments = [] } = useQuery<any[]>({
    queryKey: ['/api/investments/project', projectId],
    enabled: !!projectId
  });

  const investMutation = useMutation({
    mutationFn: async ({ amount, type }: { amount: number; type: string }) => {
      const response = await apiRequest("POST", "/api/investments", {
        projectId,
        amount: amount.toString(),
        type,
        expectedStakes: type === "invest" ? "5" : "0" // Default 5% for investments
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Investment successful!" });
      setShowCustomAmount(false);
      setCustomAmount("");
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['/api/investments/project', projectId] });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Investment failed", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const response = await apiRequest('PUT', `/api/projects/${projectId}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Project updated successfully!" });
      setIsEditMode(false);
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Update failed", variant: "destructive" });
    }
  });

  const handleEdit = () => {
    setEditData(project);
    setIsEditMode(true);
  };

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setEditData({});
  };

  if (!match || !projectId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="text-center py-8">
              <p>Project not found</p>
              <Link href="/projects">
                <Button className="mt-4">Back to Projects</Button>
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="text-center py-8">Loading project details...</div>
          </main>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="text-center py-8">
              <p>Project not found</p>
              <Link href="/projects">
                <Button className="mt-4">Back to Projects</Button>
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const fundingProgress = (parseFloat(project.currentFunding) / parseFloat(project.fundingGoal)) * 100;
  const daysRemaining = Math.max(0, project.campaignDuration - Math.floor((Date.now() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60 * 24)));



  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <Link href="/projects">
                <Button variant="ghost" className="mb-4" data-testid="button-back">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Projects
                </Button>
              </Link>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {isEditMode ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="title">Project Title</Label>
                        <Input
                          id="title"
                          value={editData.title || ''}
                          onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                          className="text-2xl font-bold"
                        />
                      </div>
                      <div>
                        <Label htmlFor="briefDescription">Brief Description</Label>
                        <Input
                          id="briefDescription"
                          value={editData.briefDescription || ''}
                          onChange={(e) => setEditData({ ...editData, briefDescription: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-3xl font-bold text-foreground mb-2">{project.title}</h1>
                      <p className="text-muted-foreground">{project.industry} • {project.briefDescription}</p>
                    </>
                  )}
                </div>
                <div className="flex space-x-2">
                  {user?.id === project.userId && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditProjectModalOpen(true)}
                      data-testid="button-edit-project"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Project
                    </Button>
                  )}
                  {isEditMode ? (
                    <>
                      <Button 
                        onClick={handleSave} 
                        disabled={updateMutation.isPending}
                        data-testid="button-save-project"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleCancel}
                        data-testid="button-cancel-edit"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleEdit} data-testid="button-edit-project">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Project
                    </Button>
                  )}
                  <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                    {project.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Project Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Project Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditMode ? (
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={editData.description || ''}
                          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                          rows={6}
                          placeholder="Provide a detailed description of your project..."
                        />
                      </div>
                    ) : (
                      <p className="text-foreground whitespace-pre-wrap">{project.description}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="details" className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="business-plan">Business Plan</TabsTrigger>
                    <TabsTrigger value="team">Team</TabsTrigger>
                    <TabsTrigger value="financials">Financials</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-semibold mb-2">Market Analysis</h3>
                            <p className="text-muted-foreground">
                              {project.marketAnalysis || "Market analysis not provided yet."}
                            </p>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2">Competitive Advantage</h3>
                            <p className="text-muted-foreground">
                              {project.competitiveAdvantage || "Competitive advantage not provided yet."}
                            </p>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2">Use of Funds</h3>
                            <p className="text-muted-foreground">
                              {project.useOfFunds || "Use of funds not specified yet."}
                            </p>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2">Exit Strategy</h3>
                            <p className="text-muted-foreground">
                              {project.exitStrategy || "Exit strategy not provided yet."}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="business-plan">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-muted-foreground">
                          {project.businessPlan || "Business plan documentation is being prepared."}
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="team">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-muted-foreground">
                          {project.teamInfo || "Team information will be updated soon."}
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="financials">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold mb-2">Financial Projections</h3>
                            <p className="text-muted-foreground">
                              {project.financialProjections || "Financial projections are being prepared."}
                            </p>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2">Risk Assessment</h3>
                            <p className="text-muted-foreground">
                              {project.riskAssessment || "Risk assessment is being prepared."}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Funding Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Funding Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      {isEditMode ? (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="fundingGoal">Funding Goal (₹)</Label>
                            <Input
                              id="fundingGoal"
                              type="number"
                              value={editData.fundingGoal || ''}
                              onChange={(e) => setEditData({ ...editData, fundingGoal: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="minimumInvestment">Minimum Investment (₹)</Label>
                            <Input
                              id="minimumInvestment"
                              type="number"
                              value={editData.minimumInvestment || ''}
                              onChange={(e) => setEditData({ ...editData, minimumInvestment: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="campaignDuration">Campaign Duration (days)</Label>
                            <Input
                              id="campaignDuration"
                              type="number"
                              value={editData.campaignDuration || ''}
                              onChange={(e) => setEditData({ ...editData, campaignDuration: e.target.value })}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Raised</span>
                            <span>₹{project.currentFunding}</span>
                          </div>
                          <Progress value={fundingProgress} className="h-2" />
                          <div className="flex justify-between text-sm mt-2">
                            <span className="text-muted-foreground">{fundingProgress.toFixed(1)}% funded</span>
                            <span className="text-muted-foreground">Goal: ₹{project.fundingGoal}</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Investors</p>
                        <p className="text-2xl font-bold">{investments.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Days Left</p>
                        <p className="text-2xl font-bold">{daysRemaining}</p>
                      </div>
                    </div>

                    {!isEditMode && (
                      <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium">Choose investment type:</p>
                        </div>
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700" 
                          onClick={() => setIsInvestmentModalOpen(true)}
                          data-testid="button-invest"
                        >
                          💼 Invest
                          <span className="text-xs block">Get equity stakes</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full border-blue-200 hover:bg-blue-50" 
                          onClick={() => setIsSupportModalOpen(true)}
                          data-testid="button-support"
                        >
                          🤝 Support
                          <span className="text-xs block">No stakes, just support</span>
                        </Button>
                        <Button 
                          variant="secondary" 
                          className="w-full text-sm" 
                          onClick={() => setIsSupportModalOpen(true)}
                          data-testid="button-custom-support"
                        >
                          Custom Support Amount
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Project Owner Contact */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Project Owner
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.owner ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name</span>
                          <span className="font-medium">{project.owner.firstName} {project.owner.lastName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">User Type</span>
                          <span className="font-medium capitalize">{project.owner.userType?.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email</span>
                          <span className="font-medium text-sm">
                            Contact owner to reveal email
                          </span>
                        </div>
                        {project.owner.phone && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Phone</span>
                            <span className="font-medium">{project.owner.phone}</span>
                          </div>
                        )}
                        <ConnectionRequestButton 
                          projectOwnerId={project.owner.id}
                          projectId={project.id}
                          projectTitle={project.title}
                        />
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Owner information not available</p>
                    )}
                  </CardContent>
                </Card>

                {/* Project Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Project Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Investors</span>
                      <span className="font-medium">{investments?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Supporters</span>
                      <span className="font-medium">{investments?.filter(inv => inv.type === 'support')?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Minimum Investment</span>
                      <span className="font-medium">₹{project.minimumInvestment}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Campaign Duration</span>
                      <span className="font-medium">{project.campaignDuration} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">KYC Status</span>
                      <Badge variant={project.isKycComplete ? 'default' : 'secondary'}>
                        {project.isKycComplete ? 'Completed' : 'Pending'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Created</span>
                      <span className="font-medium">{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      <ProjectModal 
        open={isEditModalOpen} 
        onOpenChange={setIsEditModalOpen}
      />
      
      <InvestmentModal 
        open={isInvestmentModalOpen} 
        onOpenChange={setIsInvestmentModalOpen}
        project={project}
      />
      
      <SupportModal 
        open={isSupportModalOpen} 
        onOpenChange={setIsSupportModalOpen}
        project={project}
      />
      
      <EditProjectModal 
        open={isEditProjectModalOpen} 
        onOpenChange={setIsEditProjectModalOpen}
        project={project}
      />
    </div>
  );
}