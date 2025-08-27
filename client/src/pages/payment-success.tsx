import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { CheckCircle, ArrowLeft, Calendar, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PaymentSuccess() {
  const [location] = useLocation();
  const [paymentType, setPaymentType] = useState<string>("");
  
  useEffect(() => {
    // Extract payment type from URL query params
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const type = urlParams.get('type') || 'payment';
    setPaymentType(type);
  }, [location]);

  const getSuccessMessage = () => {
    switch (paymentType) {
      case 'event':
        return {
          title: "Event Registration Successful!",
          description: "You have successfully registered for the event. Check your email for confirmation details.",
          icon: <Calendar className="h-16 w-16 text-green-500" />,
          actionText: "View My Events",
          actionUrl: "/events"
        };
      case 'support':
        return {
          title: "Support Payment Successful!",
          description: "Thank you for supporting this innovation! Your contribution helps entrepreneurs succeed.",
          icon: <CheckCircle className="h-16 w-16 text-green-500" />,
          actionText: "View Innovations",
          actionUrl: "/innovations"
        };
      case 'investment':
        return {
          title: "Investment Submitted Successfully!",
          description: "Your investment proposal has been submitted. The project owner will review and respond soon.",
          icon: <CreditCard className="h-16 w-16 text-green-500" />,
          actionText: "View My Investments",
          actionUrl: "/investments"
        };
      case 'subscription':
        return {
          title: "Subscription Activated!",
          description: "Welcome to Qipad premium! Your subscription is now active and ready to use.",
          icon: <CheckCircle className="h-16 w-16 text-green-500" />,
          actionText: "Go to Dashboard",
          actionUrl: "/dashboard"
        };
      default:
        return {
          title: "Payment Successful!",
          description: "Your payment has been processed successfully. Thank you for using Qipad!",
          icon: <CheckCircle className="h-16 w-16 text-green-500" />,
          actionText: "Go to Dashboard",
          actionUrl: "/dashboard"
        };
    }
  };

  const { title, description, icon, actionText, actionUrl } = getSuccessMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            {icon}
          </div>
          <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-base leading-relaxed">
            {description}
          </p>
          
          <div className="flex items-center justify-center">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Payment Verified ✓
            </Badge>
          </div>

          <div className="space-y-3 pt-4">
            <Link href={actionUrl}>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white" data-testid="button-primary-action">
                {actionText}
              </Button>
            </Link>
            
            <Link href="/dashboard">
              <Button variant="outline" className="w-full" data-testid="button-dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}