import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield } from "lucide-react";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (loginData: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/admin/login", loginData);
      return response.json();
    },
    onSuccess: (data: any) => {
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("isAdmin", "true");
      toast({ title: "Admin login successful!" });
      navigate("/admin/dashboard");
    },
    onError: (error: any) => {
      toast({ 
        title: "Login failed", 
        description: error.message || "Invalid credentials",
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.username || !credentials.password) {
      toast({ 
        title: "Missing credentials", 
        description: "Please enter both username and password",
        variant: "destructive" 
      });
      return;
    }
    loginMutation.mutate(credentials);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Qipad Admin</CardTitle>
          <p className="text-muted-foreground">Energized startup space management</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Admin Username"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                data-testid="input-admin-username"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Admin Password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                data-testid="input-admin-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loginMutation.isPending}
              data-testid="button-admin-login"
            >
              {loginMutation.isPending ? "Logging in..." : "Login as Admin"}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              <p>Admin credentials:</p>
              <p>Username: admin | Password: qipad2024!</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}