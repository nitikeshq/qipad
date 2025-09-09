import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, Plus, TrendingUp, Users, DollarSign } from "lucide-react";
import { Link } from "wouter";
import { ProjectModal } from "@/components/modals/ProjectModal";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  industry: string;
  fundingGoal: string;
  currentFunding: string;
  minimumInvestment: string;
  status: string;
  createdAt: string;
  bannerImage?: string;
}

export default function MyProjects() {
  const isMobile = useIsMobile();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects/my']
  });

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }

    try {
      await apiRequest("DELETE", `/api/projects/${projectId}`);
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects/my'] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      case 'active': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'pending': return 'Pending Review';
      case 'rejected': return 'Rejected';
      case 'active': return 'Active';
      default: return status;
    }
  };

  const calculateProgress = (current: string, goal: string) => {
    const currentNum = parseFloat(current || '0');
    const goalNum = parseFloat(goal || '1');
    return Math.min((currentNum / goalNum) * 100, 100);
  };

  return (
    <div>
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">My Innovations</h1>
                <p className="text-muted-foreground">Manage your innovations and track their progress</p>
              </div>
              <Button onClick={() => setIsProjectModalOpen(true)} data-testid="button-create-project">
                <Plus className="h-4 w-4 mr-2" />
                Create Innovation
              </Button>
            </div>

            {/* Projects Grid */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground">Loading your innovations...</div>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Innovations Yet</h3>
                <p className="text-muted-foreground mb-4">Create your first innovation to start raising funds</p>
                <Button onClick={() => setIsProjectModalOpen(true)} data-testid="button-create-first-project">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Innovation
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {project.bannerImage && (
                      <div className="h-48 overflow-hidden">
                        <img 
                          src={project.bannerImage} 
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2" data-testid={`text-project-title-${project.id}`}>
                            {project.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{project.category}</p>
                        </div>
                        <Badge variant={getStatusColor(project.status)}>
                          {getStatusText(project.status)}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {project.description}
                      </p>

                      {/* Funding Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Funding Progress</span>
                          <span className="font-medium">
                            {calculateProgress(project.currentFunding, project.fundingGoal).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${calculateProgress(project.currentFunding, project.fundingGoal)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>₹{parseFloat(project.currentFunding || '0').toLocaleString()}</span>
                          <span>₹{parseFloat(project.fundingGoal).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold text-foreground">
                            ₹{parseFloat(project.minimumInvestment).toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Min Investment</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-foreground">
                            {new Date(project.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Created</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2 pt-2">
                        <Link href={`/projects/${project.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full" data-testid={`button-view-${project.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditProject(project)}
                          data-testid={`button-edit-${project.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-${project.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
          </SidebarInset>
        </div>
      </div>
      {isMobile && <BottomNav />}

      <ProjectModal 
        open={isProjectModalOpen} 
        onOpenChange={(open) => {
          setIsProjectModalOpen(open);
          if (!open) {
            setEditingProject(null);
          }
        }}
        project={editingProject}
      />
    </div>
  );
}