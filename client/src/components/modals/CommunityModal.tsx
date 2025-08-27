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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCommunityMutation.mutate(formData);
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