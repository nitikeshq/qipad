import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Settings, Bell, Shield, Globe, Moon, Sun, Monitor, ArrowLeft, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  investmentUpdates: boolean;
  communityActivity: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'network';
  showInvestments: boolean;
  showInnovations: boolean;
  allowDirectMessages: boolean;
}

export default function GeneralSettingsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
    const savedLanguage = localStorage.getItem('language') || 'en';
    const savedTimezone = localStorage.getItem('timezone') || 'Asia/Kolkata';
    
    setTheme(savedTheme);
    setLanguage(savedLanguage);
    setTimezone(savedTimezone);
    
    // Apply theme immediately without triggering mutation
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (savedTheme === 'dark') {
      root.classList.add('dark');
    } else if (savedTheme === 'light') {
      root.classList.add('light');
    } else {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(isDarkMode ? 'dark' : 'light');
    }
  }, []);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    updateSettingsMutation.mutate({ language: newLanguage });
  };

  const handleTimezoneChange = (newTimezone: string) => {
    setTimezone(newTimezone);
    localStorage.setItem('timezone', newTimezone);
    updateSettingsMutation.mutate({ timezone: newTimezone });
  };
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    investmentUpdates: true,
    communityActivity: false,
    marketingEmails: false,
    securityAlerts: true,
  });
  
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showInvestments: false,
    showInnovations: true,
    allowDirectMessages: true,
  });

  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      // This would normally save to backend
      return Promise.resolve(settings);
    },
    onSuccess: () => {
      toast({ title: "Settings updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update settings", variant: "destructive" });
    }
  });

  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    updateSettingsMutation.mutate({ notifications: { ...notifications, [key]: value } });
  };

  const handlePrivacyChange = (key: keyof PrivacySettings, value: any) => {
    setPrivacy(prev => ({ ...prev, [key]: value }));
    updateSettingsMutation.mutate({ privacy: { ...privacy, [key]: value } });
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    
    // Apply theme immediately to document
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'light') {
      root.classList.add('light');
    } else {
      // System theme - check user's system preference
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(isDarkMode ? 'dark' : 'light');
    }
    
    // Save to localStorage
    localStorage.setItem('theme', newTheme);
    
    updateSettingsMutation.mutate({ theme: newTheme });
  };

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
                <h1 className="text-3xl font-bold text-foreground">General Settings</h1>
                <p className="text-muted-foreground mt-1">
                  Customize your application preferences and privacy settings
                </p>
              </div>

              <div className="grid gap-6">
            {/* Appearance Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="h-5 w-5 mr-2" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of your application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred color scheme
                    </p>
                  </div>
                  <Select value={theme} onValueChange={handleThemeChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center">
                          <Sun className="h-4 w-4 mr-2" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center">
                          <Moon className="h-4 w-4 mr-2" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center">
                          <Monitor className="h-4 w-4 mr-2" />
                          System
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Language</Label>
                    <p className="text-sm text-muted-foreground">
                      Select your preferred language
                    </p>
                  </div>
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">हिंदी</SelectItem>
                      <SelectItem value="bn">বাংলা</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Timezone</Label>
                    <p className="text-sm text-muted-foreground">
                      Set your local timezone
                    </p>
                  </div>
                  <Select value={timezone} onValueChange={handleTimezoneChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                      <SelectItem value="Asia/Mumbai">Asia/Mumbai</SelectItem>
                      <SelectItem value="Asia/Delhi">Asia/Delhi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Control how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                    data-testid="switch-email-notifications"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Investment Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about investment status changes
                    </p>
                  </div>
                  <Switch
                    checked={notifications.investmentUpdates}
                    onCheckedChange={(checked) => handleNotificationChange('investmentUpdates', checked)}
                    data-testid="switch-investment-updates"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Community Activity</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications for community posts and discussions
                    </p>
                  </div>
                  <Switch
                    checked={notifications.communityActivity}
                    onCheckedChange={(checked) => handleNotificationChange('communityActivity', checked)}
                    data-testid="switch-community-activity"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Important security and account notifications
                    </p>
                  </div>
                  <Switch
                    checked={notifications.securityAlerts}
                    onCheckedChange={(checked) => handleNotificationChange('securityAlerts', checked)}
                    data-testid="switch-security-alerts"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive product updates and promotional content
                    </p>
                  </div>
                  <Switch
                    checked={notifications.marketingEmails}
                    onCheckedChange={(checked) => handleNotificationChange('marketingEmails', checked)}
                    data-testid="switch-marketing-emails"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Privacy
                </CardTitle>
                <CardDescription>
                  Manage your privacy and data sharing preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Profile Visibility</Label>
                    <p className="text-sm text-muted-foreground">
                      Who can see your profile information
                    </p>
                  </div>
                  <Select 
                    value={privacy.profileVisibility} 
                    onValueChange={(value) => handlePrivacyChange('profileVisibility', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="network">Network</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Show Investments</Label>
                    <p className="text-sm text-muted-foreground">
                      Display your investment activity on your profile
                    </p>
                  </div>
                  <Switch
                    checked={privacy.showInvestments}
                    onCheckedChange={(checked) => handlePrivacyChange('showInvestments', checked)}
                    data-testid="switch-show-investments"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Show Innovations</Label>
                    <p className="text-sm text-muted-foreground">
                      Display your innovations on your profile
                    </p>
                  </div>
                  <Switch
                    checked={privacy.showInnovations}
                    onCheckedChange={(checked) => handlePrivacyChange('showInnovations', checked)}
                    data-testid="switch-show-projects"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Allow Direct Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      Let other users send you direct messages
                    </p>
                  </div>
                  <Switch
                    checked={privacy.allowDirectMessages}
                    onCheckedChange={(checked) => handlePrivacyChange('allowDirectMessages', checked)}
                    data-testid="switch-allow-messages"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                  <Trash2 className="h-5 w-5 mr-2" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions that will affect your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-destructive rounded-lg">
                  <div>
                    <p className="font-medium text-destructive">Delete Account</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
    </div>
  );
}