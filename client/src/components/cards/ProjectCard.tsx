import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Edit, Eye, User, Calendar, MapPin, Trash2 } from "lucide-react";
import { Project } from "@shared/schema";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ProjectCardProps {
  project: Project & {
    owner?: {
      id: string;
      firstName?: string;
      lastName?: string;
      profileImage?: string;
    };
    userId?: string;
  };
  showActions?: boolean;
  onInvest?: (project: Project) => void;
  onSupport?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
}

export function ProjectCard({ project, showActions = false, onInvest, onSupport, onEdit, onDelete }: ProjectCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const isOwner = user && (project.userId === user.id || project.owner?.id === user.id);
  
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }
    
    if (onDelete) {
      onDelete(project.id);
    } else {
      try {
        await apiRequest("DELETE", `/api/projects/${project.id}`);
        toast({
          title: "Success",
          description: "Project deleted successfully",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete project",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleEdit = () => {
    if (onEdit) {
      onEdit(project);
    }
  };
  const fundingPercentage = project.currentFunding && project.fundingGoal 
    ? (parseFloat(project.currentFunding) / parseFloat(project.fundingGoal)) * 100 
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatCurrency = (amount: string) => {
    const value = parseFloat(amount);
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${value.toLocaleString()}`;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-project-${project.id}`}>
      {/* Banner Image */}
      {project.images && project.images.length > 0 && (
        <div className="h-48 overflow-hidden">
          <img 
            src={project.images[0]} 
            alt={project.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 mb-2" data-testid={`text-project-title-${project.id}`}>
              {project.title}
            </CardTitle>
            
            {/* Project Owner */}
            {project.owner && (
              <div className="flex items-center space-x-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={project.owner.profileImage || undefined} />
                  <AvatarFallback className="text-xs">
                    {project.owner.firstName?.[0]}{project.owner.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground" data-testid={`text-project-owner-${project.id}`}>
                  by {project.owner.firstName} {project.owner.lastName}
                </span>
              </div>
            )}
            
            <div className="flex items-center space-x-3 text-xs text-muted-foreground mb-2">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              <span>•</span>
              <span className="capitalize">{project.industry}</span>
            </div>
          </div>
          
          <Badge variant={getStatusColor(project.status || 'draft').includes('green') ? 'default' : 'secondary'} 
                 data-testid={`badge-project-status-${project.id}`}>
            {project.status?.replace('_', ' ').toUpperCase() || 'DRAFT'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-project-description-${project.id}`}>
          {project.description}
        </p>

        {/* Funding Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Funding Progress</span>
            <span className="font-medium">{fundingPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={fundingPercentage} className="h-2" data-testid={`progress-project-funding-${project.id}`} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Raised: {formatCurrency(project.currentFunding || '0')}</span>
            <span>Goal: {formatCurrency(project.fundingGoal)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Link href={`/innovations/${project.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full" data-testid={`button-view-details-${project.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </Link>
          
          {/* Investment buttons for non-owners */}
          {!isOwner && (onInvest || onSupport) && project.status === 'approved' && (
            <>
              {onInvest && (
                <Button size="sm" onClick={() => onInvest(project)} data-testid={`button-invest-${project.id}`}>
                  Invest Now
                </Button>
              )}
              {onSupport && (
                <Button variant="outline" size="sm" onClick={() => onSupport(project)} data-testid={`button-support-${project.id}`}>
                  Support
                </Button>
              )}
            </>
          )}
          
          {/* Edit/Delete buttons for owners */}
          {isOwner && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleEdit}
                data-testid={`button-edit-${project.id}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDelete}
                className="text-destructive hover:text-destructive"
                data-testid={`button-delete-${project.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
