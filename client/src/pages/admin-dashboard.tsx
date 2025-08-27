import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Users, FileText, DollarSign, Settings, LogOut } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/users'],
  });

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/projects'],
  });

  const { data: investments = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/investments'],
  });

  const updateProjectStatusMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/projects/${projectId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Project status updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/projects'] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update project status", variant: "destructive" });
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("isAdmin");
    navigate("/admin/login");
  };

  const stats = [
    {
      title: "Total Users",
      value: users.length,
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Total Projects",
      value: projects.length,
      icon: FileText,
      color: "text-green-600"
    },
    {
      title: "Total Investments",
      value: investments.length,
      icon: DollarSign,
      color: "text-purple-600"
    },
    {
      title: "Pending Reviews",
      value: projects.filter((p: any) => p.status === 'pending_review').length,
      icon: Settings,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="projects" className="space-y-4">
          <TabsList>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle>Project Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Funding Goal</TableHead>
                      <TableHead>Current Funding</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project: any) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.title}</TableCell>
                        <TableCell>{project.owner?.firstName} {project.owner?.lastName}</TableCell>
                        <TableCell>
                          <Badge variant={
                            project.status === 'approved' ? 'default' :
                            project.status === 'pending_review' ? 'secondary' :
                            project.status === 'rejected' ? 'destructive' : 'outline'
                          }>
                            {project.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>₹{parseFloat(project.fundingGoal).toLocaleString()}</TableCell>
                        <TableCell>₹{parseFloat(project.currentFunding || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {project.status === 'pending_review' && (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => updateProjectStatusMutation.mutate({ projectId: project.id, status: 'approved' })}
                                >
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => updateProjectStatusMutation.mutate({ projectId: project.id, status: 'rejected' })}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>User Type</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>KYC Complete</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.userType.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isVerified ? 'default' : 'secondary'}>
                            {user.isVerified ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isKycComplete ? 'default' : 'secondary'}>
                            {user.isKycComplete ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="investments">
            <Card>
              <CardHeader>
                <CardTitle>Investment Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Investor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investments.map((investment: any) => (
                      <TableRow key={investment.id}>
                        <TableCell className="font-medium">{investment.project?.title || 'Unknown'}</TableCell>
                        <TableCell>{investment.investor?.firstName} {investment.investor?.lastName}</TableCell>
                        <TableCell>₹{parseFloat(investment.amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={investment.type === 'invest' ? 'default' : 'secondary'}>
                            {investment.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            investment.status === 'completed' ? 'default' :
                            investment.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {investment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(investment.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}