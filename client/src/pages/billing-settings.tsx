import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Download, ArrowLeft, DollarSign, Calendar, Receipt } from "lucide-react";
import { useLocation } from "wouter";
import type { User } from "@/lib/auth";

export default function BillingSettingsPage() {
  const [, setLocation] = useLocation();

  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  const { data: investments = [] } = useQuery({
    queryKey: ['/api/investments/my'],
  });

  // Calculate billing summary
  const totalInvestments = investments.filter((inv: any) => inv.type === 'invest').length;
  const totalInvestedAmount = investments
    .filter((inv: any) => inv.type === 'invest' && inv.status === 'completed')
    .reduce((sum: number, inv: any) => sum + parseFloat(inv.amount || '0'), 0);
  
  const platformFeesPaid = investments
    .filter((inv: any) => inv.platformFeePaid)
    .reduce((sum: number, inv: any) => sum + (parseFloat(inv.amount || '0') * 0.02), 0);

  const pendingFees = investments
    .filter((inv: any) => inv.status === 'completed' && !inv.platformFeePaid)
    .reduce((sum: number, inv: any) => sum + (parseFloat(inv.amount || '0') * 0.02), 0);

  return (
    <div>
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setLocation("/dashboard")}
              className="mb-4"
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Billing & Payments</h1>
            <p className="text-muted-foreground mt-1">
              Manage your billing information and view transaction history
            </p>
          </div>

          <div className="grid gap-6">
            {/* Billing Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Billing Summary
                </CardTitle>
                <CardDescription>
                  Overview of your investment activity and platform fees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{totalInvestments}</div>
                    <div className="text-sm text-muted-foreground">Total Investments</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-foreground">₹{totalInvestedAmount.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Amount Invested</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">₹{platformFeesPaid.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Fees Paid</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">₹{pendingFees.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Pending Fees</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platform Fee Information */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Fee Structure</CardTitle>
                <CardDescription>
                  Understanding Qipad's transparent fee model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">Investment Fees</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Equity Investment Fee:</span>
                        <span className="font-medium">2% of investment amount</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Support/Donation Fee:</span>
                        <span className="font-medium">2% of support amount</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fee Payment:</span>
                        <span className="font-medium">Trust-based system</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Fee Collection</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Fees are collected based on honor system</p>
                      <p>• No automatic deduction from investments</p>
                      <p>• Investors pay fees after successful transactions</p>
                      <p>• Transparent reporting of all fees</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Receipt className="h-5 w-5 mr-2" />
                    Transaction History
                  </CardTitle>
                  <CardDescription>
                    View your recent investment transactions
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardHeader>
              <CardContent>
                {investments.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No transactions yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your investment history will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {investments.map((investment: any) => (
                      <div
                        key={investment.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`transaction-${investment.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${
                            investment.type === 'invest' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                          }`}>
                            <DollarSign className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {investment.type === 'invest' ? 'Equity Investment' : 'Support/Donation'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {investment.project?.title || 'Unknown Project'}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {new Date(investment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-medium">₹{parseFloat(investment.amount || '0').toLocaleString()}</p>
                          {investment.type === 'invest' && investment.expectedStakes && (
                            <p className="text-sm text-muted-foreground">
                              {investment.expectedStakes}% equity
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge
                              variant={investment.status === 'completed' ? 'default' : 'secondary'}
                            >
                              {investment.status}
                            </Badge>
                            <Badge
                              variant={investment.platformFeePaid ? 'default' : 'destructive'}
                            >
                              {investment.platformFeePaid ? 'Fee Paid' : 'Fee Pending'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fee Payment Reminder */}
            {pendingFees > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-orange-800">Platform Fee Payment Reminder</CardTitle>
                  <CardDescription className="text-orange-700">
                    You have pending platform fees to pay
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-800">
                        Total pending fees: <span className="font-bold">₹{pendingFees.toLocaleString()}</span>
                      </p>
                      <p className="text-sm text-orange-700 mt-1">
                        Please arrange payment for completed investments as per our trust-based fee system.
                      </p>
                    </div>
                    <Button className="bg-orange-600 hover:bg-orange-700">
                      Contact Support
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
              </div>
    </div>
  );
}