import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, MapPin, Clock, Users, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Event {
  id: string;
  title: string;
  description: string;
  eventType: string;
  isPaid: boolean;
  price: string;
  platformFee: string;
  eventDate: string;
  eventTime: string;
  venue?: string;
  onlineUrl?: string;
  maxParticipants?: number;
  currentParticipants: number;
}

export default function EventPayment() {
  const [, params] = useRoute("/payment/event/:eventId");
  const eventId = params?.eventId;
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ["/api/events", eventId],
    enabled: !!eventId,
  });

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to register for events",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const handlePayment = async () => {
    if (!event || !user) return;

    setIsProcessingPayment(true);

    try {
      const response = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to initiate payment");
      }

      const data = await response.json();

      if (data.success && data.formData) {
        // Paid event - create form and submit to PayUMoney (following reference implementation)
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.paymentUrl;
        form.style.display = 'none';

        // Add all form fields from PayUMoney service
        Object.entries(data.formData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value as string;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        
        // Show loading toast before redirect
        toast({
          title: "Redirecting to Payment Gateway",
          description: "Please wait while we redirect you to the secure payment page...",
        });

        // Submit form to PayUMoney
        form.submit();
        
        // Cleanup after submission
        setTimeout(() => {
          if (document.body.contains(form)) {
            document.body.removeChild(form);
          }
        }, 1000);
      } else if (data.paymentUrl) {
        // Fallback for simple redirect
        window.location.href = data.paymentUrl;
      } else {
        // Free event registration
        toast({
          title: "Registration Successful",
          description: "You have successfully registered for this event!",
        });
        window.location.href = "/events";
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Event Not Found</CardTitle>
            <CardDescription>
              The event you're trying to register for doesn't exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => (window.location.href = "/events")}
              className="w-full"
            >
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Platform fee is INCLUSIVE - user pays event price, platform fee is deducted from it
  const eventPrice = parseFloat(event.price);
  const platformFee = parseFloat(event.platformFee);
  const totalAmount = eventPrice; // User pays the event price only
  const creatorAmount = eventPrice - platformFee; // Creator gets event price minus platform fee

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Event Registration
            </CardTitle>
            <CardDescription>
              Complete your registration for this event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{event.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{event.eventTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{event.eventType === "online" ? "Online Event" : event.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>
                    {event.currentParticipants}
                    {event.maxParticipants && ` / ${event.maxParticipants}`} participants
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Payment Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Event Registration</span>
                  <span>₹{eventPrice.toFixed(2)}</span>
                </div>
                {platformFee > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Platform Fee (included)</span>
                    <span>₹{platformFee.toFixed(2)}</span>
                  </div>
                )}
                {platformFee > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Event Creator Receives</span>
                    <span>₹{creatorAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total Amount</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/events")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                disabled={isProcessingPayment}
                className="flex-1"
              >
                {isProcessingPayment ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                {event.isPaid ? "Pay & Register" : "Register Now"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}