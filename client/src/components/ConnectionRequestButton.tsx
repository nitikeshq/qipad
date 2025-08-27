import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { MessageCircle, UserPlus, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ConnectionRequestButtonProps {
  projectOwnerId: string;
  projectId: string;
  projectTitle: string;
}

export function ConnectionRequestButton({ 
  projectOwnerId, 
  projectId, 
  projectTitle 
}: ConnectionRequestButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is the project owner
  if (user?.id === projectOwnerId) {
    return null; // Don't show connection button to project owner
  }

  // Get existing connections to check status
  const { data: connections = [] } = useQuery<any[]>({
    queryKey: ['/api/connections'],
  });

  const existingConnection = connections.find(
    conn => 
      (conn.requesterId === user?.id && conn.recipientId === projectOwnerId) ||
      (conn.requesterId === projectOwnerId && conn.recipientId === user?.id)
  );

  const connectionMutation = useMutation({
    mutationFn: async (data: { recipientId: string; projectId: string; message: string }) => {
      const response = await apiRequest("POST", "/api/connections", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Connection request sent successfully!" });
      setIsOpen(false);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to send connection request", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleSendRequest = () => {
    if (!user) return;
    
    connectionMutation.mutate({
      recipientId: projectOwnerId,
      projectId,
      message: message || `I'm interested in connecting about your project: ${projectTitle}`
    });
  };

  // If connection already exists, show status
  if (existingConnection) {
    if (existingConnection.status === 'accepted') {
      return (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">Connected</span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            You can now view contact details
          </p>
        </div>
      );
    } else if (existingConnection.status === 'pending') {
      return (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">Connection Pending</span>
          </div>
          <p className="text-xs text-yellow-600 mt-1">
            Waiting for owner response
          </p>
        </div>
      );
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          variant="outline"
          className="w-full mt-3"
          data-testid="button-request-connection"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Request Connection
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Connection</DialogTitle>
          <DialogDescription>
            Send a connection request to the project owner to access their contact details.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder={`I'm interested in connecting about your project: ${projectTitle}`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1"
              data-testid="textarea-connection-message"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            data-testid="button-cancel-connection"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSendRequest}
            disabled={connectionMutation.isPending}
            data-testid="button-send-connection-request"
          >
            {connectionMutation.isPending ? "Sending..." : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}