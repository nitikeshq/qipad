import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MoreHorizontal, Edit, Eye } from "lucide-react";
import { Project } from "@shared/schema";
import { Link } from "wouter";

interface ProjectCardProps {
  project: Project;
  showActions?: boolean;
  onInvest?: (project: Project) => void;
  onSupport?: (project: Project) => void;
}

export function ProjectCard({ project, showActions = false, onInvest, onSupport }: ProjectCardProps) {
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
    <div className="p-6 border-b border-border last:border-b-0" data-testid={`card-project-${project.id}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-foreground mb-2" data-testid={`text-project-title-${project.id}`}>
            {project.title}
          </h3>
          <p className="text-muted-foreground text-sm mb-3" data-testid={`text-project-description-${project.id}`}>
            {project.description}
          </p>
          <div className="flex items-center space-x-4 text-sm mb-3">
            <span className="text-muted-foreground">
              Target: {formatCurrency(project.fundingGoal)}
            </span>
            <span className="text-green-600 font-medium" data-testid={`text-project-raised-${project.id}`}>
              Raised: {formatCurrency(project.currentFunding || '0')} ({fundingPercentage.toFixed(0)}%)
            </span>
            <Badge className={`text-xs ${getStatusColor(project.status || 'draft')}`} data-testid={`badge-project-status-${project.id}`}>
              {project.status?.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <Progress value={fundingPercentage} className="h-2" data-testid={`progress-project-funding-${project.id}`} />
          {(onInvest || onSupport) && project.status === 'approved' && (
            <div className="mt-4 flex space-x-3">
              {onInvest && (
                <Button onClick={() => onInvest(project)} data-testid={`button-invest-${project.id}`}>
                  Invest Now
                </Button>
              )}
              {onSupport && (
                <Button variant="outline" onClick={() => onSupport(project)} data-testid={`button-support-${project.id}`}>
                  Support
                </Button>
              )}
            </div>
          )}
        </div>
        {showActions && (
          <div className="flex space-x-2">
            <Link href={`/projects/${project.id}`}>
              <Button variant="ghost" size="icon" data-testid={`button-view-project-${project.id}`}>
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/projects/${project.id}`}>
              <Button variant="ghost" size="icon" data-testid={`button-edit-project-${project.id}`}>
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
