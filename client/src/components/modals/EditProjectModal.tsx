import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Project } from "@shared/schema";
import { Upload, X, Plus } from "lucide-react";

interface EditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
}

export function EditProjectModal({ open, onOpenChange, project }: EditProjectModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    briefDescription: '',
    businessPlan: '',
    marketAnalysis: '',
    competitiveAdvantage: '',
    teamInfo: '',
    financialProjections: '',
    riskAssessment: '',
    useOfFunds: '',
    exitStrategy: '',
    images: [] as string[],
    videos: [] as string[]
  });
  
  const [newImage, setNewImage] = useState('');
  const [newVideo, setNewVideo] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        briefDescription: project.briefDescription || '',
        businessPlan: project.businessPlan || '',
        marketAnalysis: project.marketAnalysis || '',
        competitiveAdvantage: project.competitiveAdvantage || '',
        teamInfo: project.teamInfo || '',
        financialProjections: project.financialProjections || '',
        riskAssessment: project.riskAssessment || '',
        useOfFunds: project.useOfFunds || '',
        exitStrategy: project.exitStrategy || '',
        images: project.images || [],
        videos: project.videos || []
      });
    }
  }, [project]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/projects/${project?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Project Updated",
        description: "Your project has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', project?.id] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update project",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!project) return;

    await updateMutation.mutateAsync(formData);
  };

  const addImage = () => {
    if (newImage.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImage.trim()]
      }));
      setNewImage('');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addVideo = () => {
    if (newVideo.trim()) {
      setFormData(prev => ({
        ...prev,
        videos: [...prev.videos, newVideo.trim()]
      }));
      setNewVideo('');
    }
  };

  const removeVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-edit-project">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update your project details, business plan, team information, and marketing content.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="business">Business Plan</TabsTrigger>
              <TabsTrigger value="team">Team & Finance</TabsTrigger>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  data-testid="input-edit-title"
                />
              </div>

              <div>
                <Label htmlFor="briefDescription">Brief Description</Label>
                <Input
                  id="briefDescription"
                  value={formData.briefDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, briefDescription: e.target.value }))}
                  placeholder="One-line summary of your project"
                  data-testid="input-edit-brief-description"
                />
              </div>

              <div>
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of your project"
                  rows={4}
                  required
                  data-testid="textarea-edit-description"
                />
              </div>
            </TabsContent>

            <TabsContent value="business" className="space-y-4">
              <div>
                <Label htmlFor="businessPlan">Business Plan</Label>
                <Textarea
                  id="businessPlan"
                  value={formData.businessPlan}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessPlan: e.target.value }))}
                  placeholder="Describe your business model and strategy"
                  rows={4}
                  data-testid="textarea-edit-business-plan"
                />
              </div>

              <div>
                <Label htmlFor="marketAnalysis">Market Analysis</Label>
                <Textarea
                  id="marketAnalysis"
                  value={formData.marketAnalysis}
                  onChange={(e) => setFormData(prev => ({ ...prev, marketAnalysis: e.target.value }))}
                  placeholder="Market size, target audience, and opportunities"
                  rows={4}
                  data-testid="textarea-edit-market-analysis"
                />
              </div>

              <div>
                <Label htmlFor="competitiveAdvantage">Competitive Advantage</Label>
                <Textarea
                  id="competitiveAdvantage"
                  value={formData.competitiveAdvantage}
                  onChange={(e) => setFormData(prev => ({ ...prev, competitiveAdvantage: e.target.value }))}
                  placeholder="What makes your project unique"
                  rows={3}
                  data-testid="textarea-edit-competitive-advantage"
                />
              </div>

              <div>
                <Label htmlFor="riskAssessment">Risk Assessment</Label>
                <Textarea
                  id="riskAssessment"
                  value={formData.riskAssessment}
                  onChange={(e) => setFormData(prev => ({ ...prev, riskAssessment: e.target.value }))}
                  placeholder="Potential risks and mitigation strategies"
                  rows={3}
                  data-testid="textarea-edit-risk-assessment"
                />
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-4">
              <div>
                <Label htmlFor="teamInfo">Team Information</Label>
                <Textarea
                  id="teamInfo"
                  value={formData.teamInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, teamInfo: e.target.value }))}
                  placeholder="Team members, their roles and experience"
                  rows={4}
                  data-testid="textarea-edit-team-info"
                />
              </div>

              <div>
                <Label htmlFor="financialProjections">Financial Projections</Label>
                <Textarea
                  id="financialProjections"
                  value={formData.financialProjections}
                  onChange={(e) => setFormData(prev => ({ ...prev, financialProjections: e.target.value }))}
                  placeholder="Revenue projections, expenses, and growth plans"
                  rows={4}
                  data-testid="textarea-edit-financial-projections"
                />
              </div>

              <div>
                <Label htmlFor="useOfFunds">Use of Funds</Label>
                <Textarea
                  id="useOfFunds"
                  value={formData.useOfFunds}
                  onChange={(e) => setFormData(prev => ({ ...prev, useOfFunds: e.target.value }))}
                  placeholder="How you plan to use the investment"
                  rows={3}
                  data-testid="textarea-edit-use-of-funds"
                />
              </div>

              <div>
                <Label htmlFor="exitStrategy">Exit Strategy</Label>
                <Textarea
                  id="exitStrategy"
                  value={formData.exitStrategy}
                  onChange={(e) => setFormData(prev => ({ ...prev, exitStrategy: e.target.value }))}
                  placeholder="Long-term vision and exit plans"
                  rows={3}
                  data-testid="textarea-edit-exit-strategy"
                />
              </div>
            </TabsContent>

            <TabsContent value="marketing" className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Marketing Content</h4>
                <p className="text-sm text-blue-800">
                  Add images and videos to showcase your project. Use high-quality visuals to attract investors and supporters.
                </p>
              </div>

              {/* Images Section */}
              <div>
                <Label className="text-base font-medium">Project Images</Label>
                <div className="space-y-3 mt-2">
                  <div className="flex gap-2">
                    <Input
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      placeholder="Enter image URL or path"
                      data-testid="input-add-image"
                    />
                    <Button type="button" onClick={addImage} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {formData.images.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Current Images:</p>
                      {formData.images.map((image, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                          <img 
                            src={image} 
                            alt={`Project image ${index + 1}`}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100';
                            }}
                          />
                          <span className="flex-1 text-sm text-muted-foreground break-all">{image}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeImage(index)}
                            data-testid={`button-remove-image-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Videos Section */}
              <div>
                <Label className="text-base font-medium">Project Videos</Label>
                <div className="space-y-3 mt-2">
                  <div className="flex gap-2">
                    <Input
                      value={newVideo}
                      onChange={(e) => setNewVideo(e.target.value)}
                      placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                      data-testid="input-add-video"
                    />
                    <Button type="button" onClick={addVideo} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {formData.videos.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Current Videos:</p>
                      {formData.videos.map((video, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="flex-1 text-sm text-muted-foreground break-all">{video}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVideo(index)}
                            data-testid={`button-remove-video-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              data-testid="button-save-project"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}