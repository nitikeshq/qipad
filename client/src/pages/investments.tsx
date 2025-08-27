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
    queryKey: ['/api/investments/my']
  });

  const { data: stats = {}, isLoading: statsLoading } = useQuery<any>({
    queryKey: ['/api/investments/my/stats']
  });

  const generateReport = (type: 'monthly' | 'annual' | 'tax') => {
    const reportData = {
      type,
      investments,
      stats,
      generatedAt: new Date().toISOString(),
      period: type === 'monthly' ? 'Last 30 days' : type === 'annual' ? 'Last 12 months' : 'Current tax year'
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investment-report-${type}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
                    {investments.length > 0 ? (
                      <div className="space-y-6">
                        {/* Portfolio Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100">Investment Distribution</h4>
                            <div className="mt-2 space-y-1">
                              <div className="text-sm">Equity: {stats.investmentTypes?.invest || 0} investments</div>
                              <div className="text-sm">Support: {stats.investmentTypes?.support || 0} donations</div>
                            </div>
                          </div>
                          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                            <h4 className="font-semibold text-green-900 dark:text-green-100">Average Investment</h4>
                            <div className="text-2xl font-bold text-green-600">₹{stats.averageInvestment || '0'}</div>
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                            <h4 className="font-semibold text-purple-900 dark:text-purple-100">Projects Invested</h4>
                            <div className="text-2xl font-bold text-purple-600">{stats.uniqueProjects || 0}</div>
                          </div>
                        </div>

                        {/* Investment Timeline */}
                        <div>
                          <h4 className="font-semibold mb-4">Recent Investment Activity</h4>
                          <div className="space-y-3">
                            {investments.slice(0, 5).map((investment: any) => (
                              <div key={investment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div>
                                  <p className="font-medium">{investment.project?.title || 'Project'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(investment.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">₹{investment.amount}</p>
                                  <Badge variant={getStatusColor(investment.status)} className="text-xs">
                                    {getStatusText(investment.status)}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <PieChart className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                        <p>No portfolio data available</p>
                        <p className="text-sm mt-2">Start investing to see your portfolio analysis</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports">
                <Card>
                  <CardHeader>
                    <CardTitle>Investment Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {investments.length > 0 ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="font-semibold">Quick Reports</h4>
                            <div className="space-y-2">
                              <Button 
                                variant="outline" 
                                className="w-full justify-start"
                                onClick={() => generateReport('monthly')}
                                data-testid="button-monthly-report"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Monthly Investment Summary
                              </Button>
                              <Button 
                                variant="outline" 
                                className="w-full justify-start"
                                onClick={() => generateReport('annual')}
                                data-testid="button-annual-report"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Annual Investment Report
                              </Button>
                              <Button 
                                variant="outline" 
                                className="w-full justify-start"
                                onClick={() => generateReport('tax')}
                                data-testid="button-tax-report"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Tax Documentation
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h4 className="font-semibold">Report Statistics</h4>
                            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">Total Investments:</span>
                                <span className="font-semibold">{investments.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Total Amount:</span>
                                <span className="font-semibold">₹{stats.totalInvested || '0'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Last Investment:</span>
                                <span className="font-semibold">
                                  {stats.lastInvestment ? new Date(stats.lastInvestment).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Download className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                        <p>No investment data to generate reports</p>
                        <p className="text-sm mt-2">Start investing to access detailed reports and analytics</p>
                      </div>
                    )}
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