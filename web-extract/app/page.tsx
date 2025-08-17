import type { FC } from 'react';
import Link from 'next/link';
import { ArrowRight, Play, CheckCircle, Zap, Shield, Globe, Monitor, Users, TrendingUp } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Logo from '@/components/Logo';

const LandingPage: FC = async () => {
  const features = [
    {
      icon: <Monitor className="h-6 w-6 text-slate-700" />,
      title: "Visual Workflow Builder",
      description: "Build powerful data extraction workflows with our intuitive no-code interface."
    },
    {
      icon: <Zap className="h-6 w-6 text-slate-700" />,
      title: "Real-Time Processing",
      description: "Extract and process data in real-time with lightning-fast performance."
    },
    {
      icon: <Shield className="h-6 w-6 text-slate-700" />,
      title: "Enterprise Security",
      description: "Bank-grade security with SOC2 compliance and data encryption."
    },
    {
      icon: <Globe className="h-6 w-6 text-slate-700" />,
      title: "Global Scale",
      description: "Scale globally with distributed infrastructure across multiple regions."
    },
    {
      icon: <Users className="h-6 w-6 text-slate-700" />,
      title: "Team Collaboration",
      description: "Work together seamlessly with built-in collaboration and sharing tools."
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-slate-700" />,
      title: "Advanced Analytics",
      description: "Gain insights with comprehensive analytics and performance monitoring."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div>
          <Logo />
        </div>
        <div className="flex items-center gap-4">
          <SignedOut>
            <Link href="/sign-in">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                Get Started
              </Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 leading-tight mb-6">
            Extract data with{" "}
            <span className="text-purple-600">confidence</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Build reliable web scraping workflows with our visual no-code platform. 
            Extract, transform, and automate data collection from any website at enterprise scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <SignedOut>
              <Link href="/sign-up">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 text-lg">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 text-lg">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </SignedIn>
            <Button variant="outline" size="lg" className="border-slate-300 text-slate-700 px-8 py-3 text-lg">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-slate-50 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 text-slate-600 border-slate-300">
              PROBLEM
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Extracting data requires an understanding of structure and that requires a new approach to scraping.
            </h2>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-left">
                <h3 className="font-semibold text-lg text-slate-900 mb-3">
                  TRADITIONAL SCRAPING IS FRAGILE
                </h3>
                <p className="text-slate-600">
                  Web scrapers break when websites change. Manual maintenance is costly and time-consuming.
                </p>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-lg text-slate-900 mb-3">
                  CHANGES ARE HARD TO TRACK
                </h3>
                <p className="text-slate-600">
                  Without proper monitoring, you won't know when your data extraction fails until it's too late.
                </p>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-lg text-slate-900 mb-3">
                  SCALING IS COMPLEX
                </h3>
                <p className="text-slate-600">
                  Managing proxies, handling rate limits, and processing large datasets requires specialized infrastructure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <Badge variant="outline" className="mb-6 text-slate-600 border-slate-300">
              SOLUTION
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Ensure data extraction works consistently with intelligent automation
            </h2>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-left">
                <div className="bg-slate-100 p-3 rounded-lg w-fit mb-4">
                  <Shield className="h-6 w-6 text-slate-700" />
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-3">
                  RELIABILITY
                </h3>
                <p className="text-slate-600">
                  Smart selectors and fallback mechanisms ensure your workflows keep running even when sites change.
                </p>
              </div>
              <div className="text-left">
                <div className="bg-slate-100 p-3 rounded-lg w-fit mb-4">
                  <Monitor className="h-6 w-6 text-slate-700" />
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-3">
                  VISIBILITY
                </h3>
                <p className="text-slate-600">
                  Real-time monitoring and alerts give you complete visibility into your data extraction processes.
                </p>
              </div>
              <div className="text-left">
                <div className="bg-slate-100 p-3 rounded-lg w-fit mb-4">
                  <Globe className="h-6 w-6 text-slate-700" />
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-3">
                  SCALE
                </h3>
                <p className="text-slate-600">
                  Cloud-native infrastructure automatically handles scaling, proxies, and rate limiting for you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-slate-50 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-6 text-slate-600 border-slate-300">
                FEATURES
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                The only platform built for reliable web scraping
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="border-slate-200 bg-white hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="bg-slate-100 p-3 rounded-lg w-fit mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg text-slate-900">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Start extracting data with confidence
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Join leading companies who trust WebExtract for their critical data extraction needs.
            </p>
            <SignedOut>
              <Link href="/sign-up">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 text-lg">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 text-lg">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <Logo />
              <p className="text-slate-600 mt-2">© 2025 WebExtract. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <Link href="#" className="text-slate-600 hover:text-slate-900">Privacy</Link>
              <Link href="#" className="text-slate-600 hover:text-slate-900">Terms</Link>
              <Link href="#" className="text-slate-600 hover:text-slate-900">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
