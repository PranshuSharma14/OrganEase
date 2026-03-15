"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Hospital, Users, Shield, CheckCircle2, Clock, MapPin, Activity, ArrowRight, Sparkles, Award, TrendingUp, MessageCircle, Lock } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import FloatingParticles from "@/components/FloatingParticles";

export default function Home() {
  const [stats, setStats] = useState({
    totalDonors: 0,
    livesImpacted: 0,
    activeEmergencies: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setStats({
        totalDonors: 1247,
        livesImpacted: 892,
        activeEmergencies: 23,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const features = [
    {
      icon: Shield,
      title: "Hospital Verified",
      description: "All profiles verified by certified medical institutions for maximum safety",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Activity,
      title: "Real-Time Matching",
      description: "Advanced AI-powered algorithms for instant compatible donor-recipient matching",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Lock,
      title: "100% Secure",
      description: "End-to-end encryption and HIPAA-compliant data protection",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Users,
      title: "24/7 Support",
      description: "Dedicated medical coordinators available round the clock",
      color: "from-orange-500 to-red-500",
    },
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Chief Transplant Surgeon",
      hospital: "City General Hospital",
      quote: "OrganEase has revolutionized our organ matching process. The platform's efficiency has saved countless lives.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Living Donor",
      quote: "The verification process gave me complete confidence. I was able to help save a life safely and ethically.",
      rating: 5,
    },
    {
      name: "Priya Sharma",
      role: "Recipient",
      quote: "Within 3 weeks, I found a compatible donor. The platform made everything transparent and stress-free.",
      rating: 5,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <FloatingParticles />
      
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="fixed top-0 left-0 right-0 z-50 glass border-b backdrop-blur-xl"
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <Heart className="h-10 w-10 text-blue-600 fill-blue-600 animate-pulse" />
            <span className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              OrganEase
            </span>
          </motion.div>
          <div className="flex items-center gap-3">
            <Link href="/auth/signin">
              <Button size="sm" variant="ghost" className="text-gray-700 hover:text-blue-600">
                Sign In
              </Button>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <Link href="/onboarding/donor">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Donor
              </Button>
            </Link>
            <Link href="/onboarding/recipient">
              <Button size="sm" variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50">
                Recipient
              </Button>
            </Link>
            <Link href="/onboarding/hospital">
              <Button size="sm" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                Hospital
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 pt-32 pb-20">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center max-w-5xl mx-auto"
        >
          <motion.div variants={itemVariants}>
            <Badge className="mb-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 text-lg shadow-lg animate-glow">
              <Activity className="w-5 h-5 mr-2 animate-pulse" />
              Hospital-Verified Platform
            </Badge>
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-6xl md:text-8xl font-black mb-8 leading-tight"
          >
            Save Lives Through
            <span className="block mt-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
              Verified Organ Donation
            </span>
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-2xl md:text-3xl text-gray-700 mb-12 leading-relaxed"
          >
            Real-time platform connecting donors, recipients, and hospitals.
            <span className="block mt-2 font-semibold text-blue-600">
              Ethical. Legal. Secure.
            </span>
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-6"
          >
            <Link href="/onboarding/donor">
              <Button size="lg" className="text-xl px-10 py-7 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-2xl hover:shadow-blue-500/50 group">
                <Heart className="mr-3 h-6 w-6 group-hover:animate-pulse" />
                Register as Donor
              </Button>
            </Link>
            <Link href="/onboarding/recipient">
              <Button size="lg" variant="outline" className="text-xl px-10 py-7 border-2 border-purple-600 text-purple-600 hover:bg-purple-50 shadow-xl group">
                <Users className="mr-3 h-6 w-6 group-hover:animate-bounce" />
                Find a Donor
              </Button>
            </Link>
            <Link href="/onboarding/hospital">
              <Button size="lg" variant="outline" className="text-xl px-10 py-7 border-2 border-green-600 text-green-600 hover:bg-green-50 shadow-xl group">
                <Hospital className="mr-3 h-6 w-6 group-hover:animate-pulse" />
                Hospital Portal
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Floating Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
        >
          {[
            { label: "Registered Donors", value: stats.totalDonors, icon: Users, color: "blue" },
            { label: "Lives Impacted", value: stats.livesImpacted, icon: Heart, color: "purple" },
            { label: "Active Cases", value: stats.activeEmergencies, icon: Activity, color: "green" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.05, y: -10 }}
              className="glass rounded-2xl p-8 text-center shadow-xl hover:shadow-2xl"
            >
              <stat.icon className={`h-12 w-12 mx-auto mb-4 text-${stat.color}-600`} />
              <h3 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                <AnimatedCounter end={stat.value || 0} duration={2000} />
              </h3>
              <p className="text-gray-700 font-semibold text-lg">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-blue-600 text-white px-6 py-2 text-lg">
              <Sparkles className="w-4 h-4 mr-2" />
              Platform Features
            </Badge>
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              Why Choose <span className="gradient-text-blue">OrganEase</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              State-of-the-art technology meets compassionate care
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
                whileHover={{ y: -10, scale: 1.03 }}
              >
                <Card className="h-full border-2 hover:border-blue-400 shadow-lg hover:shadow-2xl">
                  <CardHeader>
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} p-4 mb-4 shadow-lg`}>
                      <feature.icon className="w-full h-full text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-purple-600 text-white px-6 py-2 text-lg">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Simple Process
            </Badge>
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              How It <span className="gradient-text">Works</span>
            </h2>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Register & Verify",
                description: "Create your profile and upload required documents for hospital verification",
                icon: Shield,
              },
              {
                step: "02",
                title: "AI-Powered Matching",
                description: "Our advanced algorithm finds compatible matches based on medical criteria",
                icon: Activity,
              },
              {
                step: "03",
                title: "Hospital Coordination",
                description: "Verified hospitals coordinate and facilitate the entire donation process",
                icon: Hospital,
              },
              {
                step: "04",
                title: "Save Lives",
                description: "Complete the donation process safely under expert medical supervision",
                icon: Heart,
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
                className="flex items-center gap-8 mb-12"
              >
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl">
                    {step.step}
                  </div>
                </div>
                <Card className="flex-1 border-2 hover:border-blue-400 shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <step.icon className="w-8 h-8 text-blue-600" />
                      <h3 className="text-2xl font-bold">{step.title}</h3>
                    </div>
                    <p className="text-gray-600 text-lg">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="container mx-auto px-4 text-center relative z-10"
        >
          <h2 className="text-5xl md:text-7xl font-black mb-8">
            Ready to Make a Difference?
          </h2>
          <p className="text-2xl md:text-3xl mb-12 opacity-90">
            Join thousands of donors and recipients changing lives every day
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="text-2xl px-12 py-8 bg-white text-blue-600 hover:bg-gray-100 shadow-2xl hover:shadow-white/50">
              Start Your Journey Today
              <ArrowRight className="ml-3 h-7 w-7" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="h-8 w-8 text-blue-500 fill-blue-500" />
            <span className="text-2xl font-bold">OrganEase</span>
          </div>
          <p className="text-gray-400">
            © 2025 OrganEase. Saving lives through verified organ donation.
          </p>
        </div>
      </footer>

      {/* moved css to globals.css to avoid hydration issues */}
    </div>
  );
}
