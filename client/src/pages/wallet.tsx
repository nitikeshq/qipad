import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  Send, 
  Gift, 
  History, 
  Plus,
  Info,
  Copy,
  Check,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { format } from "date-fns";

interface WalletData {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  status: string;
  createdAt: string;
}

interface PersonalReferral {
  referralId: string;
  referralUrl: string;
  totalReferrals: number;
  totalEarned: number;
}

interface Referral {
  id: string;
  referredEmail: string;
  referralCode: string;
  referralId: string;
  referralUrl: string;
  status: string;
  rewardAmount: number;
  createdAt: string;
}

interface ReferralResponse {
  personalReferral: PersonalReferral;
  referrals: Referral[];
}

export function WalletPage() {
  const [depositAmount, setDepositAmount] = useState("");
  const [referredEmail, setReferredEmail] = useState("");
  const [copiedCode, setCopiedCode] = useState("");
  const [copiedUrl, setCopiedUrl] = useState("");
  const { toast } = useToast();

  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useQuery<WalletData>({
    queryKey: ['/api/wallet']
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/wallet/transactions']
  });

  const { data: referralData, isLoading: referralsLoading, refetch: refetchReferrals } = useQuery<ReferralResponse>({
    queryKey: ['/api/referrals']
  });

  const personalReferral = referralData?.personalReferral;
  const referrals = referralData?.referrals || [];

  const handleDeposit = async () => {
    try {
      const amount = parseFloat(depositAmount);
      if (isNaN(amount) || amount < 10) {
        toast({
          title: "Invalid Amount",
          description: "Minimum deposit amount is ₹10",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ amount })
      });

      const data = await response.json();

      if (data.success) {
        // Create a form to submit to PayUMoney
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.paymentUrl;

        Object.entries(data.formData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value as string;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      } else {
        toast({
          title: "Deposit Failed",
          description: data.error || "Failed to initiate deposit",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Deposit error:', error);
      toast({
        title: "Error",
        description: "Failed to process deposit request",
        variant: "destructive",
      });
    }
  };

  const handleReferral = async () => {
    try {
      if (!referredEmail || !referredEmail.includes('@')) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ referredEmail })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Invitation Sent! 📧",
          description: data.message || `Referral invitation sent to ${referredEmail}`,
        });
        setReferredEmail("");
        refetchReferrals();
      } else {
        toast({
          title: "Failed to Send Invitation",
          description: data.error || "Failed to send referral invitation",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Referral error:', error);
      toast({
        title: "Error",
        description: "Failed to create referral",
        variant: "destructive",
      });
    }
  };

  const copyReferralCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
    toast({
      title: "Code Copied",
      description: "Referral code copied to clipboard",
    });
  };

  const copyReferralUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(""), 2000);
    toast({
      title: "URL Copied",
      description: "Referral URL copied to clipboard",
    });
  };

  const calculateDepositFees = (amount: number) => {
    const paymentGatewayFee = amount * 0.02;
    const platformFee = amount * 0.01;
    const totalFees = paymentGatewayFee + platformFee;
    const netCredits = amount - totalFees;
    return { paymentGatewayFee, platformFee, totalFees, netCredits };
  };

  const fees = depositAmount ? calculateDepositFees(parseFloat(depositAmount) || 0) : null;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownRight className="h-4 w-4 text-green-600" />;
      case 'spend': return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'referral_bonus': return <Gift className="h-4 w-4 text-purple-600" />;
      case 'earn': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default: return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'text-green-600';
      case 'earn': return 'text-green-600';
      case 'referral_bonus': return 'text-purple-600';
      case 'spend': return 'text-red-600';
      default: return 'text-gray-600';
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
              <h1 className="text-3xl font-bold text-foreground mb-2">Wallet</h1>
              <p className="text-muted-foreground">Manage your credits, deposits, and referrals</p>
            </div>

            {/* Wallet Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card data-testid="card-wallet-balance">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-balance">
                    {walletLoading ? "..." : `₹${wallet?.balance?.toFixed(2) || '0.00'}`}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    1 Credit = ₹1
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-total-earned">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600" data-testid="text-total-earned">
                    ₹{wallet?.totalEarned?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From referrals & rewards
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-total-spent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <Send className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600" data-testid="text-total-spent">
                    ₹{wallet?.totalSpent?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    On platform features
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="deposit" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="deposit" data-testid="tab-deposit">Deposit</TabsTrigger>
                <TabsTrigger value="history" data-testid="tab-history">Transaction History</TabsTrigger>
                <TabsTrigger value="referrals" data-testid="tab-referrals">Referrals</TabsTrigger>
              </TabsList>

              {/* Deposit Tab */}
              <TabsContent value="deposit">
                <Card data-testid="card-deposit">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Add Credits to Wallet
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Deposit Amount (₹)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Minimum ₹10"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        min="10"
                        step="1"
                        data-testid="input-deposit-amount"
                      />
                    </div>

                    {fees && parseFloat(depositAmount) >= 10 && (
                      <div className="bg-muted p-4 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Info className="h-4 w-4" />
                          Fee Breakdown
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Deposit Amount:</span>
                            <span>₹{parseFloat(depositAmount).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Payment Gateway Fee (2%):</span>
                            <span>-₹{fees.paymentGatewayFee.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Platform Fee (1%):</span>
                            <span>-₹{fees.platformFee.toFixed(2)}</span>
                          </div>
                          <hr className="my-2" />
                          <div className="flex justify-between font-medium">
                            <span>Credits to Receive:</span>
                            <span className="text-green-600">₹{fees.netCredits.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={handleDeposit} 
                      disabled={!depositAmount || parseFloat(depositAmount) < 10}
                      className="w-full"
                      data-testid="button-deposit"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Deposit via PayUMoney
                    </Button>

                    <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-3">💰 Platform Credit Usage Guide</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-background rounded">
                          <span className="flex items-center gap-2">
                            🚀 <strong>Create Innovation Project</strong>
                            <span className="text-xs text-muted-foreground">(Most popular)</span>
                          </span>
                          <span className="font-bold text-primary">100 credits</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-background rounded">
                          <span className="flex items-center gap-2">
                            💼 <strong>Post Job Opening</strong>
                            <span className="text-xs text-muted-foreground">(30-day listing)</span>
                          </span>
                          <span className="font-bold text-blue-600">50 credits</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-background rounded">
                          <span className="flex items-center gap-2">
                            🎯 <strong>Connect with Investors</strong>
                            <span className="text-xs text-muted-foreground">(Per connection)</span>
                          </span>
                          <span className="font-bold text-green-600">10 credits</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-background rounded">
                          <span className="flex items-center gap-2">
                            👥 <strong>Create Community</strong>
                            <span className="text-xs text-muted-foreground">(Permanent)</span>
                          </span>
                          <span className="font-bold text-purple-600">100 credits</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-background rounded">
                          <span className="flex items-center gap-2">
                            🤝 <strong>Join Premium Community</strong>
                            <span className="text-xs text-muted-foreground">(Access fee)</span>
                          </span>
                          <span className="font-bold text-orange-600">10 credits</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-background rounded">
                          <span className="flex items-center gap-2">
                            🎪 <strong>Host Event/Workshop</strong>
                            <span className="text-xs text-muted-foreground">(60-day promotion)</span>
                          </span>
                          <span className="font-bold text-pink-600">50 credits</span>
                        </div>
                      </div>
                      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-800 dark:text-blue-200 text-xs">
                        💡 <strong>Tip:</strong> Credits are deducted only when your submission is approved and goes live on the platform.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Transaction History Tab */}
              <TabsContent value="history">
                <Card data-testid="card-transaction-history">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Transaction History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transactionsLoading ? (
                      <div className="text-center py-8">Loading transactions...</div>
                    ) : transactions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No transactions yet
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {transactions.map((transaction) => (
                          <div 
                            key={transaction.id} 
                            className="flex items-center justify-between p-4 border rounded-lg"
                            data-testid={`transaction-${transaction.id}`}
                          >
                            <div className="flex items-center gap-3">
                              {getTransactionIcon(transaction.type)}
                              <div>
                                <div className="font-medium">{transaction.description}</div>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm')}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-medium ${getTransactionColor(transaction.type)}`}>
                                {transaction.type === 'spend' ? '-' : '+'}₹{transaction.amount.toFixed(2)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Balance: ₹{transaction.balanceAfter.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Referrals Tab */}
              <TabsContent value="referrals">
                <Card data-testid="card-referrals">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5" />
                      Referral System
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Personal Referral Info */}
                    {personalReferral && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-lg">Your Referral Details</h3>
                          <div className="text-right text-sm text-muted-foreground">
                            <div>Total Referrals: <span className="font-bold text-blue-600">{personalReferral.totalReferrals}</span></div>
                            <div>Total Earned: <span className="font-bold text-green-600">₹{personalReferral.totalEarned}</span></div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
                            <div>
                              <span className="font-medium text-sm">Your Referral ID:</span>
                              <div className="font-mono text-lg font-bold text-primary">{personalReferral.referralId}</div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyReferralCode(personalReferral.referralId)}
                              data-testid="button-copy-personal-id"
                            >
                              {copiedCode === personalReferral.referralId ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-sm">Your Referral URL:</span>
                              <div className="text-xs text-muted-foreground truncate mt-1 font-mono">
                                {personalReferral.referralUrl}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyReferralUrl(personalReferral.referralUrl)}
                              data-testid="button-copy-personal-url"
                            >
                              {copiedUrl === personalReferral.referralUrl ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">📧 Invite Friends via Email</h3>
                      <p className="text-sm text-muted-foreground">
                        Send your referral link directly to friends and earn ₹50 credits when they sign up!
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Send Invitation Email</Label>
                        <div className="flex gap-2">
                          <Input
                            id="email"
                            type="email"
                            placeholder="friend@example.com"
                            value={referredEmail}
                            onChange={(e) => setReferredEmail(e.target.value)}
                            data-testid="input-referral-email"
                          />
                          <Button 
                            onClick={handleReferral}
                            disabled={!referredEmail}
                            data-testid="button-send-invitation"
                            className="whitespace-nowrap"
                          >
                            📧 Send Invite
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          We'll send them a beautiful email with your referral link and welcome bonus details.
                        </p>
                      </div>

                      {referralsLoading ? (
                        <div className="text-center py-4">Loading referrals...</div>
                      ) : referrals.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No referrals yet. Start referring friends to earn credits!
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <h4 className="font-medium">Your Referrals</h4>
                          {referrals.map((referral) => (
                            <div 
                              key={referral.id} 
                              className="p-4 border rounded-lg space-y-3"
                              data-testid={`referral-${referral.id}`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{referral.referredEmail}</div>
                                  <Badge variant={referral.status === 'completed' ? 'default' : 'secondary'} className="mt-1">
                                    {referral.status}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ₹{referral.rewardAmount} reward
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                                  <div>
                                    <span className="font-medium">Referral ID:</span> <code className="ml-1">{referral.referralId}</code>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyReferralCode(referral.referralId)}
                                    data-testid={`button-copy-id-${referral.id}`}
                                  >
                                    {copiedCode === referral.referralId ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                                
                                <div className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium">Referral URL:</span>
                                    <div className="text-xs text-muted-foreground truncate mt-1">
                                      {referral.referralUrl}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyReferralUrl(referral.referralUrl)}
                                    data-testid={`button-copy-url-${referral.id}`}
                                  >
                                    {copiedUrl === referral.referralUrl ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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

export default WalletPage;