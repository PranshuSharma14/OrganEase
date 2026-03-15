"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Hospital, Users, Shield, CheckCircle2, Clock, MapPin, Activity } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatedCounter } from "@/components/AnimatedCounter";

export default function Home() {
  const [stats, setStats] = useState({
    totalDonors: 0,
    livesImpacted: 0,
    activeEmergencies: 0,
  });

  // Simulate loading stats (replace with actual API call)
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
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-blue-600 fill-blue-600" />
            <span className="text-2xl font-bold text-blue-900">OrganEase</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200 backdrop-blur-sm" variant="secondary">
            <Activity className="w-3 h-3 mr-1 animate-pulse" />
            Hospital-Verified Platform
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Save Lives Through
            <span className="text-blue-600"> Verified</span> Living Organ Donation
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Real-time platform connecting donors, recipients, and hospitals. Ethical, legal, and secure.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/auth/signup?role=donor">
              <Button size="lg" className="text-lg">
                <Heart className="mr-2 h-5 w-5" />
                Register as Donor
              </Button>
            </Link>
            <Link href="/auth/signup?role=recipient">
              <Button size="lg" variant="outline" className="text-lg">
                <Users className="mr-2 h-5 w-5" />
                Find a Donor
              </Button>
            </Link>
            <Link href="/auth/signup?role=hospital">
              <Button size="lg" variant="secondary" className="text-lg">
                <Hospital className="mr-2 h-5 w-5" />
                Hospital Login
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Live Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto"
        >
          <motion.div variants={itemVariants}>
            <Card className="border-2 hover:border-blue-300 transition-all hover:shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Donors</p>
                    <p className="text-4xl font-bold text-blue-600">
                      <AnimatedCounter end={stats.totalDonors} />
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-2 hover:border-green-300 transition-all hover:shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Lives Impacted</p>
                    <p className="text-4xl font-bold text-green-600">
                      <AnimatedCounter end={stats.livesImpacted} />
                    </p>
                  </div>
                  <Heart className="h-8 w-8 text-green-400 fill-green-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-2 hover:border-red-300 transition-all hover:shadow-lg bg-white/80 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-red-50/50 animate-pulse"></div>
              <CardContent className="pt-6 relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Active Emergencies</p>
                    <p className="text-4xl font-bold text-red-600">
                      <AnimatedCounter end={stats.activeEmergencies} />
                    </p>
                  </div>
                  <div className="relative">
                    <Activity className="h-8 w-8 text-red-400" />
                    <span className="absolute top-0 right-0 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">How OrganEase Works</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Hospital-first verification ensures ethical, legal, and safe organ donation
          </p>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-4 gap-8"
          >
            {[
              {
                step: "1",
                icon: Users,
                title: "Register & Submit",
                description: "Donors and recipients create profiles with medical documents",
                color: "blue",
              },
              {
                step: "2",
                icon: Hospital,
                title: "Hospital Verification",
                description: "Hospital coordinators verify identity, medical fitness, and need",
                color: "purple",
              },
              {
                step: "3",
                icon: CheckCircle2,
                title: "Smart Matching",
                description: "AI matches based on blood group, organ, location, and priority",
                color: "green",
              },
              {
                step: "4",
                icon: Shield,
                title: "Secure Consent",
                description: "Hospital approves, generates PDF, enables secure chat",
                color: "teal",
              },
            ].map((item) => (
              <motion.div key={item.step} variants={itemVariants}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-full bg-${item.color}-100 flex items-center justify-center mb-4`}>
                      <item.icon className={`h-6 w-6 text-${item.color}-600`} />
                    </div>
                    <Badge className="w-fit mb-2">{item.step}</Badge>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Living Organs Supported */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">Living Organs We Support</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            OrganEase supports ONLY living donations - ethical and legal organ sharing
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {[
              "Kidney",
              "Partial Liver",
              "Bone Marrow",
              "Blood (Whole/Plasma/Platelets)",
              "Partial Lung",
              "Partial Pancreas",
              "Skin",
              "Blood Vessels",
            ].map((organ) => (
              <motion.div
                key={organ}
                whileHover={{ scale: 1.05 }}
                className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <Heart className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium text-gray-700">{organ}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Why Choose OrganEase?</h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          >
            {[
              {
                icon: Shield,
                title: "Hospital-Verified",
                description: "Every donor and recipient is verified by registered hospitals",
              },
              {
                icon: Clock,
                title: "Real-Time Matching",
                description: "Instant matching based on compatibility and emergency priority",
              },
              {
                icon: MapPin,
                title: "Location-Based",
                description: "Find donors and recipients near you for faster procedures",
              },
              {
                icon: CheckCircle2,
                title: "Document Verification",
                description: "Aadhaar and medical certificates verified by hospitals",
              },
              {
                icon: Heart,
                title: "Secure Chat",
                description: "Privacy-protected communication after hospital approval",
              },
              {
                icon: Activity,
                title: "Full Audit Trail",
                description: "Complete transparency with immutable audit logs",
              },
            ].map((feature) => (
              <motion.div key={feature.title} variants={itemVariants}>
                <Card className="h-full">
                  <CardHeader>
                    <feature.icon className="h-10 w-10 text-blue-600 mb-4" />
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Save Lives?</h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Join thousands of verified donors and recipients on India's most trusted organ donation platform
          </p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary" className="text-lg">
              Get Started Now
              <Heart className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-6 w-6 text-blue-400 fill-blue-400" />
                <span className="text-xl font-bold text-white">OrganEase</span>
              </div>
              <p className="text-sm">Hospital-verified living organ donation platform saving lives across India.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Donors</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/auth/signup?role=donor" className="hover:text-white">Register as Donor</Link></li>
                <li><Link href="/about" className="hover:text-white">How It Works</Link></li>
                <li><Link href="/faq" className="hover:text-white">FAQs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Recipients</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/auth/signup?role=recipient" className="hover:text-white">Find a Donor</Link></li>
                <li><Link href="/organs" className="hover:text-white">Supported Organs</Link></li>
                <li><Link href="/emergency" className="hover:text-white">Emergency Cases</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Hospitals</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/auth/signup?role=hospital" className="hover:text-white">Register Hospital</Link></li>
                <li><Link href="/verification" className="hover:text-white">Verification Process</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© 2025 OrganEase. All rights reserved. | Privacy Policy | Terms of Service</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
