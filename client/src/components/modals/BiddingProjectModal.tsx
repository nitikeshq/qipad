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

interface BiddingProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BiddingProjectModal({ open, onOpenChange }: BiddingProjectModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'web-development',
    budget: '',
    timeline: '',
    requirements: ''
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createBiddingProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/bidding-projects', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Project posted successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/bidding-projects'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Bidding project creation error:', error);
      const errorMessage = error.message || "Failed to post project";
      toast({ title: errorMessage, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'web-development',
      budget: '',
      timeline: '',
      requirements: ''
    });
    setSkills([]);
    setNewSkill('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBiddingProjectMutation.mutate({
      ...formData,
      budget: formData.budget.toString(),
      skillsRequired: skills
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-post-bidding-project">
        <DialogHeader>
          <DialogTitle>Post Project for Bidding</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Project Information */}
          <div>
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="E-commerce Website Development"
              required
              data-testid="input-project-title"
            />
          </div>

          <div>
            <Label htmlFor="description">Project Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what you need to be done, project scope, deliverables..."
              required
              data-testid="textarea-project-description"
            />
          </div>

          {/* Category and Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger data-testid="select-project-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web-development">Web Development</SelectItem>
                  <SelectItem value="mobile-development">Mobile Development</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="content-writing">Content Writing</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="data-analysis">Data Analysis</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="budget">Budget (₹)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                placeholder="50000"
                required
                data-testid="input-project-budget"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="timeline">Timeline</Label>
            <Input
              id="timeline"
              value={formData.timeline}
              onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
              placeholder="2 weeks, 1 month, 3 months, etc."
              required
              data-testid="input-project-timeline"
            />
          </div>

          <div>
            <Label htmlFor="requirements">Additional Requirements</Label>
            <Textarea
              id="requirements"
              rows={3}
              value={formData.requirements}
              onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
              placeholder="Any specific requirements, technologies, or constraints..."
              data-testid="textarea-project-requirements"
            />
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-project">
              Cancel
            </Button>
            <Button type="submit" disabled={createBiddingProjectMutation.isPending} data-testid="button-submit-project">
              {createBiddingProjectMutation.isPending ? 'Posting...' : 'Post Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}