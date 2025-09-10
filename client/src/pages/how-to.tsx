import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  UserPlus, 
  FileText, 
  Shield, 
  Lightbulb, 
  DollarSign, 
  MessageSquare,
  Briefcase,
  ChevronRight,
  Info,
  AlertTriangle,
  CheckCircle,
  Users,
  Wallet,
  Star,
  ArrowLeft
} from "lucide-react";
import { Link, useLocation } from "wouter";

export default function HowToPage() {
  const [, navigate] = useLocation();
  const workflows = [
    {
      title: "Registration & Account Setup",
      icon: UserPlus,
      color: "bg-blue-50 text-blue-700",
      steps: [
        "Choose your account type: Business Owner, Investor, or Individual",
        "Provide basic information (name, email, password)",
        "Verify your email address",
        "Complete your profile with additional details",
        "Receive 10 QP (Qipad Points) joining bonus"
      ]
    },
    {
      title: "KYC Verification",
      icon: Shield,
      color: "bg-green-50 text-green-700",
      steps: [
        "Navigate to Documents section from the main menu",
        "Upload Personal PAN card for basic verification",
        "For business features: Upload Business PAN, GST Certificate, and Incorporation Certificate",
        "Wait for admin approval (usually 24-48 hours)",
        "Receive notification once KYC is approved"
      ]
    },
    {
      title: "Credits & Wallet Management",
      icon: Wallet,
      color: "bg-purple-50 text-purple-700",
      steps: [
        "Access your wallet from the main navigation",
        "Monitor your QP (Qipad Points) balance",
        "Add credits for platform activities (100 QP = ₹100)",
        "View transaction history and referral earnings (earned only after referrals complete KYC + deposit)",
        "Track spending on innovations and job postings"
      ]
    },
    {
      title: "Creating Innovations (Projects)",
      icon: Lightbulb,
      color: "bg-orange-50 text-orange-700",
      steps: [
        "Ensure KYC verification is complete",
        "Have minimum 100 QP credits in your wallet",
        "Click 'Create Innovation' from Projects section",
        "Fill in project details (name, description, industry)",
        "Set funding goals and minimum investment amounts",
        "Upload project images to showcase your innovation",
        "Submit for review - 100 QP will be deducted upon creation"
      ]
    },
    {
      title: "Investment Opportunities",
      icon: DollarSign,
      color: "bg-emerald-50 text-emerald-700",
      steps: [
        "Browse available innovations in the Projects section",
        "Review project details, funding goals, and business plans",
        "Use 'Invest' for equity-based investments with percentage ownership",
        "Use 'Support' for donation-based contributions",
        "Submit bids with your investment amount and terms",
        "Wait for project owner approval",
        "Track your investment portfolio in your dashboard"
      ]
    },
    {
      title: "Community Participation",
      icon: MessageSquare,
      color: "bg-pink-50 text-pink-700",
      steps: [
        "Join relevant communities based on your interests",
        "Participate in discussions and share insights",
        "Create posts to share knowledge or ask questions",
        "Network with other entrepreneurs and investors",
        "Follow community guidelines and maintain professionalism"
      ]
    },
    {
      title: "Job Opportunities",
      icon: Briefcase,
      color: "bg-indigo-50 text-indigo-700",
      steps: [
        "Post jobs (requires KYC verification and 50 QP)",
        "Browse available job listings",
        "Apply to relevant positions",
        "Manage applications through your dashboard",
        "Connect with potential employers or employees"
      ]
    }
  ];

  const terms = [
    {
      title: "Credit System",
      content: "QP (Qipad Points) are used for platform activities. 1 QP = ₹1. Credits are deducted for posting innovations (100 QP) and jobs (50 QP). Ensure sufficient balance before creating content."
    },
    {
      title: "KYC Verification",
      content: "KYC verification is mandatory for creating innovations, posting jobs, and participating in investment activities. Incomplete KYC will prevent access to these features."
    },
    {
      title: "Investment Terms",
      content: "All investments are subject to risks. Qipad facilitates connections but does not guarantee returns. Users must conduct due diligence before investing."
    },
    {
      title: "Refund & Withdrawal Policy",
      content: "Credits spent on successful submissions (innovations, jobs) are non-refundable. Withdrawal of deposited funds is not available as all deposits are used for platform application fees, processing, and service costs. However, if submission fails due to platform issues, credits will be restored."
    },
    {
      title: "Referral Bonus Requirements",
      content: "Referral bonuses of 50 QP are awarded only after the referred user completes both KYC verification AND makes their first deposit. This policy prevents fake account creation and ensures genuine platform participation."
    },
    {
      title: "Content Guidelines",
      content: "All posted content must be original, legal, and appropriate. Plagiarism, offensive content, or fraudulent activities will result in account suspension."
    },
    {
      title: "Privacy & Data Protection",
      content: "Your personal information is protected according to our privacy policy. KYC documents are securely stored and used only for verification purposes."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">How to Use Qipad</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete guide to navigating Qipad - from registration to successful business networking and investment
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <Badge variant="secondary" className="text-sm">
              <Users className="w-4 h-4 mr-1" />
              For All Users
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <Star className="w-4 h-4 mr-1" />
              Step-by-Step Guide
            </Badge>
          </div>
        </div>

        {/* Quick Overview */}
        <Card className="mb-12 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <Info className="mr-2" />
              Platform Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="p-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-blue-900">For Entrepreneurs</h3>
                <p className="text-sm text-blue-700 mt-2">
                  Create innovations, attract investors, post jobs, and build your startup community
                </p>
              </div>
              <div className="p-4">
                <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-green-900">For Investors</h3>
                <p className="text-sm text-green-700 mt-2">
                  Discover promising startups, make strategic investments, and diversify your portfolio
                </p>
              </div>
              <div className="p-4">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-purple-900">For Everyone</h3>
                <p className="text-sm text-purple-700 mt-2">
                  Network with professionals, join communities, and explore opportunities
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workflows */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Step-by-Step Workflows</h2>
          <div className="grid gap-6">
            {workflows.map((workflow, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className={workflow.color}>
                  <CardTitle className="flex items-center text-lg">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
                      <workflow.icon className="w-5 h-5" />
                    </div>
                    {workflow.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {workflow.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-gray-600">{stepIndex + 1}</span>
                        </div>
                        <p className="text-gray-700 flex-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Important Notes */}
        <Card className="mb-12 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-900">
              <AlertTriangle className="mr-2" />
              Important Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-white/50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900">KYC is Mandatory</h4>
                  <p className="text-amber-800 text-sm mt-1">
                    Complete KYC verification before creating innovations or making investments. This protects all users and ensures platform security.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white/50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900">Credits Required</h4>
                  <p className="text-amber-800 text-sm mt-1">
                    Ensure sufficient QP credits before posting content. Innovation creation costs 100 QP, job posting costs 50 QP.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-white/50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900">Investment Risks</h4>
                  <p className="text-amber-800 text-sm mt-1">
                    All investments carry risks. Conduct thorough research and due diligence before investing in any project.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms and Conditions */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Terms & Conditions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {terms.map((term, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">{term.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm leading-relaxed">{term.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <Card className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="py-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of entrepreneurs and investors building the future together
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link href="/auth">
                <Button size="lg" variant="secondary" className="text-blue-600">
                  Create Account
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/projects">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                  Explore Innovations
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}