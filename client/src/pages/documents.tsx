import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, Clock, AlertCircle, Download } from "lucide-react";

export function DocumentsPage() {
  const { data: documents = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/documents']
  });

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
              <h1 className="text-3xl font-bold text-foreground mb-2">Documents</h1>
              <p className="text-muted-foreground">Manage your KYC and verification documents</p>
            </div>

            {/* Upload Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {['business_pan', 'gst_certificate', 'incorporation_certificate', 'personal_pan'].map((docType) => (
                    <div key={docType} className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:bg-secondary/50 transition-colors">
                      <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium mb-2">{getDocumentTypeLabel(docType)}</p>
                      <Button size="sm" variant="outline" data-testid={`button-upload-${docType}`}>
                        Upload
                      </Button>
                    </div>
                  ))}
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