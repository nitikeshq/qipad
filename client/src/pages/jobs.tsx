import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, MapPin, Clock, DollarSign, Building, Share, Users } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function Jobs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    salary: '',
    employmentType: 'full-time'
  });
  const [application, setApplication] = useState({
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    coverLetter: ''
  });

  // Mock data for demonstration
  const mockJobs = [
    {
      id: '1',
      title: 'Full Stack Developer',
      company: 'TechNova Solutions',
      location: 'Bangalore, India',
      salary: '₹8-15 LPA',
      employmentType: 'Full-time',
      postedBy: 'Rahul Gupta',
      postedTime: '2 days ago',
      description: 'Join our innovative team to build cutting-edge web applications using React, Node.js, and cloud technologies.',
      requirements: 'Experience with React, Node.js, MongoDB, AWS. Strong problem-solving skills.',
      applicants: 24,
      isRemote: false,
      experience: '2-5 years',
      skills: ['React', 'Node.js', 'MongoDB', 'AWS']
    },
    {
      id: '2',
      title: 'Marketing Manager',
      company: 'GreenTech Innovations',
      location: 'Mumbai, India',
      salary: '₹12-20 LPA',
      employmentType: 'Full-time',
      postedBy: 'Priya Sharma',
      postedTime: '1 week ago',
      description: 'Lead our marketing efforts for sustainable technology products. Develop strategies for B2B and B2C markets.',
      requirements: 'MBA in Marketing, 3+ years experience in tech marketing, digital marketing expertise.',
      applicants: 18,
      isRemote: true,
      experience: '3-7 years',
      skills: ['Digital Marketing', 'Strategy', 'B2B Sales', 'Analytics']
    },
    {
      id: '3',
      title: 'UX/UI Designer',
      company: 'FinFlow Startup',
      location: 'Delhi, India',
      salary: '₹6-12 LPA',
      employmentType: 'Full-time',
      postedBy: 'Amit Patel',
      postedTime: '3 days ago',
      description: 'Design intuitive user experiences for our fintech platform. Work closely with product and engineering teams.',
      requirements: 'Portfolio demonstrating UX/UI skills, proficiency in Figma, understanding of fintech industry.',
      applicants: 31,
      isRemote: false,
      experience: '1-4 years',
      skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems']
    },
    {
      id: '4',
      title: 'Data Scientist',
      company: 'Analytics Pro',
      location: 'Hyderabad, India',
      salary: '₹10-18 LPA',
      employmentType: 'Full-time',
      postedBy: 'Sarah Johnson',
      postedTime: '5 days ago',
      description: 'Build machine learning models to derive insights from large datasets. Work on predictive analytics projects.',
      requirements: 'MS/PhD in Data Science, experience with Python, ML frameworks, statistical analysis.',
      applicants: 12,
      isRemote: true,
      experience: '2-6 years',
      skills: ['Python', 'Machine Learning', 'Statistics', 'SQL']
    },
    {
      id: '5',
      title: 'Business Development Manager',
      company: 'StartupHub',
      location: 'Pune, India',
      salary: '₹8-14 LPA',
      employmentType: 'Full-time',
      postedBy: 'Vikram Singh',
      postedTime: '1 day ago',
      description: 'Drive business growth through strategic partnerships and client acquisition. Build relationships with key stakeholders.',
      requirements: 'MBA preferred, 3+ years in business development, excellent communication skills.',
      applicants: 8,
      isRemote: false,
      experience: '3-8 years',
      skills: ['Sales', 'Partnerships', 'Negotiation', 'Strategy']
    }
  ];

  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = locationFilter === 'all' || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating job:', newJob);
    setIsCreateModalOpen(false);
    setNewJob({
      title: '',
      description: '',
      requirements: '',
      location: '',
      salary: '',
      employmentType: 'full-time'
    });
  };

  const handleApply = (job: any) => {
    setSelectedJob(job);
    setIsApplicationModalOpen(true);
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting application:', application, 'for job:', selectedJob?.id);
    setIsApplicationModalOpen(false);
    setApplication({
      applicantName: '',
      applicantEmail: '',
      applicantPhone: '',
      coverLetter: ''
    });
  };

  const shareJob = (job: any) => {
    const url = `${window.location.origin}/jobs/${job.id}`;
    navigator.clipboard.writeText(url);
    // In real app, show toast notification
    alert('Job link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {/* Jobs Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground" data-testid="text-jobs-title">
                  Job Opportunities
                </h1>
                <p className="text-muted-foreground mt-1">
                  Discover career opportunities and post job openings for your startup
                </p>
              </div>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-post-job">
                    <Plus className="h-4 w-4 mr-2" />
                    Post Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl" data-testid="modal-create-job">
                  <DialogHeader>
                    <DialogTitle>Post New Job</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateJob} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="job-title">Job Title</Label>
                        <Input
                          id="job-title"
                          value={newJob.title}
                          onChange={(e) => setNewJob(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g. Software Engineer"
                          required
                          data-testid="input-job-title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="employment-type">Employment Type</Label>
                        <Select value={newJob.employmentType} onValueChange={(value) => setNewJob(prev => ({ ...prev, employmentType: value }))}>
                          <SelectTrigger data-testid="select-employment-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full-time">Full-time</SelectItem>
                            <SelectItem value="part-time">Part-time</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="internship">Internship</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="job-location">Location</Label>
                        <Input
                          id="job-location"
                          value={newJob.location}
                          onChange={(e) => setNewJob(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="e.g. Bangalore, India"
                          required
                          data-testid="input-job-location"
                        />
                      </div>
                      <div>
                        <Label htmlFor="job-salary">Salary Range</Label>
                        <Input
                          id="job-salary"
                          value={newJob.salary}
                          onChange={(e) => setNewJob(prev => ({ ...prev, salary: e.target.value }))}
                          placeholder="e.g. ₹8-15 LPA"
                          data-testid="input-job-salary"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="job-description">Job Description</Label>
                      <Textarea
                        id="job-description"
                        value={newJob.description}
                        onChange={(e) => setNewJob(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the role, responsibilities, and what you're looking for..."
                        rows={4}
                        required
                        data-testid="textarea-job-description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="job-requirements">Requirements</Label>
                      <Textarea
                        id="job-requirements"
                        value={newJob.requirements}
                        onChange={(e) => setNewJob(prev => ({ ...prev, requirements: e.target.value }))}
                        placeholder="List the skills, experience, and qualifications needed..."
                        rows={3}
                        required
                        data-testid="textarea-job-requirements"
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" data-testid="button-submit-job">
                        Post Job
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search jobs by title, company, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-jobs"
                />
              </div>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-location-filter">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="bangalore">Bangalore</SelectItem>
                  <SelectItem value="mumbai">Mumbai</SelectItem>
                  <SelectItem value="delhi">Delhi</SelectItem>
                  <SelectItem value="hyderabad">Hyderabad</SelectItem>
                  <SelectItem value="pune">Pune</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Jobs List */}
          <div className="grid gap-6">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow" data-testid={`card-job-${job.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <CardTitle className="text-xl" data-testid={`text-job-title-${job.id}`}>
                            {job.title}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {job.employmentType}
                          </Badge>
                          {job.isRemote && (
                            <Badge className="text-xs bg-blue-100 text-blue-800">Remote</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-1" />
                            <span data-testid={`text-job-company-${job.id}`}>{job.company}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            <span>{job.salary}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{job.postedTime}</span>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Posted by {job.postedBy}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => shareJob(job)} data-testid={`button-share-${job.id}`}>
                        <Share className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground mb-4" data-testid={`text-job-description-${job.id}`}>
                      {job.description}
                    </p>
                    
                    <div className="mb-4">
                      <h4 className="font-medium text-foreground mb-2">Requirements:</h4>
                      <p className="text-sm text-muted-foreground">{job.requirements}</p>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-foreground mb-2">Skills:</h4>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-1" />
                        <span data-testid={`text-job-applicants-${job.id}`}>
                          {job.applicants} applicants
                        </span>
                        <span className="mx-2">•</span>
                        <span>{job.experience} experience</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" data-testid={`button-save-${job.id}`}>
                          Save
                        </Button>
                        <Button size="sm" onClick={() => handleApply(job)} data-testid={`button-apply-${job.id}`}>
                          Apply Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <div className="text-muted-foreground" data-testid="text-no-jobs-found">
                  {searchTerm || locationFilter !== 'all' 
                    ? 'No jobs found matching your criteria.' 
                    : 'No job openings available yet.'
                  }
                </div>
                <Button 
                  className="mt-4" 
                  onClick={() => setIsCreateModalOpen(true)}
                  data-testid="button-post-first-job"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Post Your First Job
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Application Modal */}
      <Dialog open={isApplicationModalOpen} onOpenChange={setIsApplicationModalOpen}>
        <DialogContent data-testid="modal-job-application">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitApplication} className="space-y-4">
            <div>
              <Label htmlFor="applicant-name">Full Name</Label>
              <Input
                id="applicant-name"
                value={application.applicantName}
                onChange={(e) => setApplication(prev => ({ ...prev, applicantName: e.target.value }))}
                placeholder="Enter your full name"
                required
                data-testid="input-applicant-name"
              />
            </div>
            <div>
              <Label htmlFor="applicant-email">Email Address</Label>
              <Input
                id="applicant-email"
                type="email"
                value={application.applicantEmail}
                onChange={(e) => setApplication(prev => ({ ...prev, applicantEmail: e.target.value }))}
                placeholder="Enter your email"
                required
                data-testid="input-applicant-email"
              />
            </div>
            <div>
              <Label htmlFor="applicant-phone">Phone Number</Label>
              <Input
                id="applicant-phone"
                type="tel"
                value={application.applicantPhone}
                onChange={(e) => setApplication(prev => ({ ...prev, applicantPhone: e.target.value }))}
                placeholder="Enter your phone number"
                data-testid="input-applicant-phone"
              />
            </div>
            <div>
              <Label htmlFor="cover-letter">Cover Letter</Label>
              <Textarea
                id="cover-letter"
                value={application.coverLetter}
                onChange={(e) => setApplication(prev => ({ ...prev, coverLetter: e.target.value }))}
                placeholder="Tell us why you're the perfect fit for this role..."
                rows={4}
                required
                data-testid="textarea-cover-letter"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setIsApplicationModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="button-submit-application">
                Submit Application
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
