import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Clock, DollarSign, Users, FileText } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BiddingProject } from "@shared/schema";
import { BiddingProjectModal } from "@/components/modals/BiddingProjectModal";
import { ProjectBidModal } from "@/components/modals/ProjectBidModal";

export default function Bidding() {
  const [isBiddingProjectModalOpen, setIsBiddingProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<BiddingProject | null>(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [budgetFilter, setBudgetFilter] = useState('all');

  const { data: biddingProjects = [], isLoading } = useQuery<BiddingProject[]>({
    queryKey: ['/api/bidding-projects'],
  });

  const filteredProjects = biddingProjects.filter((project: BiddingProject) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
    const matchesBudget = budgetFilter === 'all' || 
      (budgetFilter === 'small' && parseFloat(project.budget) < 50000) ||
      (budgetFilter === 'medium' && parseFloat(project.budget) >= 50000 && parseFloat(project.budget) < 500000) ||
      (budgetFilter === 'large' && parseFloat(project.budget) >= 500000);
    
    return matchesSearch && matchesCategory && matchesBudget;
  });

  const handleBidOnProject = (project: BiddingProject) => {
    setSelectedProject(project);
    setIsBidModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatBudget = (budget: string) => {
    const amount = parseFloat(budget);
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {/* Bidding Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground" data-testid="text-bidding-title">
                  Project Bidding
                </h1>
                <p className="text-muted-foreground mt-1">
                  Post projects for others to bid on or bid on existing projects
                </p>
              </div>
              <Button onClick={() => setIsBiddingProjectModalOpen(true)} data-testid="button-post-project">
                <Plus className="h-4 w-4 mr-2" />
                Post Project
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-projects"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-category-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="web-development">Web Development</SelectItem>
                  <SelectItem value="mobile-development">Mobile Development</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="content-writing">Content Writing</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                </SelectContent>
              </Select>
              <Select value={budgetFilter} onValueChange={setBudgetFilter}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-budget-filter">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Budgets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Budgets</SelectItem>
                  <SelectItem value="small">Under ₹50K</SelectItem>
                  <SelectItem value="medium">₹50K - ₹5L</SelectItem>
                  <SelectItem value="large">Above ₹5L</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center py-12">
                <div className="text-muted-foreground" data-testid="text-loading-projects">
                  Loading projects...
                </div>
              </div>
            ) : filteredProjects.length > 0 ? (
              filteredProjects.map((project: BiddingProject) => (
                <div key={project.id} className="bg-card rounded-lg border border-border p-6 shadow-sm" data-testid={`card-project-${project.id}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2" data-testid={`text-project-title-${project.id}`}>
                        {project.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-3" data-testid={`text-project-description-${project.id}`}>
                        {project.description}
                      </p>
                    </div>
                    <Badge className={getStatusColor(project.status)} data-testid={`badge-project-status-${project.id}`}>
                      {project.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>Budget:</span>
                      </div>
                      <span className="font-semibold text-foreground" data-testid={`text-project-budget-${project.id}`}>
                        {formatBudget(project.budget)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Timeline:</span>
                      </div>
                      <span className="text-foreground" data-testid={`text-project-timeline-${project.id}`}>
                        {project.timeline}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>Category:</span>
                      </div>
                      <span className="text-foreground" data-testid={`text-project-category-${project.id}`}>
                        {project.category.replace('-', ' ')}
                      </span>
                    </div>
                  </div>

                  {project.skillsRequired && project.skillsRequired.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Required Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {project.skillsRequired.map((skill, index) => (
                          <span 
                            key={index} 
                            className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded"
                            data-testid={`tag-skill-${project.id}-${index}`}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleBidOnProject(project)} 
                      disabled={project.status !== 'open'}
                      className="flex-1"
                      data-testid={`button-bid-project-${project.id}`}
                    >
                      {project.status === 'open' ? 'Submit Bid' : 'Bidding Closed'}
                    </Button>
                    <Button variant="outline" data-testid={`button-view-project-${project.id}`}>
                      View Details
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-card rounded-lg border border-border">
                <div className="text-muted-foreground" data-testid="text-no-projects-found">
                  {searchTerm || categoryFilter !== 'all' || budgetFilter !== 'all'
                    ? 'No projects found matching your criteria.' 
                    : 'No bidding projects available yet.'
                  }
                </div>
                {(!searchTerm && categoryFilter === 'all' && budgetFilter === 'all') && (
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsBiddingProjectModalOpen(true)}
                    data-testid="button-post-first-project"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Post First Project
                  </Button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <BiddingProjectModal 
        open={isBiddingProjectModalOpen} 
        onOpenChange={setIsBiddingProjectModalOpen} 
      />

      {selectedProject && (
        <ProjectBidModal 
          open={isBidModalOpen} 
          onOpenChange={setIsBidModalOpen}
          project={selectedProject}
        />
      )}
    </div>
  );
}