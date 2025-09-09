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
import { apiRequest, adminApiRequest } from "@/lib/queryClient";
import { Shield, Users, FileText, DollarSign, Settings, LogOut, Plus, Edit, Trash2, Search, Filter, Building, Building2, Calendar, Tag, MessageSquare, Briefcase, Target, Home, BarChart3 } from "lucide-react";
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
  const [modalType, setModalType] = useState<"category" | "department" | "tender" | "company-formation" | "media-content" | "company" | "service" | "event" | "investment" | "credit-config" | "email-settings" | null>(null);
  const [viewUserModal, setViewUserModal] = useState<any>(null);
  const [editFormationModal, setEditFormationModal] = useState<any>(null);
  const [viewServiceModal, setViewServiceModal] = useState<any>(null);
  const [viewEventModal, setViewEventModal] = useState<any>(null);
  const [viewTenderModal, setViewTenderModal] = useState<any>(null);
  const [viewFormationModal, setViewFormationModal] = useState<any>(null);

  // Data queries
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await adminApiRequest('GET', '/api/admin/users');
      return response.json();
    }
  });

  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/projects'],
    queryFn: async () => {
      const response = await adminApiRequest('GET', '/api/admin/projects');
      return response.json();
    }
  });

  const [currentInvestmentPage, setCurrentInvestmentPage] = useState(1);
  const { data: investmentsResponse = {} } = useQuery<any>({
    queryKey: [`/api/admin/investments?page=${currentInvestmentPage}&limit=10`],
    queryFn: async () => {
      const response = await adminApiRequest('GET', `/api/admin/investments?page=${currentInvestmentPage}&limit=10`);
      return response.json();
    }
  });
  const investments = investmentsResponse.investments || [];

  const { data: communities = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/communities'],
    queryFn: async () => {
      const response = await adminApiRequest('GET', '/api/admin/communities');
      return response.json();
    }
  });

  const { data: jobs = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/jobs'],
    queryFn: async () => {
      const response = await adminApiRequest('GET', '/api/admin/jobs');
      return response.json();
    }
  });

  const { data: tenders = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/tenders'],
    queryFn: async () => {
      const response = await adminApiRequest('GET', '/api/admin/tenders');
      return response.json();
    }
  });

  const { data: companyFormations = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/company-formations'],
    queryFn: async () => {
      const response = await adminApiRequest('GET', '/api/admin/company-formations');
      return response.json();
    }
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/categories'],
    queryFn: async () => {
      const response = await adminApiRequest('GET', '/api/admin/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    }
  });

  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/departments'],
    queryFn: async () => {
      const response = await adminApiRequest('GET', '/api/admin/departments');
      if (!response.ok) throw new Error('Failed to fetch departments');
      return response.json();
    }
  });

  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/companies'],
    queryFn: async () => {
      const response = await adminApiRequest('GET', '/api/admin/companies');
      if (!response.ok) throw new Error('Failed to fetch companies');
      return response.json();
    }
  });

  const { data: services = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/services'],
    queryFn: async () => {
      const response = await adminApiRequest('GET', '/api/admin/services');
      if (!response.ok) throw new Error('Failed to fetch services');
      return response.json();
    }
  });

  const { data: events = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/events'],
    queryFn: async () => {
      const response = await adminApiRequest('GET', '/api/admin/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    }
  });

  const { data: profitAnalytics = {} } = useQuery<any>({
    queryKey: ['/api/admin/analytics/profit'],
    queryFn: async () => {
      const response = await adminApiRequest('GET', '/api/admin/analytics/profit');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  const { data: walletAnalytics = {} } = useQuery<any>({
    queryKey: ['/api/admin/analytics/wallet-deposits'],
  });

  const { data: referralAnalytics = {} } = useQuery<any>({
    queryKey: ['/api/admin/analytics/referrals'],
  });

  // Fetch wallet transactions
  const { data: walletTransactions = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/wallet-transactions'],
    queryFn: async () => {
      const response = await adminApiRequest('GET', '/api/admin/wallet-transactions?limit=100');
      if (!response.ok) throw new Error('Failed to fetch wallet transactions');
      return response.json();
    }
  });

  // Fetch referral records
  const { data: referralRecords = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/referrals'],
    queryFn: async () => {
      const response = await adminApiRequest('GET', '/api/admin/referrals');
      if (!response.ok) throw new Error('Failed to fetch referral records');
      return response.json();
    }
  });

  const { data: mediaContent = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/media-content'],
    queryFn: async () => {
      const response = await adminApiRequest('GET', '/api/admin/media-content');
      if (!response.ok) throw new Error('Failed to fetch media content');
      return response.json();
    }
  });

  const { data: platformSettings = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/platform-settings'],
    queryFn: async () => {
      const response = await adminApiRequest('GET', '/api/admin/platform-settings');
      if (!response.ok) throw new Error('Failed to fetch platform settings');
      return response.json();
    }
  });

  const { data: creditConfigs = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/credit-configs'],
  });

  // Mutations
  const updateProjectStatusMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: string }) => {
      const response = await fetch(`/api/admin/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update project status');
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
      const endpointMap: Record<string, string> = {
        "category": "/api/admin/categories",
        "department": "/api/admin/departments", 
        "tender": "/api/admin/tenders",
        "media-content": "/api/admin/media-content",
        "company": "/api/admin/companies",
        "service": "/api/admin/services",
        "event": "/api/admin/events",
        "investment": "/api/admin/investments",
        "company-formation": "/api/admin/company-formations",
        "credit-config": "/api/admin/credit-configs",
        "email-settings": "/api/admin/platform-settings"
      };
      const endpoint = endpointMap[modalType as keyof typeof endpointMap] || "/api/admin/tenders";
      const response = await apiRequest("POST", endpoint, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: `${modalType} created successfully!` });
      const queryKeyMap = {
        "category": "categories",
        "department": "departments",
        "tender": "tenders",
        "media-content": "media-content",
        "company": "companies",
        "service": "services",
        "event": "events",
        "investment": "investments",
        "company-formation": "company-formations"
      };
      const queryKey = queryKeyMap[modalType as keyof typeof queryKeyMap] || "tenders";
      queryClient.invalidateQueries({ queryKey: [`/api/admin/${queryKey}`] });
      setIsCreateModalOpen(false);
      setEditingItem({ name: "", description: "", type: "" });
    },
    onError: () => {
      toast({ title: `Failed to create ${modalType}`, variant: "destructive" });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      const response = await fetch(`/api/admin/${type}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete item');
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
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update user status');
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
      const response = await adminApiRequest("PUT", `/api/admin/users/${userId}/kyc`, { 
        kycStatus: status, 
        isVerified: status === 'verified',
        isKycComplete: status === 'verified'
      });
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
      const response = await fetch(`/api/admin/company-formations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update company formation');
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

  const updateCompanyStatusMutation = useMutation({
    mutationFn: async ({ companyId, status }: { companyId: string; status: string }) => {
      const response = await fetch(`/api/admin/companies/${companyId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update company status');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Company status updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/companies'] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update company status", description: error.message, variant: "destructive" });
    },
  });

  const updateServiceStatusMutation = useMutation({
    mutationFn: async ({ serviceId, status }: { serviceId: string; status: string }) => {
      const response = await fetch(`/api/admin/services/${serviceId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update service status');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Service status updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/services'] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update service status", description: error.message, variant: "destructive" });
    },
  });

  const updateEventStatusMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      const response = await fetch(`/api/admin/events/${eventId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update event status');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Event status updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update event status", description: error.message, variant: "destructive" });
    },
  });

  const updateTenderStatusMutation = useMutation({
    mutationFn: async ({ tenderId, status }: { tenderId: string; status: string }) => {
      const response = await fetch(`/api/admin/tenders/${tenderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update tender status');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Tender status updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenders'] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update tender status", description: error.message, variant: "destructive" });
    },
  });

  const updateFormationStatusMutation = useMutation({
    mutationFn: async ({ formationId, status }: { formationId: string; status: string }) => {
      const response = await fetch(`/api/admin/company-formations/${formationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update formation status');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Formation status updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/company-formations'] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update formation status", description: error.message, variant: "destructive" });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("isAdmin");
    navigate("/admin/login");
  };

  const stats = [
    { title: "Total Users", value: users.length, icon: Users, color: "text-blue-600", bgColor: "bg-blue-50" },
    { title: "Total Projects", value: projects.length, icon: FileText, color: "text-green-600", bgColor: "bg-green-50" },
    { title: "Total Revenue", value: `${(profitAnalytics.totalRevenue || 0).toLocaleString('en-IN')} QP`, icon: DollarSign, color: "text-purple-600", bgColor: "bg-purple-50" },
    { title: "Total Profit", value: `${(profitAnalytics.totalProfit || 0).toLocaleString('en-IN')} QP`, icon: BarChart3, color: "text-emerald-600", bgColor: "bg-emerald-50" },
    { title: "Wallet Deposits", value: walletAnalytics.totalDeposits || 0, icon: DollarSign, color: "text-orange-600", bgColor: "bg-orange-50" },
    { title: "Total Depositors", value: walletAnalytics.totalDepositors || 0, icon: Users, color: "text-teal-600", bgColor: "bg-teal-50" },
    { title: "Total Referrals", value: referralAnalytics.totalReferrals || 0, icon: Users, color: "text-red-600", bgColor: "bg-red-50" },
    { title: "Referral Rewards", value: `${(referralAnalytics.totalRewards || 0).toLocaleString('en-IN')} QP`, icon: DollarSign, color: "text-pink-600", bgColor: "bg-pink-50" }
  ];

  const openCreateModal = (type: "category" | "department" | "tender" | "company-formation" | "media-content" | "company" | "service" | "event" | "investment" | "credit-config" | "email-settings") => {
    setModalType(type);
    setEditingItem({ name: "", description: "", type: "" });
    setIsCreateModalOpen(true);
  };

  const getProcessName = (step: number) => {
    const processNames = [
      "", // Step 0 (not used)
      "Company Registration",
      "Director Identification",
      "Document Collection", 
      "Trademark Application",
      "Bank Account Setup",
      "Certifications",
      "Project Listing",
      "Government Schemes",
      "Final Approval"
    ];
    return processNames[step] || "Unknown Process";
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

  const filteredInvestments = investments.filter((investment: any) => 
    investment.project?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    investment.investor?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    investment.investor?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCompanies = companies.filter((company: any) => 
    company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServices = services.filter((service: any) => 
    service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEvents = events.filter((event: any) => 
    event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTenders = tenders.filter((tender: any) => 
    tender.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tender.organization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFormations = companyFormations.filter((formation: any) => 
    formation.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formation.applicant?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formation.applicant?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCategories = categories.filter((category: any) => 
    category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDepartments = departments.filter((department: any) => 
    department.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    department.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <TabsList className="flex flex-wrap justify-start gap-2 w-full h-auto p-2">
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
              <TabsTrigger value="wallet-management" data-testid="tab-wallet-management">Wallets</TabsTrigger>
              <TabsTrigger value="referral-management" data-testid="tab-referral-management">Referrals</TabsTrigger>
              <TabsTrigger value="email-settings" data-testid="tab-email-settings">Email Settings</TabsTrigger>
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
                      <span className="font-bold text-purple-600">{investments.reduce((total: number, inv: any) => total + parseFloat(inv.amount || 0), 0).toLocaleString()} QP</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>



          {/* Companies Management Tab */}
          <TabsContent value="companies">
            <Card data-testid="card-companies-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Companies Management</CardTitle>
                <Button 
                  onClick={() => openCreateModal("company")}
                  data-testid="button-create-company"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Company
                </Button>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      placeholder="Search companies..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Founded</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company: any) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>{company.industry}</TableCell>
                        <TableCell>{company.foundedYear}</TableCell>
                        <TableCell>
                          {company.owner ? (
                            <div className="text-sm">
                              <div className="font-medium">{company.owner.firstName} {company.owner.lastName}</div>
                              <div className="text-gray-500">{company.owner.email}</div>
                            </div>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">Active</Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setEditingItem({
                                id: company.id,
                                name: company.name,
                                description: company.description,
                                industry: company.industry,
                                foundedYear: company.foundedYear,
                                website: company.website,
                                employeeCount: company.employeeCount,
                                city: company.city,
                                state: company.state
                              });
                              setModalType("company");
                              setIsCreateModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deleteItemMutation.mutate({ type: "companies", id: company.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {companies.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500">
                          No companies found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Management Tab */}
          <TabsContent value="services">
            <Card data-testid="card-services-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Services Management</CardTitle>
                <Button 
                  onClick={() => openCreateModal("service")}
                  data-testid="button-create-service"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service: any) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>{service.category}</TableCell>
                        <TableCell>{service.price?.toLocaleString()} QP</TableCell>
                        <TableCell>
                          <Badge variant="default">Active</Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setEditingItem({
                                id: service.id,
                                name: service.name,
                                description: service.description,
                                price: service.price,
                                category: service.category,
                                providerId: service.providerId
                              });
                              setModalType("service");
                              setIsCreateModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deleteItemMutation.mutate({ type: "services", id: service.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {services.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500">
                          No services found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Management Tab */}
          <TabsContent value="events">
            <Card data-testid="card-events-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Events Management</CardTitle>
                <Button 
                  onClick={() => openCreateModal("event")}
                  data-testid="button-create-event"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Attendees</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event: any) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell>{new Date(event.eventDate).toLocaleDateString()}</TableCell>
                        <TableCell>{event.venue}</TableCell>
                        <TableCell>{event.currentParticipants || 0}</TableCell>
                        <TableCell>
                          <Badge variant="default">Active</Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setEditingItem({
                                id: event.id,
                                title: event.title,
                                description: event.description,
                                eventDate: new Date(event.eventDate).toISOString().slice(0, 16),
                                eventType: event.eventType,
                                venue: event.venue,
                                maxParticipants: event.maxParticipants,
                                price: event.price,
                                isPaid: event.isPaid
                              });
                              setModalType("event");
                              setIsCreateModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deleteItemMutation.mutate({ type: "events", id: event.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {events.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500">
                          No events found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>


          {/* Tenders Management Tab */}
          <TabsContent value="tenders">
            <Card data-testid="card-tenders-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tenders Management</CardTitle>
                <Button 
                  onClick={() => openCreateModal("tender")}
                  data-testid="button-create-tender"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tender
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Bids</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenders.map((tender: any) => (
                      <TableRow key={tender.id}>
                        <TableCell className="font-medium">{tender.title}</TableCell>
                        <TableCell>{new Date(tender.submissionDeadline).toLocaleDateString()}</TableCell>
                        <TableCell>{tender.estimatedValue?.toLocaleString()} QP</TableCell>
                        <TableCell>{tender.bids?.length || 0}</TableCell>
                        <TableCell>
                          <Badge variant={tender.isActive ? 'default' : 'secondary'}>
                            {tender.isActive ? 'Open' : 'Closed'}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setEditingItem({
                                id: tender.id,
                                title: tender.title,
                                description: tender.description,
                                organization: tender.organization,
                                category: tender.category,
                                estimatedValue: tender.estimatedValue,
                                submissionDeadline: new Date(tender.submissionDeadline).toISOString().slice(0, 16),
                                eligibilityCriteria: tender.eligibilityCriteria
                              });
                              setModalType("tender");
                              setIsCreateModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deleteItemMutation.mutate({ type: "tenders", id: tender.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {tenders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500">
                          No tenders found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Formations Management Tab */}
          <TabsContent value="company-formations">
            <Card data-testid="card-company-formations-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Company Formations</CardTitle>
                <Button 
                  onClick={() => openCreateModal("company-formation")}
                  data-testid="button-create-company-formation"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Formation Request
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Assigned CA/Agent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companyFormations.map((formation: any) => (
                      <TableRow key={formation.id}>
                        <TableCell className="font-medium">{formation.companyName || 'N/A'}</TableCell>
                        <TableCell>{formation.companyType || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={formation.status === 'completed' ? 'default' : 'secondary'}>
                            {formation.status || 'In Progress'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">Step {formation.currentStep || 1}/9</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${((formation.currentStep || 1) / 9) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formation.user ? (
                            <div className="text-sm">
                              <div className="font-medium">{formation.user.firstName} {formation.user.lastName}</div>
                              <div className="text-gray-500">{formation.user.email}</div>
                            </div>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {formation.assignedConsultant ? (
                            <div className="text-sm">
                              <div className="font-medium">Agent Assigned</div>
                              <div className="text-gray-500">ID: {formation.assignedConsultant}</div>
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-blue-600"
                              onClick={() => {
                                setEditFormationModal({...formation, assignAgent: true});
                              }}
                            >
                              Assign CA/Agent
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setEditFormationModal(formation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deleteItemMutation.mutate({ type: "company-formations", id: formation.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {companyFormations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500">
                          No company formation requests found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Management Tab */}
          <TabsContent value="categories">
            <Card data-testid="card-categories-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Categories Management</CardTitle>
                <Button 
                  onClick={() => openCreateModal("category")}
                  data-testid="button-create-category"
                >
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
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category: any) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.description}</TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingItem({
                                id: category.id,
                                name: category.name,
                                description: category.description,
                                type: ""
                              });
                              setModalType("category");
                              setIsCreateModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteItemMutation.mutate({ type: "category", id: category.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {categories.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-gray-500">
                          No categories found. Click "Add Category" to create your first category.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Departments Management Tab */}
          <TabsContent value="departments">
            <Card data-testid="card-departments-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Departments Management</CardTitle>
                <Button 
                  onClick={() => openCreateModal("department")}
                  data-testid="button-create-department"
                >
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
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((department: any) => (
                      <TableRow key={department.id}>
                        <TableCell className="font-medium">{department.name}</TableCell>
                        <TableCell>{department.description}</TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingItem({
                                id: department.id,
                                name: department.name,
                                description: department.description,
                                type: ""
                              });
                              setModalType("department");
                              setIsCreateModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteItemMutation.mutate({ type: "department", id: department.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {departments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-gray-500">
                          No departments found. Click "Add Department" to create your first department.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card data-testid="card-user-analytics">
                <CardHeader>
                  <CardTitle>User Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">Total Users</span>
                      <span className="font-bold text-blue-600">{users.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">Active Users</span>
                      <span className="font-bold text-green-600">{users.filter((u: any) => u.status === 'active').length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">KYC Completed</span>
                      <span className="font-bold text-purple-600">{users.filter((u: any) => u.isKycComplete).length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card data-testid="card-project-analytics">
                <CardHeader>
                  <CardTitle>Project Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">Total Projects</span>
                      <span className="font-bold text-blue-600">{projects.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">Approved Projects</span>
                      <span className="font-bold text-green-600">{projects.filter((p: any) => p.status === 'approved').length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">Pending Review</span>
                      <span className="font-bold text-orange-600">{projects.filter((p: any) => p.status === 'pending_review').length}</span>
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
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Users Management
                </CardTitle>
                <div className="flex gap-2">
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
                      <TableHead>User Type</TableHead>
                      <TableHead>KYC Status</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.userType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              user.kycStatus === 'verified' ? 'default' : 
                              user.kycStatus === 'pending' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {user.kycStatus || 'not_submitted'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewUserModal(user)}
                          >
                            View
                          </Button>
                          {user.kycStatus !== 'verified' && (
                            <Button
                              size="sm"
                              onClick={() => approveKycMutation.mutate({ userId: user.id, status: 'verified' })}
                              disabled={approveKycMutation.isPending}
                              data-testid={`button-approve-kyc-${user.id}`}
                            >
                              Approve KYC
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={user.status === 'active' ? 'destructive' : 'default'}
                            onClick={() => suspendUserMutation.mutate({ 
                              userId: user.id, 
                              status: user.status === 'active' ? 'suspended' : 'active' 
                            })}
                          >
                            {user.status === 'active' ? 'Suspend' : 'Activate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredUsers.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No users found matching your search criteria.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Management Tab */}
          <TabsContent value="projects">
            <Card data-testid="card-projects-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Projects Management
                </CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending_review">Pending Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
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
                      <TableHead>Category</TableHead>
                      <TableHead>Funding Goal</TableHead>
                      <TableHead>Current Funding</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project: any) => (
                      <TableRow key={project.id} data-testid={`row-project-${project.id}`}>
                        <TableCell className="font-medium">{project.title}</TableCell>
                        <TableCell>
                          {project.owner ? `${project.owner.firstName} ${project.owner.lastName}` : 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{project.category}</Badge>
                        </TableCell>
                        <TableCell>₹{parseFloat(project.fundingGoal || 0).toLocaleString()}</TableCell>
                        <TableCell>₹{parseFloat(project.currentFunding || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              project.status === 'approved' ? 'default' : 
                              project.status === 'pending_review' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(project.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="space-x-2">
                          {project.status === 'pending_review' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateProjectStatusMutation.mutate({ 
                                  projectId: project.id, 
                                  status: 'approved' 
                                })}
                                disabled={updateProjectStatusMutation.isPending}
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
                                disabled={updateProjectStatusMutation.isPending}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredProjects.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No projects found matching your criteria.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Investments Management Tab */}
          <TabsContent value="investments">
            <Card data-testid="card-investments-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Investments Management
                </CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search investments..."
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
                      <TableHead>Project</TableHead>
                      <TableHead>Investor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Returns</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvestments.map((investment: any) => (
                      <TableRow key={investment.id} data-testid={`row-investment-${investment.id}`}>
                        <TableCell className="font-medium">
                          {investment.project?.title || 'Project N/A'}
                        </TableCell>
                        <TableCell>
                          {investment.investor ? `${investment.investor.firstName} ${investment.investor.lastName}` : 'Unknown'}
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          ₹{parseFloat(investment.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{investment.investmentType || 'Standard'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              investment.status === 'completed' ? 'default' : 
                              investment.status === 'pending' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {investment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(investment.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {investment.expectedReturn ? `${investment.expectedReturn}%` : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredInvestments.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No investments found matching your criteria.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Companies Management Tab */}
          <TabsContent value="companies">
            <Card data-testid="card-companies-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  Companies Management
                </CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search companies..."
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
                      <TableHead>Industry</TableHead>
                      <TableHead>Registration Number</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company: any) => (
                      <TableRow key={company.id} data-testid={`row-company-${company.id}`}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{company.industry || 'Not specified'}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {company.registrationNumber || 'Pending'}
                        </TableCell>
                        <TableCell>
                          {company.owner ? `${company.owner.firstName} ${company.owner.lastName}` : 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              company.status === 'approved' ? 'default' : 
                              company.status === 'pending' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {company.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(company.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="space-x-2">
                          {company.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateCompanyStatusMutation.mutate({ 
                                  companyId: company.id, 
                                  status: 'approved' 
                                })}
                                disabled={updateCompanyStatusMutation.isPending}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateCompanyStatusMutation.mutate({ 
                                  companyId: company.id, 
                                  status: 'rejected' 
                                })}
                                disabled={updateCompanyStatusMutation.isPending}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredCompanies.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No companies found matching your criteria.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Management Tab */}
          <TabsContent value="services">
            <Card data-testid="card-services-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-indigo-600" />
                  Services Management
                </CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search services..."
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
                      <TableHead>Service Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service: any) => (
                      <TableRow key={service.id} data-testid={`row-service-${service.id}`}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{service.category}</Badge>
                        </TableCell>
                        <TableCell>
                          {service.provider ? `${service.provider.firstName} ${service.provider.lastName}` : 'Internal'}
                        </TableCell>
                        <TableCell className="font-bold">
                          ₹{parseFloat(service.price || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              service.status === 'active' ? 'default' : 
                              service.status === 'pending' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {service.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(service.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewServiceModal(service)}
                          >
                            View
                          </Button>
                          {service.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => updateServiceStatusMutation.mutate({ 
                                serviceId: service.id, 
                                status: 'active' 
                              })}
                              disabled={updateServiceStatusMutation.isPending}
                            >
                              Approve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredServices.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No services found matching your criteria.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Management Tab */}
          <TabsContent value="events">
            <Card data-testid="card-events-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-red-600" />
                  Events Management
                </CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search events..."
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
                      <TableHead>Event Title</TableHead>
                      <TableHead>Organizer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event: any) => (
                      <TableRow key={event.id} data-testid={`row-event-${event.id}`}>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell>
                          {event.organizer ? `${event.organizer.firstName} ${event.organizer.lastName}` : 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {new Date(event.eventDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{event.location || 'TBD'}</TableCell>
                        <TableCell>{event.capacity || 'Unlimited'}</TableCell>
                        <TableCell className="font-bold text-blue-600">
                          {event.registeredCount || 0}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              event.status === 'active' ? 'default' : 
                              event.status === 'pending' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {event.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewEventModal(event)}
                          >
                            View
                          </Button>
                          {event.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => updateEventStatusMutation.mutate({ 
                                eventId: event.id, 
                                status: 'active' 
                              })}
                              disabled={updateEventStatusMutation.isPending}
                            >
                              Approve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredEvents.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No events found matching your criteria.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tenders Management Tab */}
          <TabsContent value="tenders">
            <Card data-testid="card-tenders-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  Tenders Management
                </CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search tenders..."
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
                      <TableHead>Tender Title</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Bidders</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenders.map((tender: any) => (
                      <TableRow key={tender.id} data-testid={`row-tender-${tender.id}`}>
                        <TableCell className="font-medium">{tender.title}</TableCell>
                        <TableCell>{tender.organization}</TableCell>
                        <TableCell className="font-bold">
                          ₹{parseFloat(tender.estimatedValue || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {new Date(tender.deadline).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-bold text-blue-600">
                          {tender.bidCount || 0}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              tender.status === 'active' ? 'default' : 
                              tender.status === 'draft' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {tender.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewTenderModal(tender)}
                          >
                            View
                          </Button>
                          {tender.status === 'draft' && (
                            <Button
                              size="sm"
                              onClick={() => updateTenderStatusMutation.mutate({ 
                                tenderId: tender.id, 
                                status: 'active' 
                              })}
                              disabled={updateTenderStatusMutation.isPending}
                            >
                              Publish
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredTenders.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No tenders found matching your criteria.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Formations Management Tab */}
          <TabsContent value="formations">
            <Card data-testid="card-formations-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-cyan-600" />
                  Company Formations
                </CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search formations..."
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
                      <TableHead>Company Name</TableHead>
                      <TableHead>Formation Type</TableHead>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Application Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Fee Paid</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFormations.map((formation: any) => (
                      <TableRow key={formation.id} data-testid={`row-formation-${formation.id}`}>
                        <TableCell className="font-medium">{formation.companyName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{formation.formationType}</Badge>
                        </TableCell>
                        <TableCell>
                          {formation.applicant ? `${formation.applicant.firstName} ${formation.applicant.lastName}` : 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {new Date(formation.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              formation.status === 'completed' ? 'default' : 
                              formation.status === 'processing' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {formation.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          ₹{parseFloat(formation.feePaid || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewFormationModal(formation)}
                          >
                            View
                          </Button>
                          {formation.status === 'submitted' && (
                            <Button
                              size="sm"
                              onClick={() => updateFormationStatusMutation.mutate({ 
                                formationId: formation.id, 
                                status: 'processing' 
                              })}
                              disabled={updateFormationStatusMutation.isPending}
                            >
                              Start Processing
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredFormations.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No company formation applications found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Management Tab */}
          <TabsContent value="categories">
            <Card data-testid="card-categories-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-pink-600" />
                  Categories Management
                </CardTitle>
                <Button
                  onClick={() => {
                    setModalType("category");
                    setEditingItem({ name: "", description: "", isActive: true });
                    setIsCreateModalOpen(true);
                  }}
                >
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
                      <TableHead>Projects Count</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category: any) => (
                      <TableRow key={category.id} data-testid={`row-category-${category.id}`}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.description}</TableCell>
                        <TableCell className="font-bold text-blue-600">
                          {category.projectCount || 0}
                        </TableCell>
                        <TableCell>
                          <Badge variant={category.isActive ? 'default' : 'destructive'}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(category.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingItem({
                                id: category.id,
                                name: category.name,
                                description: category.description,
                                isActive: category.isActive
                              });
                              setModalType("category");
                              setIsCreateModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteItemMutation.mutate({ type: "category", id: category.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredCategories.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No categories found. Click "Add Category" to create your first category.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Departments Management Tab */}
          <TabsContent value="departments">
            <Card data-testid="card-departments-management">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-teal-600" />
                  Departments Management
                </CardTitle>
                <Button
                  onClick={() => {
                    setModalType("department");
                    setEditingItem({ name: "", description: "", head: "", isActive: true });
                    setIsCreateModalOpen(true);
                  }}
                >
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
                      <TableHead>Department Head</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDepartments.map((department: any) => (
                      <TableRow key={department.id} data-testid={`row-department-${department.id}`}>
                        <TableCell className="font-medium">{department.name}</TableCell>
                        <TableCell>{department.description}</TableCell>
                        <TableCell>{department.head || 'Unassigned'}</TableCell>
                        <TableCell className="font-bold text-blue-600">
                          {department.memberCount || 0}
                        </TableCell>
                        <TableCell>
                          <Badge variant={department.isActive ? 'default' : 'destructive'}>
                            {department.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(department.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingItem({
                                id: department.id,
                                name: department.name,
                                description: department.description,
                                head: department.head,
                                isActive: department.isActive
                              });
                              setModalType("department");
                              setIsCreateModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteItemMutation.mutate({ type: "department", id: department.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredDepartments.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No departments found. Click "Add Department" to create your first department.</p>
                  </div>
                )}
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
                  {platformSettings.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Setting Key</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {platformSettings.map((setting: any) => (
                          <TableRow key={setting.id}>
                            <TableCell className="font-medium">{setting.key}</TableCell>
                            <TableCell className="font-bold text-blue-600">{setting.value}</TableCell>
                            <TableCell>{setting.description}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{setting.category}</Badge>
                            </TableCell>
                            <TableCell>{new Date(setting.updatedAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No platform settings found. Configure your first setting!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallet Management Tab */}
          <TabsContent value="wallet-management">
            <Card data-testid="card-wallet-management">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Wallet Management
                </CardTitle>
                <CardDescription>
                  Manage user wallets, transactions, and credit operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {walletAnalytics.totalDeposits?.toLocaleString('en-IN') || 0} QP
                      </div>
                      <p className="text-sm text-gray-600">Total Deposits</p>
                    </Card>
                    <Card className="p-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {walletAnalytics.totalDepositors || 0}
                      </div>
                      <p className="text-sm text-gray-600">Active Wallets</p>
                    </Card>
                    <Card className="p-4">
                      <div className="text-2xl font-bold text-purple-600">
                        {walletAnalytics.averageBalance?.toLocaleString('en-IN') || 0} QP
                      </div>
                      <p className="text-sm text-gray-600">Average Balance</p>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Recent Wallet Transactions</h3>
                      <Button size="sm" variant="outline">Export</Button>
                    </div>
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Balance After</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {walletTransactions.length > 0 ? (
                              walletTransactions.map((transaction: any) => (
                                <TableRow key={transaction.id}>
                                  <TableCell>
                                    <div className="font-medium">{transaction.userName}</div>
                                    <div className="text-sm text-gray-500">{transaction.userEmail}</div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={
                                      transaction.type === 'deposit' ? 'default' :
                                      transaction.type === 'referral_bonus' ? 'secondary' :
                                      transaction.type === 'earn' ? 'default' : 'destructive'
                                    }>
                                      {transaction.type.replace('_', ' ')}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className={transaction.amount > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                    {transaction.amount > 0 ? '+' : ''}{transaction.amount} QP
                                  </TableCell>
                                  <TableCell>{transaction.description}</TableCell>
                                  <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                                  <TableCell className="font-medium">{transaction.balanceAfter} QP</TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                  No wallet transactions found
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referral Management Tab */}
          <TabsContent value="referral-management">
            <Card data-testid="card-referral-management">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  Referral Management
                </CardTitle>
                <CardDescription>
                  Manage referral program, track conversions, and handle rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <div className="text-2xl font-bold text-orange-600">
                        {referralAnalytics.totalReferrals || 0}
                      </div>
                      <p className="text-sm text-gray-600">Total Referrals</p>
                    </Card>
                    <Card className="p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {referralAnalytics.completedReferrals || 0}
                      </div>
                      <p className="text-sm text-gray-600">Successful</p>
                    </Card>
                    <Card className="p-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {referralAnalytics.conversionRate || 0}%
                      </div>
                      <p className="text-sm text-gray-600">Conversion Rate</p>
                    </Card>
                    <Card className="p-4">
                      <div className="text-2xl font-bold text-purple-600">
                        {(referralAnalytics.totalRewards || 0).toLocaleString('en-IN')} QP
                      </div>
                      <p className="text-sm text-gray-600">Total Rewards</p>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">All Referrals</h3>
                      <div className="space-x-2">
                        <Button size="sm" variant="outline">Filter</Button>
                        <Button size="sm" variant="outline">Export</Button>
                      </div>
                    </div>
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Referrer</TableHead>
                              <TableHead>Referred Email</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Reward</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {referralRecords.length > 0 ? (
                              referralRecords.map((referral: any) => (
                                <TableRow key={referral.id}>
                                  <TableCell>
                                    <div className="font-medium">{referral.referrerName}</div>
                                    <div className="text-sm text-gray-500">{referral.referrerEmail}</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">{referral.referredName}</div>
                                    <div className="text-sm text-gray-500">{referral.referredEmail}</div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={
                                      referral.status === 'credited' ? 'default' : 
                                      referral.status === 'pending' ? 'secondary' : 'destructive'
                                    }>
                                      {referral.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-medium text-green-600">
                                    {referral.rewardAmount} QP
                                  </TableCell>
                                  <TableCell>{new Date(referral.createdAt).toLocaleDateString()}</TableCell>
                                  <TableCell>{referral.referralCode}</TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                  No referral records found
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>

      {/* Create/Edit Item Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem.id ? 'Edit' : 'Create'} {modalType === 'media-content' ? 'Media Content' : modalType?.charAt(0).toUpperCase() + modalType?.slice(1)}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {modalType === 'media-content' ? (
              <>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={editingItem.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={editingItem.type || ''} onValueChange={(value) => setEditingItem({ ...editingItem, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="guide">Guide</SelectItem>
                      <SelectItem value="case_study">Case Study</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    value={editingItem.author || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, author: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={editingItem.url || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                    required
                  />
                </div>
              </>
            ) : modalType === 'company' ? (
              <>
                <div>
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={editingItem.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="owner">Owner</Label>
                  <select 
                    className="w-full mt-1 p-2 border rounded-md"
                    value={editingItem.ownerId || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, ownerId: e.target.value })}
                    required
                  >
                    <option value="">Select owner...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email}) - {user.userType}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      value={editingItem.industry || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, industry: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="foundedYear">Founded Year</Label>
                    <Input
                      id="foundedYear"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={editingItem.foundedYear || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, foundedYear: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={editingItem.website || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, website: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="employeeCount">Employee Count</Label>
                    <Input
                      id="employeeCount"
                      type="number"
                      min="1"
                      value={editingItem.employeeCount || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, employeeCount: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={editingItem.city || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, city: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={editingItem.state || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, state: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </>
            ) : modalType === 'service' ? (
              <>
                <div>
                  <Label htmlFor="name">Service Name</Label>
                  <Input
                    id="name"
                    value={editingItem.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (QP)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={editingItem.price || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={editingItem.category || ''} onValueChange={(value) => setEditingItem({ ...editingItem, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Consulting">Consulting</SelectItem>
                        <SelectItem value="Legal">Legal</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="providerId">Service Provider</Label>
                  <Select value={editingItem.providerId || ''} onValueChange={(value) => setEditingItem({ ...editingItem, providerId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(u => u.userType === 'individual').map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : modalType === 'event' ? (
              <>
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={editingItem.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="creator">Event Creator</Label>
                  <select 
                    className="w-full mt-1 p-2 border rounded-md"
                    value={editingItem.creatorId || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, creatorId: e.target.value })}
                    required
                  >
                    <option value="">Select creator...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eventDate">Event Date</Label>
                    <Input
                      id="eventDate"
                      type="datetime-local"
                      value={editingItem.eventDate || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, eventDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="eventType">Event Type</Label>
                    <Select value={editingItem.eventType || ''} onValueChange={(value) => setEditingItem({ ...editingItem, eventType: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Conference">Conference</SelectItem>
                        <SelectItem value="Workshop">Workshop</SelectItem>
                        <SelectItem value="Networking">Networking</SelectItem>
                        <SelectItem value="Competition">Competition</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="venue">Venue</Label>
                    <Input
                      id="venue"
                      value={editingItem.venue || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, venue: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxParticipants">Max Participants</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      min="1"
                      value={editingItem.maxParticipants || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, maxParticipants: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Registration Fee (QP)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={editingItem.price || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Is Paid Event?</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        checked={editingItem.isPaid || false}
                        onChange={(e) => setEditingItem({ ...editingItem, isPaid: e.target.checked })}
                      />
                      <span>This is a paid event</span>
                    </div>
                  </div>
                </div>
              </>
            ) : modalType === 'tender' ? (
              <>
                <div>
                  <Label htmlFor="title">Tender Title</Label>
                  <Input
                    id="title"
                    value={editingItem.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="organization">Organization</Label>
                    <Input
                      id="organization"
                      value={editingItem.organization || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, organization: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={editingItem.category || ''} onValueChange={(value) => setEditingItem({ ...editingItem, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Energy">Energy</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Construction">Construction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estimatedValue">Budget (QP)</Label>
                    <Input
                      id="estimatedValue"
                      type="number"
                      min="0"
                      value={editingItem.estimatedValue || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, estimatedValue: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="submissionDeadline">Submission Deadline</Label>
                    <Input
                      id="submissionDeadline"
                      type="datetime-local"
                      value={editingItem.submissionDeadline || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, submissionDeadline: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="eligibilityCriteria">Eligibility Criteria</Label>
                  <Textarea
                    id="eligibilityCriteria"
                    value={editingItem.eligibilityCriteria || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, eligibilityCriteria: e.target.value })}
                    required
                  />
                </div>
              </>
            ) : (
              // Default form for categories, departments, etc.
              <>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editingItem.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    required
                  />
                </div>
              </>
            )}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createItemMutation.isPending}>
                {createItemMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View User Modal */}
      <Dialog open={!!viewUserModal} onOpenChange={() => setViewUserModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewUserModal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="font-medium">{viewUserModal.firstName} {viewUserModal.lastName}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p>{viewUserModal.email}</p>
                </div>
                <div>
                  <Label>User Type</Label>
                  <Badge>{viewUserModal.userType}</Badge>
                </div>
                <div>
                  <Label>KYC Status</Label>
                  <Badge variant={viewUserModal.isKycComplete ? "default" : "secondary"}>
                    {viewUserModal.isKycComplete ? "Verified" : "Pending"}
                  </Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={viewUserModal.status === 'active' ? "default" : "destructive"}>
                    {viewUserModal.status || 'active'}
                  </Badge>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p>{viewUserModal.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Company Formation Modal */}
      <Dialog open={!!editFormationModal} onOpenChange={() => setEditFormationModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Company Formation Details</DialogTitle>
          </DialogHeader>
          {editFormationModal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company Name</Label>
                  <p className="font-medium">{editFormationModal.companyName}</p>
                </div>
                <div>
                  <Label>Company Type</Label>
                  <p>{editFormationModal.companyType}</p>
                </div>
                <div>
                  <Label>Current Step</Label>
                  <p>{editFormationModal.currentStep || 1}/9 - {getProcessName(editFormationModal.currentStep || 1)}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge>{editFormationModal.status || 'In Progress'}</Badge>
                </div>
                <div>
                  <Label>Assigned Agent</Label>
                  <p>{editFormationModal.assignedConsultant ? 
                    users.find(u => u.id === editFormationModal.assignedConsultant)?.firstName + ' ' + 
                    users.find(u => u.id === editFormationModal.assignedConsultant)?.lastName + ' (' +
                    users.find(u => u.id === editFormationModal.assignedConsultant)?.email + ')' 
                    : 'No agent assigned'}</p>
                </div>
              </div>
              
              {editFormationModal.assignAgent && (
                <div className="mt-6 p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Assign CA/Agent</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Select CA/Agent</Label>
                      <select 
                        className="w-full mt-1 p-2 border rounded-md"
                        onChange={(e) => {
                          if (e.target.value) {
                            updateFormationMutation.mutate({
                              id: editFormationModal.id,
                              data: { assignedConsultant: e.target.value }
                            });
                          }
                        }}
                        defaultValue={editFormationModal.assignedConsultant || ''}
                      >
                        <option value="">Select an agent...</option>
                        {users.filter(u => u.userType === 'admin' || u.userType === 'agent').map(user => (
                          <option key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setEditFormationModal(null)}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    const currentStep = editFormationModal.currentStep || 1;
                    const nextStep = currentStep + 1;
                    
                    // Don't advance beyond step 9
                    if (nextStep > 9) return;
                    
                    // Check if all processes are complete
                    const allProcessesComplete = editFormationModal.companyCreated && 
                      editFormationModal.dinGenerated && 
                      editFormationModal.documentsObtained && 
                      editFormationModal.trademarkApplied && 
                      editFormationModal.bankAccountCreated && 
                      editFormationModal.certificationsObtained && 
                      editFormationModal.projectPosted && 
                      editFormationModal.governmentSchemesApplied;
                    
                    // Update the step and status
                    const updateData: any = { currentStep: nextStep };
                    
                    // Mark as completed when reaching step 9 OR when all processes are complete
                    if (nextStep === 9 || allProcessesComplete) {
                      updateData.status = 'completed';
                      if (allProcessesComplete) {
                        updateData.currentStep = 9; // Set to final step if all processes done
                      }
                    }
                    
                    updateFormationMutation.mutate({ 
                      id: editFormationModal.id, 
                      data: updateData
                    });
                  }}
                  disabled={(editFormationModal.currentStep || 1) >= 9}
                >
                  {(editFormationModal.currentStep || 1) >= 9 ? 'Completed' : 'Advance to Next Step'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

          {/* Email Settings Tab */}
          <TabsContent value="email-settings">
            <Card data-testid="card-email-settings">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-pink-600" />
                  Email Settings
                </CardTitle>
                <CardDescription>
                  Configure platform-wide email settings and SMTP credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Email Service Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-600">Email Service</div>
                          <div className="text-2xl font-bold text-green-600">Active</div>
                        </div>
                        <Badge variant="default" className="bg-green-100 text-green-800">Gmail SMTP</Badge>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-600">Monthly Emails</div>
                          <div className="text-2xl font-bold text-blue-600">1,247</div>
                        </div>
                        <Badge variant="secondary">This Month</Badge>
                      </div>
                    </Card>
                  </div>

                  {/* SMTP Configuration */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">SMTP Configuration</h3>
                      <Button size="sm" variant="outline">Test Connection</Button>
                    </div>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <form className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="smtp-host">SMTP Host</Label>
                              <Input 
                                id="smtp-host" 
                                placeholder="smtp.gmail.com" 
                                defaultValue="smtp.gmail.com"
                                data-testid="input-smtp-host"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="smtp-port">SMTP Port</Label>
                              <Input 
                                id="smtp-port" 
                                placeholder="587" 
                                defaultValue="587"
                                data-testid="input-smtp-port"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="smtp-username">Username/Email</Label>
                              <Input 
                                id="smtp-username" 
                                placeholder="admin@qipad.co"
                                data-testid="input-smtp-username"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="smtp-password">App Password</Label>
                              <Input 
                                id="smtp-password" 
                                type="password" 
                                placeholder="••••••••••••••••"
                                data-testid="input-smtp-password"
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch id="enable-smtp" defaultChecked data-testid="switch-enable-smtp" />
                            <Label htmlFor="enable-smtp">Enable SMTP Service</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch id="enable-ssl" defaultChecked data-testid="switch-enable-ssl" />
                            <Label htmlFor="enable-ssl">Use SSL/TLS</Label>
                          </div>
                          
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" data-testid="button-reset-smtp">Reset</Button>
                            <Button type="submit" data-testid="button-save-smtp">Save Configuration</Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Email Templates */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Email Templates</h3>
                      <Button size="sm" variant="outline">Manage Templates</Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="p-4">
                        <div className="text-sm font-medium text-gray-600">Welcome Email</div>
                        <div className="text-xl font-bold">Active</div>
                        <div className="text-xs text-gray-500 mt-1">Sent to new users</div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-sm font-medium text-gray-600">KYC Notifications</div>
                        <div className="text-xl font-bold">Active</div>
                        <div className="text-xs text-gray-500 mt-1">Verification updates</div>
                      </Card>
                      <Card className="p-4">
                        <div className="text-sm font-medium text-gray-600">Investment Alerts</div>
                        <div className="text-xl font-bold">Active</div>
                        <div className="text-xs text-gray-500 mt-1">Project notifications</div>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
    </div>
  );
}