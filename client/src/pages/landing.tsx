import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  TrendingUp, 
  Building2, 
  DollarSign, 
  Shield, 
  Network,
  FileText,
  MessageSquare,
  Briefcase,
  Star
} from "lucide-react";

export default function Landing() {
  const [, navigate] = useLocation();

  const features = [
    {
      icon: TrendingUp,
      title: "Project Funding",
      description: "Connect your innovative projects with investors seeking opportunities"
    },
    {
      icon: Users,
      title: "Investor Network",
      description: "Access a curated network of verified investors and business angels"
    },
    {
      icon: Building2,
      title: "Company Formation",
      description: "8-step guided process to help entrepreneurs establish their companies"
    },
    {
      icon: MessageSquare,
      title: "Community Forums",
      description: "Connect with like-minded entrepreneurs and industry experts"
    },
    {
      icon: Briefcase,
      title: "Job Opportunities",
      description: "Find talent or discover career opportunities in the startup ecosystem"
    },
    {
      icon: FileText,
      title: "Government Tenders",
      description: "Automated tender management with eligibility detection for schemes"
    }
  ];

  const stats = [
    { number: "500+", label: "Active Projects" },
    { number: "1000+", label: "Verified Investors" },
    { number: "₹50Cr+", label: "Funds Raised" },
    { number: "200+", label: "Success Stories" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Network className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Qipad
            </span>
          </div>
          <Button 
            onClick={() => navigate("/auth")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            data-testid="button-header-login"
          >
            Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Energized Startup Space
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Qipad connects entrepreneurs with investors, facilitating project funding, 
            community building, and job opportunities in one comprehensive platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => navigate("/auth")}
              data-testid="button-get-started"
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-4"
              onClick={() => navigate("/auth")}
              data-testid="button-learn-more"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-blue-600">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From project funding to community support, Qipad provides all the tools 
              entrepreneurs and investors need in one platform.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How Qipad Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple steps to get started on your entrepreneurial journey
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Sign Up & Verify</h3>
              <p className="text-gray-600">
                Create your account and complete KYC verification to access all platform features
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Create or Invest</h3>
              <p className="text-gray-600">
                Entrepreneurs create projects, investors browse opportunities and connect
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Grow Together</h3>
              <p className="text-gray-600">
                Access community support, job opportunities, and grow your network
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Join As
            </h2>
            <p className="text-xl text-gray-600">
              Choose your role and start your journey with Qipad
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="border-2 hover:border-blue-500 transition-colors cursor-pointer group">
              <CardHeader className="text-center">
                <div className="p-4 bg-blue-100 rounded-full w-fit mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Business Owner</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base mb-4">
                  Entrepreneurs seeking funding and looking to scale their innovations
                </CardDescription>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Create and showcase projects</li>
                  <li>• Access investor network</li>
                  <li>• Company formation support</li>
                  <li>• Government tender access</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-purple-500 transition-colors cursor-pointer group">
              <CardHeader className="text-center">
                <div className="p-4 bg-purple-100 rounded-full w-fit mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-2xl">Investor</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base mb-4">
                  Investors looking for promising startups and investment opportunities
                </CardDescription>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Browse verified projects</li>
                  <li>• Direct entrepreneur contact</li>
                  <li>• Portfolio management</li>
                  <li>• Investment tracking</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-green-500 transition-colors cursor-pointer group">
              <CardHeader className="text-center">
                <div className="p-4 bg-green-100 rounded-full w-fit mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Individual</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base mb-4">
                  Professionals seeking opportunities and network growth
                </CardDescription>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Job opportunities</li>
                  <li>• Community participation</li>
                  <li>• Networking events</li>
                  <li>• Skill development</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of entrepreneurs and investors who are already 
            building the future together on Qipad.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-4 bg-white text-blue-600 hover:bg-gray-100"
            onClick={() => navigate("/auth")}
            data-testid="button-join-now"
          >
            Join Qipad Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Network className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold">Qipad</span>
            </div>
            <div className="text-center text-gray-400">
              <p>&copy; 2024 Qipad. Energized startup space for entrepreneurs and investors.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}