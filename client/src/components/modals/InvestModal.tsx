import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TrendingUp, Calculator, Info } from "lucide-react";

interface InvestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: any;
}

export function InvestModal({ open, onOpenChange, project }: InvestModalProps) {
  const [amount, setAmount] = useState("");
  const [expectedStakes, setExpectedStakes] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const investMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/payments/invest", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.paymentUrl) {
        // Redirect to PayUMoney payment gateway
        window.location.href = data.paymentUrl;
      } else {
        toast({ title: "Investment payment initiated successfully!" });
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
        onOpenChange(false);
        resetForm();
      }
    },
    onError: () => {
      toast({ title: "Failed to process investment payment", variant: "destructive" });
      setIsProcessing(false);
    }
  });

  const resetForm = () => {
    setAmount("");
    setExpectedStakes("");
    setPhone("");
    setMessage("");
    setIsProcessing(false);
  };

  const handleInvest = async () => {
    if (!project || !amount || !expectedStakes || !phone) return;

    const investmentAmount = parseFloat(amount);
    const stakePercentage = parseFloat(expectedStakes);

    setIsProcessing(true);

    // Direct PayUMoney integration for investment
    investMutation.mutate({
      projectId: project.id,
      amount: investmentAmount,
      expectedStakes: stakePercentage,
      phone,
      message,
      type: "invest"
    });
  };

  if (!project) return null;

  const investmentAmount = parseFloat(amount) || 0;
  const stakePercentage = parseFloat(expectedStakes) || 0;
  const currentValuation = project.fundingGoal || 1000000;
  const impliedValuation = stakePercentage > 0 ? (investmentAmount / stakePercentage) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" data-testid="dialog-invest-project">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Invest in Project
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pb-4">
          {/* Project Info */}
          <div className="space-y-2">
            <h3 className="font-medium text-lg">{project.title}</h3>
            <p className="text-sm text-muted-foreground">{project.description}</p>
            <Badge variant="default">Equity Investment</Badge>
          </div>

          <Separator />

          {/* Investment Details */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You're making an equity investment. The project owner will review your investment proposal.
              Payment will be processed through PayUMoney gateway.
            </AlertDescription>
          </Alert>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="investment-amount">Investment Amount (₹)</Label>
            <Input
              id="investment-amount"
              type="number"
              placeholder="Enter amount to invest"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              data-testid="input-investment-amount"
            />
          </div>

          {/* Expected Stakes Input */}
          <div className="space-y-2">
            <Label htmlFor="expected-stakes">Expected Equity Stake (%)</Label>
            <Input
              id="expected-stakes"
              type="number"
              step="0.1"
              placeholder="Enter expected equity percentage"
              value={expectedStakes}
              onChange={(e) => setExpectedStakes(e.target.value)}
              data-testid="input-expected-stakes"
            />
          </div>

          {/* Valuation Calculator */}
          {investmentAmount > 0 && stakePercentage > 0 && (
            <Alert>
              <Calculator className="h-4 w-4" />
              <AlertDescription>
                <strong>Investment Analysis:</strong><br />
                • Your Investment: ₹{investmentAmount.toLocaleString()}<br />
                • Expected Equity: {stakePercentage}%<br />
                • Implied Valuation: ₹{impliedValuation.toLocaleString()}<br />
                • Project Goal: ₹{project.fundingGoal?.toLocaleString()}
              </AlertDescription>
            </Alert>
          )}

          {/* Contact Phone */}
          <div className="space-y-2">
            <Label htmlFor="investor-phone">Contact Phone</Label>
            <Input
              id="investor-phone"
              type="tel"
              placeholder="Your phone number for project owner"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              data-testid="input-investor-phone"
            />
          </div>

          {/* Investment Message */}
          <div className="space-y-2">
            <Label htmlFor="investment-message">Message to Project Owner</Label>
            <Textarea
              id="investment-message"
              placeholder="Introduce yourself and explain your investment interest..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              data-testid="textarea-investment-message"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-investment"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleInvest}
              disabled={!amount || !expectedStakes || !phone || isProcessing}
              data-testid="button-submit-investment"
            >
              {isProcessing ? "Processing..." : `Invest ₹${investmentAmount.toLocaleString()}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}