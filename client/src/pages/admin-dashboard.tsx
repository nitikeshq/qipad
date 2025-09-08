import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Users, FileText, DollarSign, Settings, LogOut, Plus, Edit, Trash2, Search, Filter, Building, MessageSquare, Briefcase, Target, Home, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>({ name: "", description: "", type: "" });
  const [modalType, setModalType] = useState<"category" | "department" | "tender" | "company-formation" | "media-content" | null>(null);
  const [viewUserModal, setViewUserModal] = useState<any>(null);
  const [editFormationModal, setEditFormationModal] = useState<any>(null);

  // Data queries
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/users'],
  });

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/projects'],
  });

  const [currentInvestmentPage, setCurrentInvestmentPage] = useState(1);
  const { data: investmentsResponse = {} } = useQuery<any>({
    queryKey: [`/api/admin/investments?page=${currentInvestmentPage}&limit=10`],
  });
  const investments = investmentsResponse.investments || [];

  const { data: communities = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/communities'],
  });

  const { data: jobs = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/jobs'],
  });

  const { data: tenders = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/tenders'],
  });

  const { data: companyFormations = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/company-formations'],
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/categories'],
  });

  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/departments'],
  });

  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/companies'],
  });

  const { data: services = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/services'],
  });

  const { data: events = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/events'],
  });

  const { data: profitAnalytics = {} } = useQuery<any>({
    queryKey: ['/api/admin/analytics/profit'],
  });

  const { data: mediaContent = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/media-content'],
  });

  const { data: platformSettings = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/platform-settings'],
  });

  // Mutations
  const updateProjectStatusMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/projects/${projectId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Project status updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/projects'] });
    },
    onError: () => {
      toast({ title: "Failed to update project status", variant: "destructive" });
    }
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = modalType === "category" ? "/api/admin/categories" : 
                     modalType === "department" ? "/api/admin/departments" : 
                     "/api/admin/tenders";
      const response = await apiRequest("POST", endpoint, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: `${modalType} created successfully!` });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/${modalType === "category" ? "categories" : modalType === "department" ? "departments" : "tenders"}`] });
      setIsCreateModalOpen(false);
      setEditingItem({ name: "", description: "", type: "" });
    },
    onError: () => {
      toast({ title: `Failed to create ${modalType}`, variant: "destructive" });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      const response = await apiRequest("DELETE", `/api/admin/${type}/${id}`);
      return response.json();
    },
    onSuccess: (_, { type }) => {
      const itemName = type === 'categories' ? 'Category' : 
                     type === 'departments' ? 'Department' : 
                     type === 'company-formations' ? 'Company Formation' : 
                     type === 'media-content' ? 'Media Content' : 'Item';
      toast({ title: `${itemName} deleted successfully!` });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/${type}`] });
    },
    onError: () => {
      toast({ title: "Failed to delete item", variant: "destructive" });
    }
  });

  const suspendUserMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "User status updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: () => {
      toast({ title: "Failed to update user status", variant: "destructive" });
    }
  });

  const approveKycMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/kyc`, { kycStatus: status });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "KYC status updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update KYC status", description: error.message, variant: "destructive" });
    },
  });

  const updateFormationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/admin/company-formations/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Company Formation updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/company-formations'] });
      setEditFormationModal(null);
    },
    onError: () => {
      toast({ title: "Failed to update company formation", variant: "destructive" });
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("isAdmin");
    navigate("/admin/login");
  };

  const stats = [
    { title: "Total Users", value: users.length, icon: Users, color: "text-blue-600", bgColor: "bg-blue-50" },
    { title: "Total Projects", value: projects.length, icon: FileText, color: "text-green-600", bgColor: "bg-green-50" },
    { title: "Total Revenue", value: `₹${(profitAnalytics.totalRevenue || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: "text-purple-600", bgColor: "bg-purple-50" },
    { title: "Total Profit", value: `₹${(profitAnalytics.totalProfit || 0).toLocaleString('en-IN')}`, icon: BarChart3, color: "text-emerald-600", bgColor: "bg-emerald-50" },
    { title: "Companies", value: companies.length, icon: Building, color: "text-indigo-600", bgColor: "bg-indigo-50" },
    { title: "Services", value: services.length, icon: Settings, color: "text-pink-600", bgColor: "bg-pink-50" },
    { title: "Events", value: events.length, icon: Target, color: "text-yellow-600", bgColor: "bg-yellow-50" },
    { title: "Communities", value: communities.length, icon: MessageSquare, color: "text-cyan-600", bgColor: "bg-cyan-50" }
  ];

  const openCreateModal = (type: "category" | "department" | "tender" | "company-formation" | "media-content") => {
    setModalType(type);
    setEditingItem({ name: "", description: "", type: "" });
    setIsCreateModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createItemMutation.mutate(editingItem);
  };

  const filteredUsers = users.filter((user: any) => 
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProjects = projects.filter((project: any) => {
    const matchesSearch = project.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || project.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Qipad Admin</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Energized startup space management</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="button-admin-logout">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-200" data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Advanced Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <TabsList className="grid w-full grid-cols-12">
              <TabsTrigger value="overview" data-testid="tab-overview">
                <Home className="h-4 w-4 mr-1" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="projects" data-testid="tab-projects">Projects</TabsTrigger>
              <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
              <TabsTrigger value="companies" data-testid="tab-companies">Companies</TabsTrigger>
              <TabsTrigger value="services" data-testid="tab-services">Services</TabsTrigger>
              <TabsTrigger value="events" data-testid="tab-events">Events</TabsTrigger>
              <TabsTrigger value="investments" data-testid="tab-investments">Investments</TabsTrigger>
              <TabsTrigger value="tenders" data-testid="tab-tenders">Tenders</TabsTrigger>
              <TabsTrigger value="company-formations" data-testid="tab-company-formations">Formations</TabsTrigger>
              <TabsTrigger value="categories" data-testid="tab-categories">Categories</TabsTrigger>
              <TabsTrigger value="departments" data-testid="tab-departments">Departments</TabsTrigger>
              <TabsTrigger value="media-center" data-testid="tab-media-center">Media</TabsTrigger>
              <TabsTrigger value="platform-settings" data-testid="tab-platform-settings">Settings</TabsTrigger>
              <TabsTrigger value="analytics" data-testid="tab-analytics">
                <BarChart3 className="h-4 w-4 mr-1" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="card-recent-activities">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Recent Activities
                    {companyFormations.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {companyFormations.filter((f: any) => f.status === 'pending' || f.status === 'in_progress').length} New
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Company Formation Notifications */}
                    {companyFormations.slice(0, 2).map((formation: any) => (
                      <div key={formation.id} className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <Building className="h-5 w-5 text-yellow-600" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            Company Formation: {formation.companyName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Step {formation.currentStep || 1} of 9 - {formation.status || 'pending'}
                          </p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setActiveTab('company-formations');
                            setEditFormationModal(formation);
                          }}
                        >
                          Review
                        </Button>
                      </div>
                    ))}
                    
                    {/* Recent Projects */}
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {projects.filter((p: any) => p.status === 'pending_review').length} projects pending review
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Requires admin approval</p>
                      </div>
                    </div>
                    
                    {/* Recent Investments */}
                    <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {investments.filter((i: any) => i.status === 'pending_approval').length} investments pending
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Awaiting admin review</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-platform-insights">
                <CardHeader>
                  <CardTitle>Platform Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">Active Users Today</span>
                      <span className="font-bold text-gray-900 dark:text-white">{Math.floor(users.length * 0.3)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">Success Rate</span>
                      <span className="font-bold text-green-600">87%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">Total Funding Raised</span>
                      <span className="font-bold text-purple-600">₹{investments.reduce((total: number, inv: any) => total + parseFloat(inv.amount || 0), 0).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users">
            <Card data-testid="card-users-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Users Management</CardTitle>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>KYC Status</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.userType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isKycComplete ? "default" : "secondary"}>
                            {user.isKycComplete ? "Verified" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'active' ? "default" : "destructive"}>
                            {user.status || 'active'}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewUserModal(user)}
                          >
                            View
                          </Button>
                          {!user.isKycComplete && (
                            <Button
                              size="sm"
                              onClick={() => approveKycMutation.mutate({ userId: user.id, status: 'approved' })}
                            >
                              Approve KYC
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={user.status === 'suspended' ? "default" : "destructive"}
                            onClick={() => suspendUserMutation.mutate({ 
                              userId: user.id, 
                              status: user.status === 'suspended' ? 'active' : 'suspended' 
                            })}
                          >
                            {user.status === 'suspended' ? 'Activate' : 'Suspend'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500">
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Management Tab */}
          <TabsContent value="projects">
            <Card data-testid="card-projects-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Projects Management</CardTitle>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending_review">Pending Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Funding Goal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project: any) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.title}</TableCell>
                        <TableCell>{project.owner?.firstName} {project.owner?.lastName}</TableCell>
                        <TableCell>₹{project.fundingGoal?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={
                            project.status === 'approved' ? 'default' :
                            project.status === 'pending_review' ? 'secondary' : 'destructive'
                          }>
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/innovations/${project.id}`, '_blank')}
                          >
                            View
                          </Button>
                          {project.status === 'pending_review' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateProjectStatusMutation.mutate({ 
                                  projectId: project.id, 
                                  status: 'approved' 
                                })}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateProjectStatusMutation.mutate({ 
                                  projectId: project.id, 
                                  status: 'rejected' 
                                })}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredProjects.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500">
                          No projects found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Center Management Tab - NOW PROPERLY INSIDE TABS */}
          <TabsContent value="media-center">
            <Card data-testid="card-media-center-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Media Center Management</CardTitle>
                <Button 
                  onClick={() => {
                    setModalType("media-content");
                    setEditingItem({ title: "", description: "", type: "", url: "", thumbnailUrl: "", tags: [], featured: false, author: "" });
                    setIsCreateModalOpen(true);
                  }}
                  data-testid="button-create-media-content"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Media Content
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Featured</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mediaContent.map((content: any) => (
                      <TableRow key={content.id} data-testid={`row-media-content-${content.id}`}>
                        <TableCell className="font-medium">{content.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{content.type}</Badge>
                        </TableCell>
                        <TableCell>{content.author}</TableCell>
                        <TableCell>
                          {content.featured ? (
                            <Badge variant="default">Featured</Badge>
                          ) : (
                            <Badge variant="secondary">Regular</Badge>
                          )}
                        </TableCell>
                        <TableCell>{content.views || 0}</TableCell>
                        <TableCell>
                          <Badge variant={content.isActive ? "default" : "destructive"}>
                            {content.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingItem({
                                id: content.id,
                                title: content.title,
                                description: content.description,
                                type: content.type,
                                url: content.url,
                                thumbnailUrl: content.thumbnailUrl,
                                tags: content.tags || [],
                                featured: content.featured,
                                author: content.author
                              });
                              setModalType("media-content");
                              setIsCreateModalOpen(true);
                            }}
                            data-testid={`button-edit-media-content-${content.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteItemMutation.mutate({ type: "media-content", id: content.id })}
                            data-testid={`button-delete-media-content-${content.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {mediaContent.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500">
                          No media content found. Click "Add Media Content" to create your first entry.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platform Settings Management Tab */}
          <TabsContent value="platform-settings">
            <Card data-testid="card-platform-settings-management">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Platform Settings
                </CardTitle>
                <CardDescription>
                  Configure platform-wide settings including fees, limits, and policies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {platformSettings.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No platform settings found. Settings will be automatically initialized.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}