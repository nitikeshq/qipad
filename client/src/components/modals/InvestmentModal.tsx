import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Project } from "@shared/schema";

interface InvestmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
}

export function InvestmentModal({ open, onOpenChange, project }: InvestmentModalProps) {
  const [amount, setAmount] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const investMutation = useMutation({
    mutationFn: async (data: { projectId: string; amount: string }) => {
      const response = await apiRequest('POST', '/api/investments', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Investment created successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      onOpenChange(false);
      setAmount('');
      setAgreedToTerms(false);
    },
    onError: () => {
      toast({ title: "Failed to create investment", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !agreedToTerms) return;

    investMutation.mutate({
      projectId: project.id,
      amount
    });
  };

  const investmentAmount = parseFloat(amount) || 0;
  const platformFee = investmentAmount * 0.02;
  const totalAmount = investmentAmount + platformFee;

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="modal-investment">
        <DialogHeader>
          <DialogTitle>Invest in Project</DialogTitle>
        </DialogHeader>

        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <img 
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=80" 
              alt="Project" 
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div>
              <h3 className="font-semibold text-foreground" data-testid="text-investment-project-title">
                {project.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                Target: ₹{parseFloat(project.fundingGoal).toLocaleString()} | Raised: ₹{parseFloat(project.currentFunding || '0').toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Investment Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100000"
              min={project.minimumInvestment}
              required
              data-testid="input-investment-amount"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum investment: ₹{parseFloat(project.minimumInvestment).toLocaleString()}
            </p>
          </div>

          <div className="bg-secondary/30 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Investment Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Investment Amount:</span>
                <span className="font-medium" data-testid="text-investment-amount">₹{investmentAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee (2%):</span>
                <span className="font-medium" data-testid="text-platform-fee">₹{platformFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-medium">Total Amount:</span>
                <span className="font-bold" data-testid="text-total-amount">₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox 
              id="terms" 
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              data-testid="checkbox-investment-terms"
            />
            <Label htmlFor="terms" className="text-sm text-muted-foreground">
              I understand the risks involved and agree to the <a href="#" className="text-primary hover:underline">Investment Terms</a>
            </Label>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={investMutation.isPending || !agreedToTerms}
            data-testid="button-proceed-payment"
          >
            {investMutation.isPending ? 'Processing...' : 'Proceed to Payment'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
