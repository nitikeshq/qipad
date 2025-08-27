import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { BiddingProject } from "@shared/schema";
import { DollarSign, Clock, FileText } from "lucide-react";

interface ProjectBidModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: BiddingProject;
}

export function ProjectBidModal({ open, onOpenChange, project }: ProjectBidModalProps) {
  const [formData, setFormData] = useState({
    amount: '',
    timeline: '',
    proposal: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitBidMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/project-bids', {
        ...data,
        projectId: project.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Bid submitted successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/project-bids'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to submit bid", 
        description: error.message || "Please make sure you are KYC verified to submit bids",
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setFormData({
      amount: '',
      timeline: '',
      proposal: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitBidMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  const formatBudget = (budget: string) => {
    const amount = parseFloat(budget);
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="modal-submit-bid">
        <DialogHeader>
          <DialogTitle>Submit Bid for "{project.title}"</DialogTitle>
        </DialogHeader>

        {/* Project Summary */}
        <div className="bg-secondary/50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-2">Project Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Budget:</span>
              <span className="font-medium">{formatBudget(project.budget)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Timeline:</span>
              <span className="font-medium">{project.timeline}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium">{project.category.replace('-', ' ')}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            {project.description}
          </p>
          {project.skillsRequired && project.skillsRequired.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-muted-foreground mb-1">Required Skills:</p>
              <div className="flex flex-wrap gap-1">
                {project.skillsRequired.map((skill, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="amount">Your Bid Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Enter your bid amount"
                required
                data-testid="input-bid-amount"
              />
            </div>
            <div>
              <Label htmlFor="timeline">Your Timeline</Label>
              <Input
                id="timeline"
                value={formData.timeline}
                onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                placeholder="2 weeks, 1 month, etc."
                required
                data-testid="input-bid-timeline"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="proposal">Your Proposal</Label>
            <Textarea
              id="proposal"
              rows={6}
              value={formData.proposal}
              onChange={(e) => setFormData(prev => ({ ...prev, proposal: e.target.value }))}
              placeholder="Explain your approach, experience, and why you're the best fit for this project..."
              required
              data-testid="textarea-bid-proposal"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Only KYC verified users can submit bids. Make sure your KYC verification is complete before submitting.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-bid">
              Cancel
            </Button>
            <Button type="submit" disabled={submitBidMutation.isPending} data-testid="button-submit-bid">
              {submitBidMutation.isPending ? 'Submitting...' : 'Submit Bid'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}