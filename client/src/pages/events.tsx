import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, MapPin, Users, IndianRupee, Video, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  eventType: z.enum(["online", "offline"]),
  isPaid: z.boolean().default(false),
  price: z.string().optional(),
  eventDate: z.string().min(1, "Date is required"),
  eventTime: z.string().min(1, "Time is required"),
  venue: z.string().optional(),
  onlineUrl: z.string().optional(),
  maxParticipants: z.string().optional(),
});

type CreateEventForm = z.infer<typeof createEventSchema>;

export default function Events() {
  const isMobile = useIsMobile();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["/api/events"],
  });

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const form = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      eventType: "online",
      isPaid: false,
      price: "0",
      eventDate: "",
      eventTime: "",
      venue: "",
      onlineUrl: "",
      maxParticipants: "",
    },
  });

  const createEventMutation = useMutation({
    mutationFn: (data: CreateEventForm) => {
      const eventData = {
        ...data,
        price: data.isPaid ? parseFloat(data.price || "0") : 0,
        maxParticipants: data.maxParticipants ? parseInt(data.maxParticipants) : null,
        platformFee: data.isPaid ? parseFloat(data.price || "0") * 0.02 : 0, // 2% platform fee
      };
      return apiRequest("POST", "/api/events", eventData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event created successfully!",
      });
      setShowCreateDialog(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const joinEventMutation = useMutation({
    mutationFn: (eventId: string) => apiRequest("POST", `/api/events/${eventId}/join`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Successfully joined the event!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join event",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateEventForm) => {
    createEventMutation.mutate(data);
  };

  const handleJoinEvent = (eventId: string, isPaid: boolean, price: number) => {
    if (isPaid && price > 0) {
      // Redirect to payment for paid events
      window.location.href = `/payment/event/${eventId}`;
    } else {
      // Direct join for free events
      joinEventMutation.mutate(eventId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const canCreateEvent = (user as any)?.isVerified === true;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        {!isMobile && <Sidebar />}
        <SidebarInset className={`flex-1 flex flex-col ${isMobile ? "w-full" : ""}`}>
          <Header />
            <main className="p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Events</h1>
                <p className="text-muted-foreground mt-2">Discover and create networking events</p>
              </div>
        
        {canCreateEvent && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-event">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Create an engaging event for the community. Only KYC-verified members can create events.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Event Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter event title" 
                              {...field} 
                              data-testid="input-event-title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your event..." 
                              className="min-h-[100px]"
                              {...field} 
                              data-testid="textarea-event-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="eventType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-event-type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="online">Online</SelectItem>
                              <SelectItem value="offline">Offline</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isPaid"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormLabel>Paid Event</FormLabel>
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              data-testid="checkbox-is-paid"
                              className="ml-2"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("isPaid") && (
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (₹)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Enter price" 
                                {...field} 
                                data-testid="input-event-price"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="eventDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              data-testid="input-event-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="eventTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Time</FormLabel>
                          <FormControl>
                            <Input 
                              type="time" 
                              {...field} 
                              data-testid="input-event-time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("eventType") === "offline" && (
                      <FormField
                        control={form.control}
                        name="venue"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Venue</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter venue address" 
                                {...field} 
                                data-testid="input-event-venue"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {form.watch("eventType") === "online" && (
                      <FormField
                        control={form.control}
                        name="onlineUrl"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Online URL (Zoom/Meet Link)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter meeting URL" 
                                {...field} 
                                data-testid="input-event-url"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="maxParticipants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Participants (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Enter limit" 
                              {...field} 
                              data-testid="input-max-participants"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateDialog(false)}
                      data-testid="button-cancel-event"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createEventMutation.isPending}
                      data-testid="button-submit-event"
                    >
                      {createEventMutation.isPending ? "Creating..." : "Create Event"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!canCreateEvent && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 dark:text-yellow-200">
            Only KYC-verified members can create events. Complete your KYC verification to start creating events.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(events as any[]).length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Events Yet</h3>
            <p className="text-gray-600 dark:text-gray-300">
              {canCreateEvent ? "Be the first to create an event!" : "Events will appear here when available."}
            </p>
          </div>
        ) : (
          (events as any[]).map((event: any) => (
            <Card key={event.id} className="overflow-hidden" data-testid={`card-event-${event.id}`}>
              {event.eventImage && (
                <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${event.eventImage})` }} />
              )}
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2" data-testid={`text-event-title-${event.id}`}>
                    {event.title}
                  </CardTitle>
                  <div className="flex flex-col gap-2 ml-4">
                    <Badge variant={event.eventType === "online" ? "secondary" : "outline"}>
                      {event.eventType === "online" ? (
                        <><Video className="w-3 h-3 mr-1" /> Online</>
                      ) : (
                        <><MapPin className="w-3 h-3 mr-1" /> Offline</>
                      )}
                    </Badge>
                    {event.isPaid && (
                      <Badge variant="default">
                        <IndianRupee className="w-3 h-3 mr-1" />
                        ₹{event.price}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="line-clamp-3" data-testid={`text-event-description-${event.id}`}>
                  {event.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(event.eventDate).toLocaleDateString()} at {event.eventTime}
                  </div>
                  
                  {event.venue && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.venue}
                    </div>
                  )}
                  
                  {event.maxParticipants && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <Users className="w-4 h-4 mr-2" />
                      {event.currentParticipants || 0} / {event.maxParticipants} participants
                    </div>
                  )}
                  
                  <Button 
                    className="w-full" 
                    onClick={() => handleJoinEvent(event.id, event.isPaid, event.price)}
                    disabled={joinEventMutation.isPending}
                    data-testid={`button-join-event-${event.id}`}
                  >
                    {event.isPaid && event.price > 0 ? `Join for ₹${event.price}` : "Join Event"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        </div>
          </div>
            </main>
          </SidebarInset>
        </div>
    </SidebarProvider>
  );
}