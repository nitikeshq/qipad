import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { ProjectModal } from "@/components/modals/ProjectModal";
import { InvestmentModal } from "@/components/modals/InvestmentModal";
import { Project } from "@shared/schema";

export default function Projects() {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
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

  const industries = ['technology', 'healthcare', 'finance', 'education', 'ecommerce', 'clean-energy'];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {/* Projects Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground" data-testid="text-projects-title">
                  Investment Projects
                </h1>
                <p className="text-muted-foreground mt-1">
                  Discover and invest in innovative business projects
                </p>
              </div>
              <Button onClick={() => setIsProjectModalOpen(true)} data-testid="button-create-project">
                <Plus className="h-4 w-4 mr-2" />
                Create Project
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

          {/* Projects Grid */}
          <div className="grid grid-cols-1 gap-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground" data-testid="text-loading-projects">
                  Loading projects...
                </div>
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="bg-card rounded-lg border border-border shadow-sm divide-y divide-border">
                {filteredProjects.map((project: Project) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onInvest={handleInvest}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <div className="text-muted-foreground" data-testid="text-no-projects-found">
                  {searchTerm || industryFilter !== 'all' 
                    ? 'No projects found matching your criteria.' 
                    : 'No projects available yet.'
                  }
                </div>
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
        </main>
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
    </div>
  );
}
