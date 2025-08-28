import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Image as ImageIcon, Calendar, X, FileImage, 
  Send, MapPin, Clock, Users 
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PostCreatorProps {
  communityId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
  };
  onPostCreated?: () => void;
}

export function LinkedInStylePostCreator({ communityId, user, onPostCreated }: PostCreatorProps) {
  const [postContent, setPostContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("none");
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ["/api/events"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/communities/${communityId}/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to create post");
      }
      
      return response.json();
    },
    onSuccess: () => {
      setPostContent("");
      setSelectedImages([]);
      setSelectedEvent("");
      setIsExpanded(false);
      queryClient.invalidateQueries({ queryKey: ['/api/communities', communityId, 'posts'] });
      onPostCreated?.();
      toast({
        title: "Success",
        description: "Post created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    }
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedImages(prev => [...prev, ...newFiles].slice(0, 4)); // Max 4 images
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!postContent.trim() && selectedImages.length === 0 && !selectedEvent) {
      toast({
        title: "Error",
        description: "Please add some content to your post",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("content", postContent);
    
    if (selectedEvent && selectedEvent !== "none") {
      formData.append("eventId", selectedEvent);
    }

    selectedImages.forEach((file, index) => {
      formData.append(`images`, file);
    });

    createPostMutation.mutate(formData);
  };

  const selectedEventDetails = events.find((e: any) => e.id === selectedEvent);

  return (
    <Card className="w-full max-w-2xl mx-auto mb-6 shadow-sm">
      <CardContent className="p-4">
        <div className="flex space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.profileImage} />
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            {/* Main text input */}
            <Textarea
              placeholder="Share your thoughts with the community..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              className="min-h-[80px] text-sm border-none shadow-none resize-none bg-gray-50 dark:bg-gray-900 rounded-lg px-4 py-3 placeholder:text-gray-500"
              data-testid="textarea-post-content"
            />

            {/* Expanded options */}
            {isExpanded && (
              <div className="space-y-4">
                {/* Selected Event Display */}
                {selectedEvent && selectedEventDetails && (
                  <div className="relative">
                    <Card className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/20">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <Badge variant="secondary" className="text-xs">Sharing Event</Badge>
                            </div>
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                              {selectedEventDetails.title}
                            </h4>
                            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mt-1">
                              <Clock className="h-3 w-3" />
                              {new Date(selectedEventDetails.eventDate).toLocaleDateString()}
                            </div>
                            {selectedEventDetails.venue && (
                              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                <MapPin className="h-3 w-3" />
                                {selectedEventDetails.venue}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEvent("")}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Selected Images Display */}
                {selectedImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-80 group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center space-x-2">
                    {/* Image upload */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      data-testid="button-add-image"
                    >
                      <ImageIcon className="h-4 w-4 mr-1" />
                      Photo
                    </Button>

                    {/* Event selector */}
                    <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                      <SelectTrigger className="w-auto border-none shadow-none text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 h-8">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span className="text-sm">Event</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {events.map((event: any) => (
                          <SelectItem key={event.id} value={event.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{event.title}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(event.eventDate).toLocaleDateString()}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsExpanded(false);
                        setPostContent("");
                        setSelectedImages([]);
                        setSelectedEvent("none");
                      }}
                      data-testid="button-cancel-post"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={createPostMutation.isPending || (!postContent.trim() && selectedImages.length === 0 && selectedEvent === "none")}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      data-testid="button-submit-post"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}