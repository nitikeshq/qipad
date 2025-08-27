import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, DollarSign, PieChart, Calendar, Eye, Download } from "lucide-react";

export function InvestmentsPage() {
  const { data: investments = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/investments']
  });

  const { data: stats = {}, isLoading: statsLoading } = useQuery<any>({
    queryKey: ['/api/investments/stats']
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      case 'failed': return 'Failed';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">Investments</h1>
              <p className="text-muted-foreground">Track your investment portfolio and returns</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{stats.totalInvested || '0'}</div>
                  <p className="text-xs text-muted-foreground">
                    +2.5% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeInvestments || '0'}</div>
                  <p className="text-xs text-muted-foreground">
                    Across {stats.uniqueProjects || '0'} projects
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Returns</CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{stats.totalReturns || '0'}</div>
                  <p className="text-xs text-muted-foreground">
                    +12.5% total return
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{stats.portfolioValue || '0'}</div>
                  <p className="text-xs text-muted-foreground">
                    Current market value
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="investments" className="space-y-6">
              <TabsList>
                <TabsTrigger value="investments">My Investments</TabsTrigger>
                <TabsTrigger value="portfolio">Portfolio Analysis</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="investments">
                <Card>
                  <CardHeader>
                    <CardTitle>Investment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="text-center py-8">Loading investments...</div>
                    ) : investments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <DollarSign className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                        <p>No investments yet</p>
                        <p className="text-sm mt-2">Start investing in promising projects</p>
                        <Button className="mt-4" data-testid="button-browse-projects">
                          Browse Projects
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {investments.map((investment: any) => (
                          <div key={investment.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-semibold">{investment.project?.title || 'Unknown Project'}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Investment Date: {new Date(investment.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge variant={getStatusColor(investment.status)}>
                                {getStatusText(investment.status)}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Investment Amount</p>
                                <p className="font-semibold">₹{investment.amount}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Current Value</p>
                                <p className="font-semibold">₹{(parseFloat(investment.amount) * 1.125).toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Return</p>
                                <p className="font-semibold text-green-600">+12.5%</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" data-testid={`button-view-project-${investment.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Project
                              </Button>
                              <Button size="sm" variant="outline" data-testid={`button-download-certificate-${investment.id}`}>
                                <Download className="h-4 w-4 mr-2" />
                                Certificate
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="portfolio">
                <Card>
                  <CardHeader>
                    <CardTitle>Portfolio Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <PieChart className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                      <p>Portfolio analysis coming soon</p>
                      <p className="text-sm mt-2">Detailed charts and analytics will be available here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports">
                <Card>
                  <CardHeader>
                    <CardTitle>Investment Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Download className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                      <p>Generate and download investment reports</p>
                      <div className="mt-4 space-x-4">
                        <Button variant="outline" data-testid="button-monthly-report">
                          Monthly Report
                        </Button>
                        <Button variant="outline" data-testid="button-annual-report">
                          Annual Report
                        </Button>
                        <Button variant="outline" data-testid="button-tax-report">
                          Tax Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}