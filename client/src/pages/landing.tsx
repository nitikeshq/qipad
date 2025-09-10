import { useLocation } from "wouter";
import { useEffect } from "react";
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
  Star,
  CheckCircle,
  Zap,
  Target,
  Rocket,
  Globe,
  Award
} from "lucide-react";

export default function Landing() {
  const [, navigate] = useLocation();

  // SEO optimization
  useEffect(() => {
    document.title = "Qipad - Energized Startup Space | Connect Entrepreneurs with Investors";
    
    // Meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Qipad is India\'s leading platform connecting entrepreneurs with investors. Fund your startup, find investors, access government tenders, and build your business network. Join 1000+ verified investors and 500+ funded projects.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Qipad is India\'s leading platform connecting entrepreneurs with investors. Fund your startup, find investors, access government tenders, and build your business network. Join 1000+ verified investors and 500+ funded projects.';
      document.head.appendChild(meta);
    }

    // Keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', 'startup funding, investors, entrepreneurs, venture capital, angel investors, business funding, startup platform, government tenders, company formation, startup network');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = 'startup funding, investors, entrepreneurs, venture capital, angel investors, business funding, startup platform, government tenders, company formation, startup network';
      document.head.appendChild(meta);
    }

    // Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', 'Qipad - Energized Startup Space | Connect Entrepreneurs with Investors');
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:title');
      meta.content = 'Qipad - Energized Startup Space | Connect Entrepreneurs with Investors';
      document.head.appendChild(meta);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Join India\'s premier startup ecosystem. Connect with verified investors, access funding opportunities, and grow your business with Qipad.');
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:description');
      meta.content = 'Join India\'s premier startup ecosystem. Connect with verified investors, access funding opportunities, and grow your business with Qipad.';
      document.head.appendChild(meta);
    }

    const ogType = document.querySelector('meta[property="og:type"]');
    if (!ogType) {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:type');
      meta.content = 'website';
      document.head.appendChild(meta);
    }

    return () => {
      document.title = 'Qipad';
    };
  }, []);

  const problems = [
    {
      icon: Target,
      title: "Finding the Right Investors",
      problem: "90% of startups fail to connect with suitable investors",
      solution: "Our AI-powered matching connects you with investors interested in your industry"
    },
    {
      icon: Globe,
      title: "Access to Government Schemes",
      problem: "Entrepreneurs miss ₹2000Cr+ in government funding annually",
      solution: "Automated tender management with real-time scheme notifications"
    },
    {
      icon: Network,
      title: "Building Business Networks",
      problem: "Isolation kills 70% of early-stage startups",
      solution: "Join verified communities of 10,000+ entrepreneurs and mentors"
    }
  ];

  const features = [
    {
      icon: TrendingUp,
      title: "Smart Investor Matching",
      description: "AI-powered algorithm matches your startup with investors based on industry, stage, and funding requirements",
      benefit: "3x higher success rate"
    },
    {
      icon: Shield,
      title: "Verified Ecosystem",
      description: "All investors and entrepreneurs go through rigorous KYC verification for trust and security",
      benefit: "100% verified network"
    },
    {
      icon: Zap,
      title: "Instant Funding Access",
      description: "Quick application process with direct investor communication and fast decision making",
      benefit: "Funding in 30 days"
    },
    {
      icon: Building2,
      title: "End-to-End Support",
      description: "From company formation to scaling, get guidance at every step of your entrepreneurial journey",
      benefit: "360° business support"
    },
    {
      icon: Award,
      title: "Government Integration",
      description: "Seamless access to government tenders and schemes with automated eligibility checking",
      benefit: "₹50L+ avg. tender value"
    },
    {
      icon: Rocket,
      title: "Growth Accelerator",
      description: "Access to jobs, partnerships, and community support to accelerate your business growth",
      benefit: "5x faster scaling"
    }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Founder, EcoTech Solutions",
      content: "Qipad helped me secure ₹2.5Cr funding in just 45 days. The investor matching was incredible!",
      funding: "₹2.5Cr raised"
    },
    {
      name: "Rajesh Kumar",
      role: "CEO, FinnovatePay",
      content: "Through Qipad's government tender system, we won contracts worth ₹5Cr. Game changer!",
      funding: "₹5Cr contracts"
    },
    {
      name: "Ananya Gupta",
      role: "Angel Investor",
      content: "I've invested in 8 startups through Qipad. The verification process gives me confidence.",
      funding: "8 investments made"
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
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-300/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-300/20 rounded-full blur-xl"></div>
        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-blue-700 text-sm font-medium mb-8">
            <Zap className="w-4 h-4 mr-2" />
            India's #1 Startup-Investor Platform
          </div>
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
            Where Dreams<br />Meet Capital
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-4xl mx-auto leading-relaxed">
            Stop struggling to find investors. Qipad's AI-powered platform connects verified entrepreneurs 
            with serious investors, handles government schemes, and provides end-to-end business support. 
            <span className="font-semibold text-blue-600">Fund your startup in 30 days, not 3 years.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="text-lg px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
              onClick={() => navigate("/auth")}
              data-testid="button-get-started"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Start Your Journey
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-10 py-5 border-2 border-purple-300 hover:bg-purple-50 transform hover:scale-105 transition-all duration-300"
              onClick={() => navigate("/auth")}
              data-testid="button-learn-more"
            >
              <Users className="w-5 h-5 mr-2" />
              Join as Investor
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              No Setup Fees
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              Verified Network
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              Government Integrated
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-gray-800">Trusted by India's Best</h2>
            <p className="text-gray-600 text-lg">Real numbers from a growing ecosystem</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl transform group-hover:scale-105 transition-transform duration-300"></div>
                <div className="relative p-6 space-y-3">
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-gray-700 font-semibold text-base">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem-Solution Section */}
      <section className="py-24 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 text-gray-800">
              Why Startups <span className="text-red-600">Fail</span> & How We <span className="text-green-600">Fix</span> It
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Traditional startup funding is broken. Here's how Qipad solves the biggest challenges 
              entrepreneurs face when trying to scale their business.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-12">
            {problems.map((item, index) => (
              <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 bg-white">
                <CardHeader className="text-center pb-4">
                  <div className="p-4 bg-gradient-to-r from-red-100 to-orange-100 rounded-full w-fit mx-auto mb-4">
                    <item.icon className="h-8 w-8 text-red-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-800">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
                    <p className="text-red-700 font-semibold text-lg">❌ The Problem</p>
                    <p className="text-red-600 mt-2">{item.problem}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <p className="text-green-700 font-semibold text-lg">✅ Our Solution</p>
                    <p className="text-green-600 mt-2">{item.solution}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-800">
              Why Choose <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Qipad</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stop wasting time with traditional methods. Get everything you need to fund, 
              grow, and scale your startup in one intelligent platform.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 bg-gradient-to-br from-white to-gray-50 group">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700">
                        {feature.benefit}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6 text-gray-800">
              Success Stories That <span className="text-blue-600">Inspire</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real entrepreneurs and investors sharing their journey with Qipad
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 bg-white">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">{testimonial.name.charAt(0)}</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-gray-800">{testimonial.name}</h3>
                    <p className="text-gray-600">{testimonial.role}</p>
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-700">
                      {testimonial.funding}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="flex justify-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <CardDescription className="text-gray-700 text-base italic leading-relaxed">
                    "{testimonial.content}"
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-800">
              Get Funded in <span className="text-blue-600">3 Simple Steps</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stop waiting months for meetings. Our streamlined process gets you connected 
              with investors and funding opportunities faster than ever.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting lines */}
            <div className="hidden md:block absolute top-24 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-blue-300 to-purple-300"></div>
            
            <div className="text-center relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl relative z-10">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-3xl font-bold mb-4 text-gray-800">Sign Up & Verify</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Create your account in 2 minutes and complete our secure KYC verification. 
                Join a trusted network of verified entrepreneurs and investors.
              </p>
              <div className="mt-6 inline-flex items-center text-sm text-green-600 font-semibold">
                <CheckCircle className="w-4 h-4 mr-2" />
                Takes only 5 minutes
              </div>
            </div>
            
            <div className="text-center relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl relative z-10">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-3xl font-bold mb-4 text-gray-800">Create or Invest</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Entrepreneurs: Showcase your project with our smart templates. 
                Investors: Browse AI-matched opportunities in your preferred sectors.
              </p>
              <div className="mt-6 inline-flex items-center text-sm text-blue-600 font-semibold">
                <Zap className="w-4 h-4 mr-2" />
                AI-powered matching
              </div>
            </div>
            
            <div className="text-center relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl relative z-10">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-3xl font-bold mb-4 text-gray-800">Get Funded & Grow</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Connect directly with interested investors, negotiate terms, and access 
                our growth resources including government schemes and community support.
              </p>
              <div className="mt-6 inline-flex items-center text-sm text-purple-600 font-semibold">
                <Rocket className="w-4 h-4 mr-2" />
                Average 30 days to funding
              </div>
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
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-purple-900/30"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-yellow-400/20 rounded-full blur-lg"></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10 text-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              Your Success Story<br />
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Starts Today
              </span>
            </h2>
            <p className="text-xl md:text-2xl mb-12 opacity-90 leading-relaxed">
              Stop dreaming about funding your startup. Join <strong>10,000+ entrepreneurs</strong> and 
              <strong> 1,000+ investors</strong> who are already building the future together on Qipad.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Button 
                size="lg" 
                className="text-xl px-12 py-6 bg-white text-blue-600 hover:bg-gray-100 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 font-bold"
                onClick={() => navigate("/auth")}
                data-testid="button-join-now"
              >
                <Rocket className="w-6 h-6 mr-3" />
                Launch Your Startup
              </Button>
              <Button 
                size="lg" 
                className="text-xl px-12 py-6 bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 transform hover:scale-105 transition-all duration-300 font-bold"
                onClick={() => navigate("/auth")}
                data-testid="button-invest-now"
              >
                <DollarSign className="w-6 h-6 mr-3" />
                Start Investing
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-2xl md:text-3xl font-bold text-yellow-400">₹50Cr+</div>
                <div className="text-white/80">Total Funding Raised</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl md:text-3xl font-bold text-green-400">85%</div>
                <div className="text-white/80">Success Rate</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl md:text-3xl font-bold text-blue-400">30 Days</div>
                <div className="text-white/80">Average Time to Funding</div>
              </div>
            </div>
          </div>
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
              <p className="mt-2">Powered by <a href="https://www.qwegle.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">Qwegle</a></p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}