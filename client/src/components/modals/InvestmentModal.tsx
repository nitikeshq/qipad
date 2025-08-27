import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Project } from "@shared/schema";

interface InvestmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
}

export function InvestmentModal({ open, onOpenChange, project }: InvestmentModalProps) {
  const [amount, setAmount] = useState('');
  const [percentage, setPercentage] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const investMutation = useMutation({
    mutationFn: async (data: {
      projectId: string;
      amount: string;
      expectedStakes: string;
      investorPhone: string;
      message: string;
    }) => {
      const response = await apiRequest('POST', '/api/investments', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Investment Interest Submitted!",
        description: "Your investment request has been sent to the project owner for review.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/investments'] });
      onOpenChange(false);
      // Reset form
      setAmount('');
      setPercentage('');
      setPhone('');
      setMessage('');
      setAgreedToTerms(false);
    },
    onError: () => {
      toast({
        title: "Failed to submit investment request",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !agreedToTerms || !user) return;

    if (!amount || !percentage || !phone) {
      toast({
        title: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    const amountNum = parseFloat(amount);
    const percentageNum = parseFloat(percentage);

    if (amountNum <= 0 || percentageNum <= 0 || percentageNum > 100) {
      toast({
        title: "Please enter valid amounts",
        description: "Amount must be positive and percentage must be between 1-100%",
        variant: "destructive"
      });
      return;
    }

    investMutation.mutate({
      projectId: project.id,
      amount,
      expectedStakes: percentage,
      investorPhone: phone,
      message
    });
  };

  const investmentAmount = parseFloat(amount) || 0;
  const platformFee = investmentAmount * 0.02;

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-investment">
        <DialogHeader>
          <DialogTitle>Express Investment Interest</DialogTitle>
          <DialogDescription>
            Submit your investment interest for this project. No payment required - this is just to express interest.
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
              <h3 className="font-semibold text-foreground" data-testid="text-investment-project-title">
                {project.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                Target: ₹{parseFloat(project.fundingGoal).toLocaleString()} | Raised: ₹{parseFloat(project.currentFunding || '0').toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 mb-2">How Investment Works</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Express your investment interest with amount and expected stake percentage</p>
            <p>• Project owner will review and may approve your request</p>
            <p>• Upon approval, you'll discuss terms and finalize the investment</p>
            <p>• A 2% platform fee is expected upon successful deal closure</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Investment Amount (₹) *</Label>
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
                Minimum: ₹{parseFloat(project.minimumInvestment).toLocaleString()}
              </p>
            </div>

            <div>
              <Label htmlFor="percentage">Expected Stake (%) *</Label>
              <Input
                id="percentage"
                type="number"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="5"
                min="0.1"
                max="100"
                step="0.1"
                required
                data-testid="input-investment-percentage"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Equity percentage you expect
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Contact Phone *</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              required
              data-testid="input-investor-phone"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Project owner will contact you on this number
            </p>
          </div>

          <div>
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Why are you interested in this project? Any specific terms or questions?"
              rows={3}
              data-testid="input-investment-message"
            />
          </div>

          <div className="bg-secondary/30 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Investment Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Investment Amount:</span>
                <span className="font-medium" data-testid="text-investment-amount">₹{investmentAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Stake:</span>
                <span className="font-medium" data-testid="text-expected-stake">{percentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee (2% on success):</span>
                <span className="font-medium text-orange-600" data-testid="text-platform-fee">₹{platformFee.toLocaleString()}</span>
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
              I understand this is an investment interest (not payment) and agree to pay 2% platform fee upon successful deal closure
            </Label>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={investMutation.isPending || !agreedToTerms}
            data-testid="button-submit-interest"
          >
            {investMutation.isPending ? 'Submitting...' : 'Submit Investment Interest'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
