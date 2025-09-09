import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter } from "lucide-react";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { ProjectModal } from "@/components/modals/ProjectModal";
import { InvestmentModal } from "@/components/modals/InvestmentModal";
import { SupportModal } from "@/components/modals/SupportModal";
import { Project } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Projects() {
  const isMobile = useIsMobile();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const filteredProjects = projects.filter((project: Project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = industryFilter === 'all' || project.industry === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  const handleInvest = (project: Project) => {
    setSelectedProject(project);
    setIsInvestmentModalOpen(true);
  };

  const handleSupport = (project: Project) => {
    setSelectedProject(project);
    setIsSupportModalOpen(true);
  };

  const industries = ['technology', 'healthcare', 'finance', 'education', 'ecommerce', 'clean-energy'];

  return (
    <div>
              {/* Projects Header */}
              <div className="mb-6 md:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-projects-title">
                      All Projects
                    </h1>
                    <p className="text-muted-foreground mt-1">
                      Discover and invest in innovative business projects from entrepreneurs
                    </p>
                  </div>
                  <Button onClick={() => setIsProjectModalOpen(true)} size="sm" className="sm:size-default" data-testid="button-create-project">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Create Project</span>
                  </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
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
                  <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger className="w-full sm:w-48" data-testid="select-industry-filter">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="All Industries" />
                    </SelectTrigger>
                    <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry.charAt(0).toUpperCase() + industry.slice(1).replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredProjects.length} of {projects.length} projects
                </div>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {isLoading ? (
              <div className="col-span-full text-center py-12">
                <div className="text-muted-foreground" data-testid="text-loading-projects">
                  Loading projects...
                </div>
              </div>
            ) : filteredProjects.length > 0 ? (
              filteredProjects.map((project: Project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  onInvest={handleInvest}
                  onSupport={handleSupport}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-card rounded-lg border border-border">
                <div className="text-muted-foreground" data-testid="text-no-projects-found">
                  {searchTerm || industryFilter !== 'all' 
                    ? 'No projects found matching your criteria.' 
                    : 'No projects available yet.'
                  }
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your search filters or check back later for new projects.
                </p>
                {(!searchTerm && industryFilter === 'all') && (
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsProjectModalOpen(true)}
                    data-testid="button-create-first-project"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Project
                  </Button>
                )}
              </div>
            )}
              </div>

      <ProjectModal 
        open={isProjectModalOpen} 
        onOpenChange={setIsProjectModalOpen} 
      />
      
      <InvestmentModal 
        open={isInvestmentModalOpen} 
        onOpenChange={setIsInvestmentModalOpen}
        project={selectedProject}
      />
      
      <SupportModal 
        open={isSupportModalOpen} 
        onOpenChange={setIsSupportModalOpen}
        project={selectedProject}
      />
    </div>
  );
}
