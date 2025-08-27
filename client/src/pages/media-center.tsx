import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, ExternalLink, Calendar, Eye, Download, Search, Filter, BookOpen, Video, FileText, Image as ImageIcon } from "lucide-react";

interface MediaContent {
  id: string;
  title: string;
  description: string;
  type: "press_release" | "video" | "document" | "image";
  url: string;
  thumbnailUrl?: string;
  publishedDate: string;
  views: number;
  tags: string[];
  featured: boolean;
  author?: string;
}

export default function MediaCenter() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  // This would be managed from admin panel
  const { data: mediaContent = [], isLoading } = useQuery({
    queryKey: ["/api/media-content"],
  });

  const filteredContent = mediaContent.filter((item: MediaContent) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || item.type === selectedType;
    const matchesTag = selectedTag === "all" || item.tags.includes(selectedTag);
    return matchesSearch && matchesType && matchesTag;
  });

  const featuredContent = filteredContent.filter((item: MediaContent) => item.featured);
  const regularContent = filteredContent.filter((item: MediaContent) => !item.featured);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="w-4 h-4" />;
      case "press_release": return <FileText className="w-4 h-4" />;
      case "document": return <BookOpen className="w-4 h-4" />;
      case "image": return <ImageIcon className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "video": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "press_release": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "document": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "image": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const handleContentClick = (content: MediaContent) => {
    // Open video/document in modal or new tab
    if (content.type === "video") {
      window.open(content.url, "_blank");
    } else {
      // For documents and press releases, could open in modal or download
      window.open(content.url, "_blank");
    }
  };

  const ContentCard = ({ content, featured = false }: { content: MediaContent; featured?: boolean }) => (
    <Card 
      className={`group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
        featured ? "border-primary/50 bg-gradient-to-br from-primary/5 to-background" : ""
      }`}
      onClick={() => handleContentClick(content)}
      data-testid={`media-card-${content.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className={`${getTypeColor(content.type)} flex items-center space-x-1`}>
              {getTypeIcon(content.type)}
              <span className="capitalize">{content.type.replace("_", " ")}</span>
            </Badge>
            {featured && (
              <Badge variant="default" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                Featured
              </Badge>
            )}
          </div>
          <div className="flex items-center text-gray-500 text-sm">
            <Eye className="w-4 h-4 mr-1" />
            {content.views.toLocaleString()}
          </div>
        </div>
        <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
          {content.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content.thumbnailUrl && (
          <div className="mb-4 relative overflow-hidden rounded-lg">
            <img 
              src={content.thumbnailUrl} 
              alt={content.title}
              className="w-full h-40 object-cover transition-transform group-hover:scale-105"
            />
            {content.type === "video" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-12 h-12 text-white" />
              </div>
            )}
          </div>
        )}
        <CardDescription className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
          {content.description}
        </CardDescription>
        <div className="flex flex-wrap gap-1 mb-3">
          {content.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {content.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{content.tags.length - 3} more
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{new Date(content.publishedDate).toLocaleDateString()}</span>
          </div>
          {content.author && (
            <span className="text-primary">by {content.author}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Media Center
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Stay updated with latest press releases, videos, and resources for startups and businesses
              </p>
            </div>

            {/* Search and Filters */}
            <div className="mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search articles, videos, documents..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                          data-testid="search-media"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger className="w-40" data-testid="filter-type">
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="video">Videos</SelectItem>
                          <SelectItem value="press_release">Press Releases</SelectItem>
                          <SelectItem value="document">Documents</SelectItem>
                          <SelectItem value="image">Images</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={selectedTag} onValueChange={setSelectedTag}>
                        <SelectTrigger className="w-40" data-testid="filter-tag">
                          <SelectValue placeholder="Filter by tag" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Tags</SelectItem>
                          <SelectItem value="startup">Startup</SelectItem>
                          <SelectItem value="funding">Funding</SelectItem>
                          <SelectItem value="innovation">Innovation</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All Content</TabsTrigger>
                <TabsTrigger value="featured">Featured</TabsTrigger>
                <TabsTrigger value="videos">Videos</TabsTrigger>
                <TabsTrigger value="press">Press Releases</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <Card>
                          <CardHeader>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                          </CardHeader>
                          <CardContent>
                            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Featured Content */}
                    {featuredContent.length > 0 && (
                      <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Featured Content</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                          {featuredContent.slice(0, 2).map((content) => (
                            <ContentCard key={content.id} content={content} featured={true} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Regular Content */}
                    {regularContent.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {regularContent.map((content) => (
                          <ContentCard key={content.id} content={content} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          No content found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Try adjusting your search or filters to find what you're looking for.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="featured" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredContent.map((content) => (
                    <ContentCard key={content.id} content={content} featured={true} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="videos" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredContent
                    .filter((item) => item.type === "video")
                    .map((content) => (
                      <ContentCard key={content.id} content={content} />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="press" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredContent
                    .filter((item) => item.type === "press_release")
                    .map((content) => (
                      <ContentCard key={content.id} content={content} />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="resources" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredContent
                    .filter((item) => item.type === "document" || item.type === "image")
                    .map((content) => (
                      <ContentCard key={content.id} content={content} />
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}