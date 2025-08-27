import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, Clock, AlertCircle, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function DocumentsPage() {
  const { data: documents = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/documents']
  });
  
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const uploadMutation = useMutation({
    mutationFn: async ({ file, documentType }: { file: File; documentType: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      
      return await apiRequest('POST', '/api/documents', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded successfully and is under review.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleUploadClick = (documentType: string) => {
    const fileInput = fileInputRefs.current[documentType];
    if (fileInput) {
      fileInput.click();
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload PDF, JPEG, or PNG files only.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload files smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      uploadMutation.mutate({ file, documentType });
    }
  };

  const getStatusIcon = (isVerified: boolean) => {
    if (isVerified) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = (isVerified: boolean) => {
    return isVerified ? 'Verified' : 'Pending Review';
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'business_pan': 'Business PAN',
      'gst_certificate': 'GST Certificate',
      'incorporation_certificate': 'Incorporation Certificate',
      'personal_pan': 'Personal PAN'
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">My KYC</h1>
              <p className="text-muted-foreground">Manage your KYC and verification documents</p>
            </div>

            {/* KYC Application Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-blue-900">Complete Your KYC Verification</h2>
              </div>
              <p className="text-blue-800 mb-4">
                To unlock all features of Qipad including project creation, investment opportunities, and community participation, 
                please complete your KYC (Know Your Customer) verification by uploading the required documents below.
              </p>
              <div className="bg-blue-100 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Required documents:</strong> Upload clear images of your PAN card, GST certificate (for business), 
                  and incorporation certificate to complete verification.
                </p>
              </div>
            </div>

            {/* Upload Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload KYC Documents
                </CardTitle>
                <CardDescription>
                  Upload clear, readable images of your verification documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { type: 'personal_pan', label: 'Personal PAN Card', required: true },
                    { type: 'business_pan', label: 'Business PAN Card', required: false },
                    { type: 'gst_certificate', label: 'GST Certificate', required: false },
                    { type: 'incorporation_certificate', label: 'Incorporation Certificate', required: false }
                  ].map((doc) => (
                    <div key={doc.type} className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-secondary/50 transition-colors">
                      <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-sm font-medium mb-1">{doc.label}</p>
                      {doc.required && (
                        <p className="text-xs text-red-600 mb-3">Required</p>
                      )}
                      <input
                        ref={(el) => (fileInputRefs.current[doc.type] = el)}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileChange(e, doc.type)}
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        data-testid={`button-upload-${doc.type}`}
                        onClick={() => handleUploadClick(doc.type)}
                        disabled={uploadMutation.isPending}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Document Guidelines:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Ensure documents are clearly visible and not blurred</li>
                    <li>• Upload high-quality images (JPG, PNG formats)</li>
                    <li>• Make sure all text and details are readable</li>
                    <li>• File size should be less than 5MB per document</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Documents List */}
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading documents...</div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                    <p>No documents uploaded yet</p>
                    <p className="text-sm mt-2">Upload your KYC documents to get verified</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <h3 className="font-medium">{getDocumentTypeLabel(doc.documentType)}</h3>
                            <p className="text-sm text-muted-foreground">{doc.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(doc.isVerified)}
                            <Badge variant={doc.isVerified ? 'default' : 'secondary'}>
                              {getStatusText(doc.isVerified)}
                            </Badge>
                          </div>
                          <Button size="sm" variant="outline" data-testid={`button-download-${doc.id}`}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verification Status */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">Required Documents</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Business PAN Card
                      </li>
                      <li className="flex items-center">
                        <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                        GST Certificate
                      </li>
                      <li className="flex items-center">
                        <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                        Incorporation Certificate
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Personal PAN Card
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Verification Benefits</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Access to premium investor networks</li>
                      <li>• Higher funding limits</li>
                      <li>• Verified badge on profile</li>
                      <li>• Priority support</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}