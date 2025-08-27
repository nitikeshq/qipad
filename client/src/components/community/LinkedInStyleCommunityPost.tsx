import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, MessageCircle, Share2, Send, Image as ImageIcon, 
  Calendar, MapPin, Clock, Users, ExternalLink 
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CommunityPostProps {
  post: {
    id: string;
    content: string;
    authorName: string;
    authorEmail: string;
    authorAvatar?: string;
    createdAt: string;
    likesCount: number;
    commentsCount: number;
    isLiked: boolean;
    images?: string[];
    eventId?: string;
    eventTitle?: string;
    eventDate?: string;
    eventDescription?: string;
    eventType?: string;
    venue?: string;
    onlineUrl?: string;
  };
  communityId: string;
}

export function LinkedInStyleCommunityPost({ post, communityId }: CommunityPostProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const likePostMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/community-posts/${post.id}/like`),
    onSuccess: (response) => {
      setIsLiked(response.liked);
      setLikesCount(prev => response.liked ? prev + 1 : prev - 1);
      queryClient.invalidateQueries({ queryKey: ['/api/communities', communityId, 'posts'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
        variant: "destructive",
      });
    }
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => 
      apiRequest("POST", `/api/community-posts/${post.id}/comments`, { content }),
    onSuccess: () => {
      setNewComment("");
      setShowComments(true);
      queryClient.invalidateQueries({ queryKey: ['/api/communities', communityId, 'posts'] });
      toast({
        title: "Success",
        description: "Comment added successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleLike = () => {
    likePostMutation.mutate();
  };

  const handleComment = () => {
    if (newComment.trim()) {
      commentMutation.mutate(newComment.trim());
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "Post link copied to clipboard!",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mb-4 hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        {/* Post Header */}
        <div className="p-4 pb-2">
          <div className="flex items-start space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={post.authorAvatar} />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {post.authorName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                  {post.authorName}
                </h3>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {post.authorEmail}
              </p>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="px-4 pb-3">
          <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* Shared Event */}
        {post.eventId && post.eventTitle && (
          <div className="mx-4 mb-3">
            <Card className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/20">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <Badge variant="secondary" className="text-xs">Event</Badge>
                    </div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                      {post.eventTitle}
                    </h4>
                    {post.eventDate && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <Clock className="h-3 w-3" />
                        {new Date(post.eventDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                    {post.venue && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <MapPin className="h-3 w-3" />
                        {post.venue}
                      </div>
                    )}
                    {post.eventDescription && (
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                        {post.eventDescription}
                      </p>
                    )}
                  </div>
                  {post.onlineUrl && (
                    <Button size="sm" variant="outline" className="ml-2" asChild>
                      <a href={post.onlineUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Post Images */}
        {post.images && post.images.length > 0 && (
          <div className="px-4 mb-3">
            <div className={`grid gap-2 ${
              post.images.length === 1 ? 'grid-cols-1' : 
              post.images.length === 2 ? 'grid-cols-2' :
              post.images.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
            }`}>
              {post.images.map((imageUrl, index) => (
                <div 
                  key={index}
                  className={`relative overflow-hidden rounded-lg border ${
                    post.images!.length === 3 && index === 2 ? 'col-span-1' : ''
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={`Post image ${index + 1}`}
                    className="w-full h-48 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => window.open(imageUrl, '_blank')}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Engagement Stats */}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              {likesCount > 0 && (
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                  {likesCount}
                </span>
              )}
              {post.commentsCount > 0 && (
                <span>{post.commentsCount} comment{post.commentsCount !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-around">
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 ${
                isLiked ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'
              }`}
              onClick={handleLike}
              disabled={likePostMutation.isPending}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">Like</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Comment</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              <span className="text-sm font-medium">Share</span>
            </Button>
          </div>
        </div>

        {/* Comment Section */}
        {showComments && (
          <div className="border-t border-gray-100 dark:border-gray-800 p-4">
            <div className="flex space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                  You
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px] text-sm resize-none border-gray-200 dark:border-gray-700"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleComment();
                    }
                  }}
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleComment}
                    disabled={!newComment.trim() || commentMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}