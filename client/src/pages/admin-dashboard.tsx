import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [modalType, setModalType] = useState<"category" | "department" | "tender" | null>(null);

  // Data queries
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/users'],
  });

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/projects'],
  });

  const { data: investments = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/investments'],
  });

  const { data: communities = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/communities'],
  });

  const { data: jobs = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/jobs'],
  });

  const { data: tenders = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/tenders'],
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/categories'],
  });

  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/departments'],
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
      toast({ title: `${type === 'categories' ? 'Category' : 'Department'} deleted successfully!` });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/${type}`] });
    },
    onError: () => {
      toast({ title: "Failed to delete item", variant: "destructive" });
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
    { title: "Total Investments", value: investments.length, icon: DollarSign, color: "text-purple-600", bgColor: "bg-purple-50" },
    { title: "Communities", value: communities.length, icon: MessageSquare, color: "text-indigo-600", bgColor: "bg-indigo-50" },
    { title: "Jobs Posted", value: jobs.length, icon: Briefcase, color: "text-pink-600", bgColor: "bg-pink-50" },
    { title: "Active Tenders", value: tenders.length, icon: Target, color: "text-yellow-600", bgColor: "bg-yellow-50" },
    { title: "Categories", value: categories.length, icon: Building, color: "text-cyan-600", bgColor: "bg-cyan-50" },
    { title: "Pending Reviews", value: projects.filter((p: any) => p.status === 'pending_review').length, icon: Settings, color: "text-orange-600", bgColor: "bg-orange-50" }
  ];

  const openCreateModal = (type: "category" | "department" | "tender") => {
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
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="overview" data-testid="tab-overview">
                <Home className="h-4 w-4 mr-1" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="projects" data-testid="tab-projects">Projects</TabsTrigger>
              <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
              <TabsTrigger value="investments" data-testid="tab-investments">Investments</TabsTrigger>
              <TabsTrigger value="categories" data-testid="tab-categories">Categories</TabsTrigger>
              <TabsTrigger value="departments" data-testid="tab-departments">Departments</TabsTrigger>
              <TabsTrigger value="communities" data-testid="tab-communities">Communities</TabsTrigger>
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
                  <CardTitle>Recent Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">New project submitted</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Investment completed</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">5 minutes ago</p>
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
                      <span className="text-gray-600 dark:text-gray-300">Total Revenue</span>
                      <span className="font-bold text-purple-600">₹{(investments.length * 50000).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Projects Management */}
          <TabsContent value="projects">
            <Card data-testid="card-projects-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Project Management</CardTitle>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                      data-testid="input-search-projects"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40" data-testid="select-filter-status">
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
                      <TableHead>Status</TableHead>
                      <TableHead>Funding Goal</TableHead>
                      <TableHead>Current Funding</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project: any) => (
                      <TableRow key={project.id} data-testid={`row-project-${project.id}`}>
                        <TableCell className="font-medium">{project.title}</TableCell>
                        <TableCell>{project.owner?.firstName} {project.owner?.lastName}</TableCell>
                        <TableCell>
                          <Badge variant={
                            project.status === 'approved' ? 'default' :
                            project.status === 'pending_review' ? 'secondary' :
                            project.status === 'rejected' ? 'destructive' : 'outline'
                          }>
                            {project.status?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>₹{project.fundingGoal?.toLocaleString()}</TableCell>
                        <TableCell>₹{project.currentFunding?.toLocaleString()}</TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateProjectStatusMutation.mutate({ projectId: project.id, status: 'approved' })}
                            disabled={project.status === 'approved'}
                            data-testid={`button-approve-project-${project.id}`}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateProjectStatusMutation.mutate({ projectId: project.id, status: 'rejected' })}
                            disabled={project.status === 'rejected'}
                            data-testid={`button-reject-project-${project.id}`}
                          >
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management */}
          <TabsContent value="users">
            <Card data-testid="card-users-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>User Management</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                    data-testid="input-search-users"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>User Type</TableHead>
                      <TableHead>KYC Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.userType === 'investor' ? 'default' : 'secondary'}>
                            {user.userType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.kycStatus === 'verified' ? 'default' : 'secondary'}>
                            {user.kycStatus || 'pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="space-x-2">
                          <Button size="sm" variant="outline" data-testid={`button-view-user-${user.id}`}>
                            View
                          </Button>
                          <Button size="sm" variant="destructive" data-testid={`button-suspend-user-${user.id}`}>
                            Suspend
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Management */}
          <TabsContent value="categories">
            <Card data-testid="card-categories-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Categories Management</CardTitle>
                <Button onClick={() => openCreateModal("category")} data-testid="button-create-category">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category: any) => (
                      <TableRow key={category.id} data-testid={`row-category-${category.id}`}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{category.type}</Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button size="sm" variant="outline" data-testid={`button-edit-category-${category.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => deleteItemMutation.mutate({ type: "categories", id: category.id })}
                            data-testid={`button-delete-category-${category.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Departments Management */}
          <TabsContent value="departments">
            <Card data-testid="card-departments-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Departments Management</CardTitle>
                <Button onClick={() => openCreateModal("department")} data-testid="button-create-department">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Head Count</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((department: any) => (
                      <TableRow key={department.id} data-testid={`row-department-${department.id}`}>
                        <TableCell className="font-medium">{department.name}</TableCell>
                        <TableCell>{department.description}</TableCell>
                        <TableCell>{department.headCount || 0}</TableCell>
                        <TableCell className="space-x-2">
                          <Button size="sm" variant="outline" data-testid={`button-edit-department-${department.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => deleteItemMutation.mutate({ type: "departments", id: department.id })}
                            data-testid={`button-delete-department-${department.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Investments Tab */}
          <TabsContent value="investments">
            <Card data-testid="card-investments-management">
              <CardHeader>
                <CardTitle>Investment Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investor</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Stake %</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Platform Fee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investments.map((investment: any) => (
                      <TableRow key={investment.id} data-testid={`row-investment-${investment.id}`}>
                        <TableCell>{investment.investor?.firstName} {investment.investor?.lastName}</TableCell>
                        <TableCell>{investment.project?.title}</TableCell>
                        <TableCell>₹{investment.amount?.toLocaleString()}</TableCell>
                        <TableCell>{investment.stakePercentage}%</TableCell>
                        <TableCell>
                          <Badge variant={investment.status === 'completed' ? 'default' : 'secondary'}>
                            {investment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={investment.platformFeePaid ? 'default' : 'destructive'}>
                            {investment.platformFeePaid ? 'Paid' : 'Pending'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Communities Tab */}
          <TabsContent value="communities">
            <Card data-testid="card-communities-management">
              <CardHeader>
                <CardTitle>Communities Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {communities.map((community: any) => (
                      <TableRow key={community.id} data-testid={`row-community-${community.id}`}>
                        <TableCell className="font-medium">{community.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{community.category || 'General'}</Badge>
                        </TableCell>
                        <TableCell>{community.memberCount || 0}</TableCell>
                        <TableCell>{new Date(community.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="default">Active</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="card-user-analytics">
                <CardHeader>
                  <CardTitle>User Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Business Owners</span>
                      <span className="font-bold">{users.filter((u: any) => u.userType === 'business_owner').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Investors</span>
                      <span className="font-bold">{users.filter((u: any) => u.userType === 'investor').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>KYC Verified</span>
                      <span className="font-bold">{users.filter((u: any) => u.kycStatus === 'verified').length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-financial-analytics">
                <CardHeader>
                  <CardTitle>Financial Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Funding Raised</span>
                      <span className="font-bold text-green-600">₹{projects.reduce((sum: number, p: any) => sum + (p.currentFunding || 0), 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Revenue (2%)</span>
                      <span className="font-bold text-purple-600">₹{Math.floor(investments.length * 1000).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate</span>
                      <span className="font-bold text-blue-600">87%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-create-item">
          <DialogHeader>
            <DialogTitle>Create New {modalType}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editingItem.name}
                onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                placeholder={`Enter ${modalType} name`}
                required
                data-testid="input-create-name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editingItem.description}
                onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                placeholder={`Enter ${modalType} description`}
                required
                data-testid="input-create-description"
              />
            </div>
            {modalType === "category" && (
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={editingItem.type} onValueChange={(value) => setEditingItem({...editingItem, type: value})}>
                  <SelectTrigger data-testid="select-create-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="job">Job</SelectItem>
                    <SelectItem value="tender">Tender</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} data-testid="button-cancel-create">
                Cancel
              </Button>
              <Button type="submit" disabled={createItemMutation.isPending} data-testid="button-submit-create">
                {createItemMutation.isPending ? 'Creating...' : `Create ${modalType}`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}