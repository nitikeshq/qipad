import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Project } from "@shared/schema";

interface SupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
}

export function SupportModal({ open, onOpenChange, project }: SupportModalProps) {
  const [amount, setAmount] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const supportMutation = useMutation({
    mutationFn: async (data: {
      projectId: string;
      amount: string;
      type: string;
    }) => {
      const response = await apiRequest('POST', '/api/investments', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Support Payment Initiated!",
        description: "You will be redirected to PayUMoney for payment processing.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/investments'] });
      onOpenChange(false);
      
      // Reset form
      setAmount('');
      setAgreedToTerms(false);
      
      // Redirect to PayUMoney integration (placeholder)
      // This would integrate with actual PayUMoney API
      window.alert('Redirecting to PayUMoney for payment...');
    },
    onError: (error: any) => {
      toast({
        title: "Support Failed",
        description: error.message || "Failed to process support payment",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!project || !amount || !agreedToTerms) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and agree to terms",
        variant: "destructive",
      });
      return;
    }

    const supportAmount = parseFloat(amount);
    if (isNaN(supportAmount) || supportAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid support amount",
        variant: "destructive",
      });
      return;
    }

    await supportMutation.mutateAsync({
      projectId: project.id,
      amount: amount,
      type: "support"
    });
  };

  if (!project) return null;

  const supportAmount = parseFloat(amount) || 0;
  const platformFee = supportAmount * 0.02; // 2% platform fee
  const projectReceives = supportAmount - platformFee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-support">
        <DialogHeader>
          <DialogTitle>Support Project</DialogTitle>
          <DialogDescription>
            Support this project with a donation. Payment will be processed through PayUMoney.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <img 
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=80" 
              alt="Project" 
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div>
              <h3 className="font-semibold text-foreground" data-testid="text-support-project-title">
                {project.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                Target: ₹{parseFloat(project.fundingGoal).toLocaleString()} | Raised: ₹{parseFloat(project.currentFunding || '0').toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-green-900 mb-2">How Support Works</h4>
          <div className="text-sm text-green-800 space-y-1">
            <p>• Enter the amount you want to support this project</p>
            <p>• Payment will be processed through PayUMoney gateway</p>
            <p>• 2% platform fee will be deducted, rest goes to the project</p>
            <p>• Funds will be released after the investment round is over</p>
            <p>• No equity stakes - this is pure support</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Support Amount (₹) *</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter support amount"
              min="1"
              required
              data-testid="input-support-amount"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum: ₹1
            </p>
          </div>

          <div className="bg-secondary/30 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Payment Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Support Amount:</span>
                <span className="font-medium" data-testid="text-support-amount">₹{supportAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee (2%):</span>
                <span className="font-medium text-orange-600" data-testid="text-platform-fee">₹{platformFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground">Project Receives:</span>
                <span className="font-medium text-green-600" data-testid="text-project-receives">₹{projectReceives.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox 
              id="terms" 
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              data-testid="checkbox-support-terms"
            />
            <Label htmlFor="terms" className="text-sm text-muted-foreground">
              I understand this is a support payment and agree to PayUMoney's terms and conditions. 2% platform fee will be deducted.
            </Label>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700" 
            disabled={supportMutation.isPending || !agreedToTerms}
            data-testid="button-submit-support"
          >
            {supportMutation.isPending ? 'Processing...' : 'Proceed to PayUMoney'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}