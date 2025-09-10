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
import { Shield, Upload, AlertCircle, Wallet, Image } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { SimpleImageUploader } from "@/components/SimpleImageUploader";

interface ProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectModal({ open, onOpenChange }: ProjectModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    industry: '',
    fundingGoal: '',
    minimumInvestment: '',
    campaignDuration: '30'
  });
  const [documents, setDocuments] = useState<{ [key: string]: File | null }>({
    business_pan: null,
    gst_certificate: null,
    incorporation_certificate: null,
    personal_pan: null
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check wallet balance and credit requirements
  const { data: creditCheck, isLoading: creditCheckLoading } = useQuery({
    queryKey: ['/api/credits/check', { action: 'innovation', amount: 100 }],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/credits/check', { action: 'innovation', amount: 100 });
      return response.json();
    },
    enabled: open
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/projects', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Project created successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      onOpenChange(false);
      setFormData({
        title: '',
        description: '',
        industry: '',
        fundingGoal: '',
        minimumInvestment: '',
        campaignDuration: '30'
      });
      setUploadedImages([]);
    },
    onError: (error: any) => {
      console.error('Project creation error:', error);
      const errorMessage = error.message || "Failed to create project";
      toast({ title: errorMessage, variant: "destructive" });
    }
  });

  // Simple image upload handler
  const handleImageUploadComplete = (imageUrl: string) => {
    setUploadedImages(prev => [...prev, imageUrl]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user has enough credits
    if (!creditCheck?.hasEnoughCredits) {
      toast({
        title: "Insufficient Credits",
        description: `You need 100 credits to create an innovation. Your current balance: ${creditCheck?.currentBalance || 0} credits`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Deduct credits first
      const deductResponse = await apiRequest('POST', '/api/credits/deduct', {
        action: 'innovation',
        amount: 100,
        description: 'Innovation creation',
        referenceType: 'innovation_creation'
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

      // Proceed with project creation
      createProjectMutation.mutate({
        ...formData,
        fundingGoal: formData.fundingGoal.toString(),
        minimumInvestment: formData.minimumInvestment.toString(),
        images: uploadedImages,
        campaignDuration: parseInt(formData.campaignDuration)
      });
    } catch (error) {
      console.error('Credit deduction error:', error);
      toast({
        title: "Error",
        description: "Failed to process credit payment",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (documentType: string, file: File | null) => {
    setDocuments(prev => ({ ...prev, [documentType]: file }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-create-project">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="title">Project Name</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter project name"
                required
                data-testid="input-project-title"
              />
            </div>
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Select value={formData.industry} onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}>
                <SelectTrigger data-testid="select-industry">
                  <SelectValue placeholder="Select Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="ecommerce">E-commerce</SelectItem>
                  <SelectItem value="clean-energy">Clean Energy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Project Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your project, its goals, and impact..."
              required
              data-testid="textarea-project-description"
            />
          </div>

          {/* Project Images Upload Section */}
          <div className="col-span-2">
            <Label className="text-base font-medium">Project Images</Label>
            <p className="text-sm text-muted-foreground mb-4">Upload images to showcase your project. These will be displayed in the Investment Opportunities.</p>
            
            <div className="space-y-4">
              <SimpleImageUploader
                onUploadComplete={handleImageUploadComplete}
                buttonClassName="w-full"
              />

              {uploadedImages.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Uploaded Images ({uploadedImages.length})</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Project image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Funding Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="fundingGoal">Funding Goal (₹)</Label>
              <Input
                id="fundingGoal"
                type="number"
                value={formData.fundingGoal}
                onChange={(e) => setFormData(prev => ({ ...prev, fundingGoal: e.target.value }))}
                placeholder="5000000"
                required
                data-testid="input-funding-goal"
              />
            </div>
            <div>
              <Label htmlFor="minimumInvestment">Minimum Investment (₹)</Label>
              <Input
                id="minimumInvestment"
                type="number"
                value={formData.minimumInvestment}
                onChange={(e) => setFormData(prev => ({ ...prev, minimumInvestment: e.target.value }))}
                placeholder="50000"
                required
                data-testid="input-minimum-investment"
              />
            </div>
            <div>
              <Label htmlFor="campaignDuration">Campaign Duration</Label>
              <Select value={formData.campaignDuration} onValueChange={(value) => setFormData(prev => ({ ...prev, campaignDuration: value }))}>
                <SelectTrigger data-testid="select-campaign-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="120">120 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* KYC Documents Section */}
          <div className="bg-secondary/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              <Shield className="inline mr-2 text-primary" />
              KYC Documentation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries({
                business_pan: 'Business PAN',
                gst_certificate: 'GST Certificate',
                incorporation_certificate: 'Incorporation Certificate',
                personal_pan: 'Personal PAN'
              }).map(([key, label]) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <Upload className="mx-auto text-muted-foreground text-2xl mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">Upload {label}</p>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.png"
                      onChange={(e) => handleFileChange(key, e.target.files?.[0] || null)}
                      className="hidden"
                      id={`upload-${key}`}
                      data-testid={`input-upload-${key}`}
                    />
                    <Label htmlFor={`upload-${key}`} className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm">
                        Choose File
                      </Button>
                    </Label>
                    {documents[key] && (
                      <p className="text-xs text-green-600 mt-1" data-testid={`text-file-selected-${key}`}>
                        {documents[key]?.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Credit Information */}
          {!creditCheckLoading && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4" />
                <span className="font-medium">Credit Cost</span>
              </div>
              <div className="text-sm text-muted-foreground mb-3">
                Creating an innovation costs <strong>100 credits</strong>. 
                Your current balance: <strong>{creditCheck?.currentBalance || 0} credits</strong>
              </div>
              {!creditCheck?.hasEnoughCredits && (
                <Alert variant="destructive" data-testid="alert-insufficient-credits">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Insufficient credits! You need {creditCheck?.shortfall || 100} more credits. 
                    <Link href="/wallet">
                      <Button variant="outline" size="sm" className="ml-2 bg-white dark:bg-gray-900 text-red-700 dark:text-red-300 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
                        Top up your wallet
                      </Button>
                    </Link>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-project">
              Cancel
            </Button>
            <Button type="submit" disabled={createProjectMutation.isPending} data-testid="button-submit-project">
              {createProjectMutation.isPending ? 'Creating...' : 'Submit for Review'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
