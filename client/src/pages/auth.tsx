import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Building, TrendingUp, User, Gift, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { authAPI } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'individual' as 'business_owner' | 'investor' | 'individual',
    agreedToTerms: false
  });

  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrerInfo, setReferrerInfo] = useState<any>(null);
  // Detect referral code from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
    }
  }, []);

  // Fetch referrer info when referral code is detected
  const { data: referrer } = useQuery({
    queryKey: ['/api/users/referrer', referralCode],
    enabled: !!referralCode,
    retry: false
  });

  useEffect(() => {
    if (referrer) {
      setReferrerInfo(referrer);
    }
  }, [referrer]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await authAPI.login(loginForm.email, loginForm.password);
      login(response.user, response.token);
      toast({ title: "Login successful!" });
      setLocation('/dashboard');
    } catch (error) {
      toast({ title: "Login failed", description: "Invalid credentials", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    
    if (!registerForm.agreedToTerms) {
      toast({ title: "Please agree to terms and conditions", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await authAPI.register({
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        email: registerForm.email,
        phone: registerForm.phone,
        userType: registerForm.userType,
        passwordHash: registerForm.password,
        referralCode: referralCode || undefined
      });
      
      login(response.user, response.token);
      const successMessage = referralCode 
        ? "Registration successful! You've received ₹30 bonus credits!" 
        : "Registration successful!";
      toast({ title: successMessage });
      setLocation('/dashboard');
    } catch (error) {
      toast({ title: "Registration failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    // Mock Google OAuth for now
    toast({ title: "Google OAuth not implemented yet", variant: "destructive" });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center">
                <span className="text-blue-600 font-bold">Q</span>
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary" data-testid="logo-qipad-auth">Qipad</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground px-2">Energized startup space for entrepreneurs and investors</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
            <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email Address</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                      required
                      data-testid="input-login-email"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter password"
                      required
                      data-testid="input-login-password"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember" />
                      <Label htmlFor="remember" className="text-sm">Remember me</Label>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline">Forgot password?</a>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-login">
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                  
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border"></span>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-card px-2 text-muted-foreground">or continue with</span>
                    </div>
                  </div>
                  
                  <Button type="button" variant="outline" className="w-full" onClick={handleGoogleAuth} data-testid="button-google-login">
                    <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="w-5 h-5 mr-3" />
                    Sign in with Google
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="register">
            {referralCode && referrerInfo && (
              <Card className="mb-4 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Gift className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-800">You've been invited!</h3>
                      <p className="text-sm text-green-700">
                        <span className="font-medium">{referrerInfo.firstName} {referrerInfo.lastName}</span> invited you to join Qipad
                      </p>
                      <div className="flex items-center mt-2 space-x-4 text-xs text-green-600">
                        <div className="flex items-center space-x-1">
                          <Gift className="h-3 w-3" />
                          <span>You'll get 10 QP bonus</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>They'll get 50 QP bonus</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle>Join Qipad {referralCode && "& Claim Your Bonus!"}</CardTitle>
              </CardHeader>
              <CardContent>
                {referralCode && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <Gift className="h-5 w-5 text-green-600 mr-2" />
                      <div>
                        <p className="text-green-800 font-medium">Referral Bonus Applied! 🎉</p>
                        <p className="text-green-600 text-sm">
                          You'll receive ₹30 total credits (₹10 joining + ₹20 referral bonus)
                        </p>
                        <p className="text-green-500 text-xs mt-1">
                          Referral Code: <span className="font-mono">{referralCode}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label>Account Type</Label>
                    <RadioGroup 
                      value={registerForm.userType} 
                      onValueChange={(value) => setRegisterForm(prev => ({ ...prev, userType: value as 'business_owner' | 'investor' | 'individual' }))}
                      className="grid grid-cols-3 gap-3 mt-2"
                    >
                      <Label className="flex items-center justify-center p-3 border border-border rounded-lg cursor-pointer hover:bg-accent [&:has(:checked)]:bg-primary/10 [&:has(:checked)]:border-primary">
                        <RadioGroupItem value="business_owner" className="sr-only" />
                        <div className="text-center">
                          <Building className="text-primary text-2xl mb-1 mx-auto" />
                          <p className="text-sm font-medium">Business Owner</p>
                        </div>
                      </Label>
                      <Label className="flex items-center justify-center p-3 border border-border rounded-lg cursor-pointer hover:bg-accent [&:has(:checked)]:bg-primary/10 [&:has(:checked)]:border-primary">
                        <RadioGroupItem value="investor" className="sr-only" />
                        <div className="text-center">
                          <TrendingUp className="text-primary text-2xl mb-1 mx-auto" />
                          <p className="text-sm font-medium">Investor</p>
                        </div>
                      </Label>
                      <Label className="flex items-center justify-center p-3 border border-border rounded-lg cursor-pointer hover:bg-accent [&:has(:checked)]:bg-primary/10 [&:has(:checked)]:border-primary">
                        <RadioGroupItem value="individual" className="sr-only" />
                        <div className="text-center">
                          <User className="text-primary text-2xl mb-1 mx-auto" />
                          <p className="text-sm font-medium">Individual</p>
                        </div>
                      </Label>
                    </RadioGroup>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={registerForm.firstName}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="John"
                        required
                        data-testid="input-register-firstname"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={registerForm.lastName}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Smith"
                        required
                        data-testid="input-register-lastname"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="register-email">Email Address</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                      required
                      data-testid="input-register-email"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      data-testid="input-register-phone"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter password"
                      required
                      data-testid="input-register-password"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm password"
                      required
                      data-testid="input-register-confirm-password"
                    />
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="terms" 
                      checked={registerForm.agreedToTerms}
                      onCheckedChange={(checked) => setRegisterForm(prev => ({ ...prev, agreedToTerms: checked as boolean }))}
                      data-testid="checkbox-terms"
                    />
                    <Label htmlFor="terms" className="text-sm text-muted-foreground">
                      I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                    </Label>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-register">
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                  
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border"></span>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-card px-2 text-muted-foreground">or continue with</span>
                    </div>
                  </div>
                  
                  <Button type="button" variant="outline" className="w-full" onClick={handleGoogleAuth} data-testid="button-google-register">
                    <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" className="w-5 h-5 mr-3" />
                    Sign up with Google
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
