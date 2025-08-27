import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, CreditCard, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Project } from "@shared/schema";

interface SupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
}

export function SupportModal({ open, onOpenChange, project }: SupportModalProps) {
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const supportMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/payments/support", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.paymentUrl && data.formData) {
        // PayUMoney integration - create form and submit to payment gateway
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.paymentUrl;
        
        // Add all form data as hidden inputs
        Object.keys(data.formData).forEach(key => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = data.formData[key];
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
      } else {
        toast({ title: "Support payment initiated successfully!" });
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
        onOpenChange(false);
        resetForm();
      }
    },
    onError: () => {
      toast({ title: "Failed to process support payment", variant: "destructive" });
      setIsProcessing(false);
    }
  });

  const resetForm = () => {
    setAmount("");
    setPhone("");
    setMessage("");
    setIsProcessing(false);
  };

  const handleSupport = async () => {
    if (!project || !amount || !phone) return;

    const supportAmount = parseFloat(amount);
    
    // Validate minimum amount
    if (supportAmount < 10) {
      toast({ 
        title: "Invalid Amount", 
        description: "Minimum support amount is ₹10", 
        variant: "destructive" 
      });
      return;
    }

    const platformFee = supportAmount * 0.02; // 2% platform fee
    const finalAmount = supportAmount - platformFee;

    setIsProcessing(true);

    // Direct PayUMoney integration
    supportMutation.mutate({
      projectId: project.id,
      amount: supportAmount.toString(),
      platformFee: platformFee.toString(),
      finalAmount: finalAmount.toString(),
      phone,
      message,
      type: "support"
    });
  };

  if (!project) return null;

  const supportAmount = parseFloat(amount) || 0;
  const platformFee = supportAmount * 0.02;
  const finalAmount = supportAmount - platformFee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-support-project">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Support Project
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Info */}
          <div className="space-y-2">
            <h3 className="font-medium text-lg">{project.title}</h3>
            <p className="text-sm text-muted-foreground">{project.description}</p>
            <Badge variant="secondary">Donation Support</Badge>
          </div>

          <Separator />

          {/* Support Details */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Support this project with a donation. No equity or stakes involved - just helping entrepreneurs succeed!
            </AlertDescription>
          </Alert>

          {/* Support Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="support-amount">Support Amount (₹)</Label>
              <Input
                id="support-amount"
                type="number"
                placeholder="Enter amount (minimum ₹10)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="10"
                data-testid="input-support-amount"
              />
            </div>

            <div>
              <Label htmlFor="support-phone">Phone Number</Label>
              <Input
                id="support-phone"
                type="tel"
                placeholder="Your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-testid="input-support-phone"
              />
            </div>

            <div>
              <Label htmlFor="support-message">Message (Optional)</Label>
              <Textarea
                id="support-message"
                placeholder="Encourage the entrepreneur..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                data-testid="textarea-support-message"
              />
            </div>
          </div>

          {/* Payment Breakdown */}
          {supportAmount > 0 && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Support Amount:</span>
                <span>₹{supportAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Platform Fee (2%):</span>
                <span>-₹{platformFee.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Amount to Project:</span>
                <span>₹{finalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-support"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSupport}
              disabled={!amount || !phone || supportAmount < 10 || isProcessing}
              className="flex-1 bg-red-500 hover:bg-red-600"
              data-testid="button-confirm-support"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isProcessing ? 'Processing...' : `Support ₹${supportAmount.toLocaleString()}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}