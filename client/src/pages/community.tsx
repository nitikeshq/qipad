import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus, Users, MessageSquare, TrendingUp, Calendar } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function Community() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    isPrivate: false
  });

  // Mock data for demonstration
  const mockCommunities = [
    {
      id: '1',
      name: 'FinTech Entrepreneurs',
      description: 'A community for financial technology entrepreneurs to share insights, challenges, and opportunities.',
      memberCount: 1247,
      postCount: 3856,
      isPrivate: false,
      category: 'Industry',
      recentActivity: '2 hours ago',
      trending: true
    },
    {
      id: '2',
      name: 'Startup Funding',
      description: 'Connect with investors, share funding experiences, and get advice on raising capital.',
      memberCount: 892,
      postCount: 2145,
      isPrivate: false,
      category: 'Funding',
      recentActivity: '5 hours ago',
      trending: true
    },
    {
      id: '3',
      name: 'Women in Business',
      description: 'Empowering women entrepreneurs through networking, mentorship, and shared experiences.',
      memberCount: 654,
      postCount: 1823,
      isPrivate: false,
      category: 'Networking',
      recentActivity: '1 day ago',
      trending: false
    },
    {
      id: '4',
      name: 'Tech Innovators Hub',
      description: 'Latest trends in technology, product development, and innovation strategies.',
      memberCount: 1056,
      postCount: 4201,
      isPrivate: false,
      category: 'Technology',
      recentActivity: '3 hours ago',
      trending: true
    },
    {
      id: '5',
      name: 'Healthcare Startups',
      description: 'Focused on healthcare innovation, regulatory insights, and market opportunities.',
      memberCount: 423,
      postCount: 987,
      isPrivate: false,
      category: 'Industry',
      recentActivity: '6 hours ago',
      trending: false
    },
    {
      id: '6',
      name: 'Angel Investors Circle',
      description: 'Private community for verified angel investors to discuss deals and share due diligence.',
      memberCount: 156,
      postCount: 512,
      isPrivate: true,
      category: 'Investors',
      recentActivity: '4 hours ago',
      trending: false
    }
  ];

  const recentPosts = [
    {
      id: '1',
      author: 'Rajesh Kumar',
      community: 'FinTech Entrepreneurs',
      title: 'Key lessons from scaling our payment platform to 1M users',
      excerpt: 'After two years of building our payment gateway, here are the top 5 technical and business lessons...',
      likes: 47,
      comments: 12,
      timeAgo: '2 hours ago'
    },
    {
      id: '2',
      author: 'Sarah Chen',
      community: 'Startup Funding',
      title: 'Series A pitch deck review - what VCs really want to see',
      excerpt: 'Having just closed our Series A, I wanted to share what worked in our pitch deck and what didn\'t...',
      likes: 89,
      comments: 23,
      timeAgo: '4 hours ago'
    },
    {
      id: '3',
      author: 'Amit Patel',
      community: 'Tech Innovators Hub',
      title: 'AI integration roadmap for traditional businesses',
      excerpt: 'Step-by-step guide on how established companies can integrate AI without disrupting existing operations...',
      likes: 156,
      comments: 34,
      timeAgo: '1 day ago'
    }
  ];

  const filteredCommunities = mockCommunities.filter(community =>
    community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, this would call the API
    console.log('Creating community:', newCommunity);
    setIsCreateModalOpen(false);
    setNewCommunity({ name: '', description: '', isPrivate: false });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {/* Community Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground" data-testid="text-community-title">
                  Communities
                </h1>
                <p className="text-muted-foreground mt-1">
                  Join professional communities to network, learn, and grow your business
                </p>
              </div>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-community">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Community
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="modal-create-community">
                  <DialogHeader>
                    <DialogTitle>Create New Community</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateCommunity} className="space-y-4">
                    <div>
                      <Label htmlFor="community-name">Community Name</Label>
                      <Input
                        id="community-name"
                        value={newCommunity.name}
                        onChange={(e) => setNewCommunity(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter community name"
                        required
                        data-testid="input-community-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="community-description">Description</Label>
                      <Textarea
                        id="community-description"
                        value={newCommunity.description}
                        onChange={(e) => setNewCommunity(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the purpose and focus of your community"
                        rows={3}
                        required
                        data-testid="textarea-community-description"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="private-community"
                        checked={newCommunity.isPrivate}
                        onCheckedChange={(checked) => setNewCommunity(prev => ({ ...prev, isPrivate: checked as boolean }))}
                        data-testid="checkbox-private-community"
                      />
                      <Label htmlFor="private-community" className="text-sm">
                        Make this a private community (invite-only)
                      </Label>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" data-testid="button-submit-community">
                        Create Community
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search communities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-communities"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Communities List */}
            <div className="lg:col-span-2">
              <div className="grid gap-6">
                {filteredCommunities.length > 0 ? (
                  filteredCommunities.map((community) => (
                    <Card key={community.id} className="hover:shadow-lg transition-shadow" data-testid={`card-community-${community.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <CardTitle className="text-lg" data-testid={`text-community-name-${community.id}`}>
                                {community.name}
                              </CardTitle>
                              {community.isPrivate && (
                                <Badge variant="secondary" className="text-xs">Private</Badge>
                              )}
                              {community.trending && (
                                <Badge className="text-xs bg-orange-100 text-orange-800">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Trending
                                </Badge>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs mb-2">
                              {community.category}
                            </Badge>
                            <p className="text-sm text-muted-foreground" data-testid={`text-community-description-${community.id}`}>
                              {community.description}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              <span data-testid={`text-community-members-${community.id}`}>
                                {community.memberCount.toLocaleString()} members
                              </span>
                            </div>
                            <div className="flex items-center">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              <span data-testid={`text-community-posts-${community.id}`}>
                                {community.postCount.toLocaleString()} posts
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>Active {community.recentActivity}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" className="flex-1" data-testid={`button-join-${community.id}`}>
                            {community.isPrivate ? 'Request to Join' : 'Join Community'}
                          </Button>
                          <Button size="sm" variant="outline" data-testid={`button-view-${community.id}`}>
                            View Posts
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground" data-testid="text-no-communities-found">
                      {searchTerm ? 'No communities found matching your search.' : 'No communities available.'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Discussions */}
              <Card data-testid="section-recent-discussions">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Discussions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentPosts.map((post) => (
                    <div key={post.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{post.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate" data-testid={`text-post-title-${post.id}`}>
                            {post.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            by {post.author} in {post.community}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center space-x-3 mt-2 text-xs text-muted-foreground">
                            <span>{post.likes} likes</span>
                            <span>{post.comments} comments</span>
                            <span>{post.timeAgo}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Community Guidelines */}
              <Card data-testid="section-community-guidelines">
                <CardHeader>
                  <CardTitle className="text-lg">Community Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Be professional and respectful</li>
                    <li>• Share valuable insights and experiences</li>
                    <li>• No spam or self-promotion without value</li>
                    <li>• Respect confidentiality in private groups</li>
                    <li>• Help fellow entrepreneurs grow</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Popular Topics */}
              <Card data-testid="section-popular-topics">
                <CardHeader>
                  <CardTitle className="text-lg">Popular Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {['Funding', 'Product Development', 'Marketing', 'Team Building', 'Legal', 'Technology'].map((topic) => (
                      <Badge key={topic} variant="outline" className="text-xs cursor-pointer hover:bg-accent">
                        #{topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
