import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, MapPin, DollarSign, Clock } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar, SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Job } from "@shared/schema";
import { JobModal } from "@/components/modals/JobModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Jobs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
  });

  // Enhance jobs with user information for displaying poster name
  const jobsWithUserInfo = jobs.map((job: any) => ({
    ...job,
    userFirstName: job.userFirstName || 'Unknown',
    userLastName: job.userLastName || 'User'
  }));

  const filteredJobs = jobsWithUserInfo.filter((job: any) => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (job.company && job.company.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLocation = locationFilter === 'all' || (job.location && job.location.toLowerCase().includes(locationFilter.toLowerCase()));
    const matchesType = typeFilter === 'all' || job.jobType === typeFilter;
    return matchesSearch && matchesLocation && matchesType;
  });

  const formatSalary = (min: number, max: number) => {
    const formatAmount = (amount: number) => {
      if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)}L`;
      }
      return `₹${amount.toLocaleString()}`;
    };
    return `${formatAmount(min)} - ${formatAmount(max)}`;
  };

  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'full-time':
        return 'bg-green-100 text-green-800';
      case 'part-time':
        return 'bg-blue-100 text-blue-800';
      case 'contract':
        return 'bg-orange-100 text-orange-800';
      case 'remote':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const applyJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest("POST", "/api/job-applications", { jobId });
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your job application has been submitted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Application Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest("POST", "/api/saved-jobs", { jobId });
    },
    onSuccess: () => {
      toast({
        title: "Job Saved",
        description: "Job has been saved to your favorites!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/saved-jobs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApplyJob = (job: Job) => {
    applyJobMutation.mutate(job.id);
  };

  const handleSaveJob = (job: Job) => {
    saveJobMutation.mutate(job.id);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <SidebarInset className="flex-1">
            <main className="p-6">
          {/* Jobs Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground" data-testid="text-jobs-title">
                  Job Opportunities
                </h1>
                <p className="text-muted-foreground mt-1">
                  Find exciting career opportunities or post job openings
                </p>
              </div>
              <Button onClick={() => setIsJobModalOpen(true)} data-testid="button-post-job">
                <Plus className="h-4 w-4 mr-2" />
                Post Job
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search jobs, companies, skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-jobs"
                />
              </div>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-location-filter">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="mumbai">Mumbai</SelectItem>
                  <SelectItem value="delhi">Delhi</SelectItem>
                  <SelectItem value="bangalore">Bangalore</SelectItem>
                  <SelectItem value="pune">Pune</SelectItem>
                  <SelectItem value="hyderabad">Hyderabad</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-type-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Jobs List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground" data-testid="text-loading-jobs">
                  Loading jobs...
                </div>
              </div>
            ) : filteredJobs.length > 0 ? (
              filteredJobs.map((job: Job) => (
                <div key={job.id} className="bg-card rounded-lg border border-border p-6 shadow-sm" data-testid={`card-job-${job.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground" data-testid={`text-job-title-${job.id}`}>
                          {job.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getJobTypeColor(job.jobType)}`} data-testid={`badge-job-type-${job.id}`}>
                          {job.jobType?.replace('-', ' ').toUpperCase() || 'N/A'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-primary font-medium" data-testid={`text-job-company-${job.id}`}>
                          {job.company || 'Company Name'}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`text-job-poster-${job.id}`}>
                          Posted by: {job.userFirstName} {job.userLastName}
                        </p>
                      </div>
                      
                      <p className="text-muted-foreground text-sm mb-3" data-testid={`text-job-description-${job.id}`}>
                        {job.description}
                      </p>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span data-testid={`text-job-location-${job.id}`}>{job.location || 'Location TBD'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span data-testid={`text-job-salary-${job.id}`}>
                            {job.salaryMin && job.salaryMax ? formatSalary(Number(job.salaryMin), Number(job.salaryMax)) : 'Salary TBD'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span data-testid={`text-job-posted-${job.id}`}>
                            Posted {new Date(job.createdAt || '').toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {job.requiredSkills && job.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.requiredSkills.map((skill, index) => (
                            <span 
                              key={index} 
                              className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded"
                              data-testid={`tag-job-skill-${job.id}-${index}`}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        data-testid={`button-apply-job-${job.id}`}
                        onClick={() => handleApplyJob(job)}
                        disabled={applyJobMutation.isPending}
                      >
                        {applyJobMutation.isPending ? "Applying..." : "Apply Now"}
                      </Button>
                      <Button 
                        variant="outline" 
                        data-testid={`button-save-job-${job.id}`}
                        onClick={() => handleSaveJob(job)}
                        disabled={saveJobMutation.isPending}
                      >
                        {saveJobMutation.isPending ? "Saving..." : "Save Job"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <div className="text-muted-foreground" data-testid="text-no-jobs-found">
                  {searchTerm || locationFilter !== 'all' || typeFilter !== 'all'
                    ? 'No jobs found matching your criteria.' 
                    : 'No job postings available yet.'
                  }
                </div>
                {(!searchTerm && locationFilter === 'all' && typeFilter === 'all') && (
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsJobModalOpen(true)}
                    data-testid="button-post-first-job"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Post First Job
                  </Button>
                )}
              </div>
            )}
          </div>
            </main>
          </SidebarInset>
        </div>

        <JobModal 
          open={isJobModalOpen} 
          onOpenChange={setIsJobModalOpen} 
        />
      </div>
    </SidebarProvider>
  );
}