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
  const { data: user } = useQuery<any>({
    queryKey: ['/api/user']
  });
  
  const { data: documents = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/documents']
  });
  
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [uploadingStates, setUploadingStates] = useState<{ [key: string]: boolean }>({});
  
  const uploadMutation = useMutation({
    mutationFn: async ({ file, documentType }: { file: File; documentType: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      
      // Use native fetch for file upload as apiRequest may not handle FormData properly
      const token = localStorage.getItem('token');
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setUploadingStates(prev => ({ ...prev, [variables.documentType]: false }));
      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded successfully and is under review.",
      });
    },
    onError: (error: any, variables) => {
      setUploadingStates(prev => ({ ...prev, [variables.documentType]: false }));
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
      
      // Set uploading state for this specific document type
      setUploadingStates(prev => ({ ...prev, [documentType]: true }));
      uploadMutation.mutate({ file, documentType });
    }
    
    // Reset the input value so the same file can be selected again if needed
    event.target.value = '';
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
      'personal_pan': 'Personal PAN',
      'company_pan': 'Company PAN Card',
      'company_gst': 'Company GST Certificate',
      'company_incorporation': 'Company Incorporation Certificate'
    };
    return labels[type] || type;
  };

  // Define document types with categories
  const personalDocumentTypes = [
    { key: 'personal_pan', label: 'Personal PAN Card', required: true },
  ];

  const companyDocumentTypes = [
    { key: 'company_pan', label: 'Company PAN Card', required: true },
    { key: 'company_gst', label: 'GST Certificate', required: true },
    { key: 'company_incorporation', label: 'Incorporation Certificate', required: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-documents-title">My KYC</h1>
                  <p className="text-muted-foreground">Manage your KYC and verification documents</p>
                </div>
                <div className="flex items-center gap-2">
                  {user?.isVerified && (
                    <Badge className="bg-green-100 text-green-800 border-green-200" data-testid="badge-kyc-verified">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      KYC Verified
                    </Badge>
                  )}
                  {user?.isKycComplete && !user?.isVerified && (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200" data-testid="badge-kyc-pending">
                      <Clock className="h-3 w-3 mr-1" />
                      Under Review
                    </Badge>
                  )}
                  {!user?.isVerified && !user?.isKycComplete && (
                    <Badge className="bg-red-100 text-red-800 border-red-200" data-testid="badge-kyc-not-verified">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Not Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* KYC Application Notice - only show if not verified */}
            {!user?.isVerified && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-center mb-4">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-semibold text-blue-900">Complete Your KYC Verification</h2>
                </div>
                <p className="text-blue-800 mb-4">
                  To unlock all features of Qipad including innovation creation, investment opportunities, and community participation, 
                  please complete your KYC (Know Your Customer) verification by uploading the required documents below.
                </p>
                <div className="bg-blue-100 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Personal KYC:</strong> Upload your Personal PAN card for basic platform access.<br />
                    <strong>Company KYC:</strong> Upload Business PAN, GST certificate, and incorporation certificate for company features.
                  </p>
                </div>
              </div>
            )}

            {/* Verification Success Notice - show if verified */}
            {user?.isVerified && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <h2 className="text-lg font-semibold text-green-900">KYC Verification Complete</h2>
                </div>
                <p className="text-green-800 mb-4">
                  Congratulations! Your KYC verification has been successfully completed. You now have access to all Qipad features including innovation creation, investment opportunities, and full community participation.
                </p>
                <div className="bg-green-100 rounded-md p-3">
                  <p className="text-sm text-green-800">
                    <strong>Benefits unlocked:</strong> Full platform access, verified badge, priority support, and enhanced investment opportunities.
                  </p>
                </div>
              </div>
            )}

            {/* Personal KYC Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Personal KYC Documents
                </CardTitle>
                <CardDescription>
                  Upload your personal verification documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {personalDocumentTypes.map((doc) => {
                    const uploadedDoc = documents.find((d: any) => d.documentType === doc.key);
                    const isUploaded = !!uploadedDoc;
                    
                    return (
                      <div key={doc.key} className={`border-2 border-dashed rounded-lg p-6 text-center hover:bg-secondary/50 transition-colors ${
                        isUploaded ? 'border-green-300 bg-green-50/50' : 'border-border'
                      }`}>
                        <div className="relative inline-block">
                          <FileText className={`mx-auto h-10 w-10 mb-3 ${isUploaded ? 'text-green-600' : 'text-muted-foreground'}`} />
                          {isUploaded && uploadedDoc.isVerified && (
                            <CheckCircle className="absolute -top-1 -right-1 h-5 w-5 text-green-500 bg-white rounded-full" />
                          )}
                        </div>
                        <p className="text-sm font-medium mb-1">{doc.label}</p>
                        {doc.required && (
                          <p className="text-xs text-red-600 mb-2">Required</p>
                        )}
                        {isUploaded ? (
                          <div className="mb-3">
                            <p className="text-xs text-green-700 font-medium mb-1">✓ Uploaded</p>
                            <p className="text-xs text-muted-foreground">{uploadedDoc.fileName}</p>
                            <Badge variant={uploadedDoc.isVerified ? 'default' : 'secondary'} className="text-xs mt-1">
                              {getStatusText(uploadedDoc.isVerified)}
                            </Badge>
                          </div>
                        ) : (
                          <div className="mb-3">
                            <p className="text-xs text-muted-foreground">Not uploaded</p>
                          </div>
                        )}
                        <input
                          ref={(el) => (fileInputRefs.current[doc.key] = el)}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          style={{ display: 'none' }}
                          onChange={(e) => handleFileChange(e, doc.key)}
                        />
                        <div className="space-y-2">
                          <Button 
                            size="sm" 
                            variant={isUploaded ? "secondary" : "outline"}
                            data-testid={`button-upload-${doc.key}`}
                            onClick={() => handleUploadClick(doc.key)}
                            disabled={uploadingStates[doc.key]}
                            className="w-full"
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            {uploadingStates[doc.key] ? 'Uploading...' : isUploaded ? 'Replace Document' : 'Upload Document'}
                          </Button>
                          {isUploaded && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = `/api/documents/${uploadedDoc.id}/download`;
                                link.download = uploadedDoc.fileName;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              View Document
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Personal KYC Guidelines:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Personal PAN Card is required for platform access</li>
                    <li>• Ensure documents are clearly visible and not blurred</li>
                    <li>• Upload high-quality images (JPG, PNG formats)</li>
                    <li>• File size should be less than 5MB per document</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Company KYC Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Company KYC Documents
                </CardTitle>
                <CardDescription>
                  Upload company verification documents (required for company verification)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {companyDocumentTypes.map((doc) => {
                    const uploadedDoc = documents.find((d: any) => d.documentType === doc.key);
                    const isUploaded = !!uploadedDoc;
                    
                    return (
                      <div key={doc.key} className={`border-2 border-dashed rounded-lg p-6 text-center hover:bg-secondary/50 transition-colors ${
                        isUploaded ? 'border-green-300 bg-green-50/50' : 'border-border'
                      }`}>
                        <div className="relative inline-block">
                          <FileText className={`mx-auto h-10 w-10 mb-3 ${isUploaded ? 'text-green-600' : 'text-muted-foreground'}`} />
                          {isUploaded && uploadedDoc.isVerified && (
                            <CheckCircle className="absolute -top-1 -right-1 h-5 w-5 text-green-500 bg-white rounded-full" />
                          )}
                        </div>
                        <p className="text-sm font-medium mb-1">{doc.label}</p>
                        {doc.required && (
                          <p className="text-xs text-red-600 mb-2">Required for company verification</p>
                        )}
                        {isUploaded ? (
                          <div className="mb-3">
                            <p className="text-xs text-green-700 font-medium mb-1">✓ Uploaded</p>
                            <p className="text-xs text-muted-foreground">{uploadedDoc.fileName}</p>
                            <Badge variant={uploadedDoc.isVerified ? 'default' : 'secondary'} className="text-xs mt-1">
                              {getStatusText(uploadedDoc.isVerified)}
                            </Badge>
                          </div>
                        ) : (
                          <div className="mb-3">
                            <p className="text-xs text-muted-foreground">Not uploaded</p>
                          </div>
                        )}
                        <input
                          ref={(el) => (fileInputRefs.current[doc.key] = el)}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          style={{ display: 'none' }}
                          onChange={(e) => handleFileChange(e, doc.key)}
                        />
                        <div className="space-y-2">
                          <Button 
                            size="sm" 
                            variant={isUploaded ? "secondary" : "outline"}
                            data-testid={`button-upload-${doc.key}`}
                            onClick={() => handleUploadClick(doc.key)}
                            disabled={uploadingStates[doc.key]}
                            className="w-full"
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            {uploadingStates[doc.key] ? 'Uploading...' : isUploaded ? 'Replace Document' : 'Upload Document'}
                          </Button>
                          {isUploaded && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = `/api/documents/${uploadedDoc.id}/download`;
                                link.download = uploadedDoc.fileName;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              View Document
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2 text-blue-900">Company KYC Guidelines:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Business PAN Card/Company PAN Card - Mandatory for company verification</li>
                    <li>• GST Certificate - Required for tax compliance verification</li>
                    <li>• Incorporation Certificate - Proves company legal existence</li>
                    <li>• All documents must be valid and clearly readable</li>
                    <li>• Company documents enable business features and higher transaction limits</li>
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
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`document-${doc.id}`}>
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            {doc.isVerified && (
                              <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 text-green-500 bg-white rounded-full" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium" data-testid={`text-document-type-${doc.id}`}>
                              {getDocumentTypeLabel(doc.documentType)}
                            </h3>
                            <p className="text-sm text-muted-foreground" data-testid={`text-file-name-${doc.id}`}>
                              {doc.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                            </p>
                            {doc.status && doc.status !== 'pending' && (
                              <p className="text-xs font-medium">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(doc.isVerified)}
                            <Badge variant={doc.isVerified ? 'default' : 'secondary'} data-testid={`badge-status-${doc.id}`}>
                              {getStatusText(doc.isVerified)}
                            </Badge>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            data-testid={`button-download-${doc.id}`}
                            onClick={() => {
                              // Download the document
                              const link = document.createElement('a');
                              link.href = `/api/documents/${doc.id}/download`;
                              link.download = doc.fileName;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                          >
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