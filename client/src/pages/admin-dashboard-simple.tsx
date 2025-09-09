import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Mail, DollarSign, Users } from "lucide-react";

function adminApiRequest(method: string, url: string, body?: any) {
  const token = localStorage.getItem('adminToken');
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...(body && { body: JSON.stringify(body) })
  });
}

export default function AdminDashboard() {
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">Comprehensive platform management</p>
      </div>

      <Tabs defaultValue="wallet-management" className="space-y-4">
        <TabsList>
          <TabsTrigger value="wallet-management">Wallet Management</TabsTrigger>
          <TabsTrigger value="referral-management">Referral Management</TabsTrigger>
          <TabsTrigger value="email-settings">Email Settings</TabsTrigger>
        </TabsList>

        {/* Wallet Management Tab */}
        <TabsContent value="wallet-management">
          <Card>
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
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recent Wallet Transactions</h3>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referral Management Tab */}
        <TabsContent value="referral-management">
          <Card>
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
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">All Referrals</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referrer</TableHead>
                      <TableHead>Referred User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reward</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Code</TableHead>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings Tab */}
        <TabsContent value="email-settings">
          <Card>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">Active</div>
                      <div className="text-sm text-gray-600">Email Service</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">1,247</div>
                      <div className="text-sm text-gray-600">Monthly Emails</div>
                    </div>
                  </Card>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">SMTP Configuration</h3>
                    <form className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="smtp-host">SMTP Host</Label>
                          <Input id="smtp-host" placeholder="smtp.gmail.com" defaultValue="smtp.gmail.com" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtp-port">SMTP Port</Label>
                          <Input id="smtp-port" placeholder="587" defaultValue="587" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="smtp-username">Username/Email</Label>
                          <Input id="smtp-username" placeholder="admin@qipad.co" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtp-password">App Password</Label>
                          <Input id="smtp-password" type="password" placeholder="••••••••••••••••" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="enable-smtp" defaultChecked />
                        <Label htmlFor="enable-smtp">Enable SMTP Service</Label>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline">Reset</Button>
                        <Button type="submit">Save Configuration</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}