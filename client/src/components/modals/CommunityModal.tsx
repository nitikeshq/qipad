import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CommunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommunityModal({ open, onOpenChange }: CommunityModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'networking',
    isPrivate: false
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check wallet balance and credit requirements for community creation
  const { data: creditCheck, isLoading: creditCheckLoading } = useQuery({
    queryKey: ['/api/credits/check', { action: 'community_create', amount: 100 }],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/credits/check', { action: 'community_create', amount: 100 });
      return response.json();
    },
    enabled: open
  });

  const createCommunityMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/communities', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Community created successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/communities'] });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create community", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'networking',
      isPrivate: false
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user has enough credits
    if (!creditCheck?.hasEnoughCredits) {
      toast({
        title: "Insufficient Credits",
        description: `You need 100 credits to create a community. Your current balance: ${creditCheck?.currentBalance || 0} credits`,
        variant: "destructive",
      });
      return;
    }

    try {
      // First check KYC verification before deducting any credits
      const kycCheckResponse = await apiRequest('GET', '/api/users/kyc-status');
      const kycData = await kycCheckResponse.json();
      
      if (!kycData.isKycComplete) {
        toast({
          title: "KYC Verification Required",
          description: "You must complete KYC verification before creating communities. Please complete your verification in the Documents section.",
          variant: "destructive",
        });
        return;
      }

      // Only deduct credits after KYC verification passes
      const deductResponse = await apiRequest('POST', '/api/credits/deduct', {
        action: 'community_create',
        amount: 100,
        description: 'Community creation (Permanent)',
        referenceType: 'community_creation'
      });

      const deductResult = await deductResponse.json();
      
      if (!deductResult.success) {
        toast({
          title: "Credit Deduction Failed",
          description: deductResult.error || "Unable to deduct credits",
          variant: "destructive",
        });
        return;
      }

      // Proceed with community creation
      createCommunityMutation.mutate(formData);
    } catch (error) {
      console.error('Community creation error:', error);
      toast({
        title: "Error",
        description: "Failed to process community creation",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="modal-create-community">
        <DialogHeader>
          <DialogTitle>Create New Community</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Community Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Startup Founders Network"
              required
              data-testid="input-community-name"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your community's purpose and goals..."
              required
              data-testid="textarea-community-description"
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger data-testid="select-community-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="networking">Networking</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-community">
              Cancel
            </Button>
            <Button type="submit" disabled={createCommunityMutation.isPending} data-testid="button-submit-community">
              {createCommunityMutation.isPending ? 'Creating...' : 'Create Community'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}