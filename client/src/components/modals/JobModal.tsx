import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, X } from "lucide-react";

interface JobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobModal({ open, onOpenChange }: JobModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    location: '',
    jobType: 'full-time',
    salaryMin: '',
    salaryMax: '',
    experienceRequired: ''
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createJobMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/jobs', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Job posted successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Job creation error:', error);
      const errorMessage = error.message || "Failed to post job";
      toast({ title: errorMessage, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      description: '',
      location: '',
      jobType: 'full-time',
      salaryMin: '',
      salaryMax: '',
      experienceRequired: ''
    });
    setSkills([]);
    setNewSkill('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const salary = formData.salaryMin && formData.salaryMax 
      ? `₹${formData.salaryMin} - ₹${formData.salaryMax}` 
      : formData.salaryMin 
        ? `₹${formData.salaryMin}+` 
        : '';
    
    createJobMutation.mutate({
      title: formData.title,
      description: formData.description,
      requirements: skills.join(', '),
      location: formData.location,
      salary: salary
    });
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-post-job">
        <DialogHeader>
          <DialogTitle>Post New Job</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Job Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Software Engineer"
                required
                data-testid="input-job-title"
              />
            </div>
            <div>
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Tech Corp Inc."
                required
                data-testid="input-job-company"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the role, responsibilities, and requirements..."
              required
              data-testid="textarea-job-description"
            />
          </div>

          {/* Location and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Mumbai, India"
                required
                data-testid="input-job-location"
              />
            </div>
            <div>
              <Label htmlFor="jobType">Job Type</Label>
              <Select value={formData.jobType} onValueChange={(value) => setFormData(prev => ({ ...prev, jobType: value }))}>
                <SelectTrigger data-testid="select-job-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Salary Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="salaryMin">Minimum Salary (₹)</Label>
              <Input
                id="salaryMin"
                type="number"
                value={formData.salaryMin}
                onChange={(e) => setFormData(prev => ({ ...prev, salaryMin: e.target.value }))}
                placeholder="500000"
                data-testid="input-salary-min"
              />
            </div>
            <div>
              <Label htmlFor="salaryMax">Maximum Salary (₹)</Label>
              <Input
                id="salaryMax"
                type="number"
                value={formData.salaryMax}
                onChange={(e) => setFormData(prev => ({ ...prev, salaryMax: e.target.value }))}
                placeholder="1000000"
                data-testid="input-salary-max"
              />
            </div>
            <div>
              <Label htmlFor="experienceRequired">Experience (Years)</Label>
              <Input
                id="experienceRequired"
                type="number"
                value={formData.experienceRequired}
                onChange={(e) => setFormData(prev => ({ ...prev, experienceRequired: e.target.value }))}
                placeholder="3"
                data-testid="input-experience-required"
              />
            </div>
          </div>

          {/* Required Skills */}
          <div>
            <Label>Required Skills</Label>
            <div className="flex gap-2 mb-3">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                data-testid="input-add-skill"
              />
              <Button type="button" onClick={addSkill} variant="outline" data-testid="button-add-skill">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground text-sm rounded-full"
                  data-testid={`tag-skill-${index}`}
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="hover:text-primary-foreground/80"
                    data-testid={`button-remove-skill-${index}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-job">
              Cancel
            </Button>
            <Button type="submit" disabled={createJobMutation.isPending} data-testid="button-submit-job">
              {createJobMutation.isPending ? 'Posting...' : 'Post Job'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}