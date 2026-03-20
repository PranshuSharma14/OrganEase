"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart, Building2, Users, Shield, CheckCircle2, Clock,
  Activity, ArrowRight, Stethoscope, UserCheck, FileCheck,
  Lock, Zap, ChevronRight, Star,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Heart className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">OrganEase</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
            <a href="#safety" className="hover:text-blue-600 transition-colors">Safety</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/signin">
              <Button variant="ghost" size="sm" className="text-gray-700 font-medium">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50/30" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-green-100/30 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Text */}
            <div className={`space-y-8 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <Badge className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-1.5 text-sm font-medium rounded-full">
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                Hospital-Controlled Platform
              </Badge>

              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight">
                Ethical Organ
                <span className="block text-blue-600 mt-1">Donation Made</span>
                <span className="block text-green-600 mt-1">Simple & Safe</span>
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                A hospital-controlled, AI-assisted platform coordinating
                living organ donations. Verified, ethical, and secure — every step of the way.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/onboarding/donor">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 text-base font-semibold rounded-xl shadow-lg shadow-blue-600/20">
                    <Heart className="mr-2 h-5 w-5" />
                    Register as Donor
                  </Button>
                </Link>
                <Link href="/onboarding/recipient">
                  <Button size="lg" variant="outline" className="border-2 border-gray-300 text-gray-700 px-8 h-12 text-base font-semibold rounded-xl hover:border-blue-300 hover:text-blue-600">
                    Find a Donor
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500 pt-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Same-hospital matching
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  NOTTO compliant
                </div>
              </div>
            </div>

            {/* Right - Stats Cards */}
            <div className={`space-y-5 transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-white shadow-sm border-0 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">1,200+</p>
                    <p className="text-sm text-gray-500 mt-1">Registered Donors</p>
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-0 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3">
                      <Heart className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">890+</p>
                    <p className="text-sm text-gray-500 mt-1">Lives Saved</p>
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-0 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
                      <Building2 className="h-5 w-5 text-indigo-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">45+</p>
                    <p className="text-sm text-gray-500 mt-1">Partner Hospitals</p>
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-0 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
                      <Shield className="h-5 w-5 text-amber-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">100%</p>
                    <p className="text-sm text-gray-500 mt-1">Verified Matches</p>
                  </CardContent>
                </Card>
              </div>

              {/* Trust Bar */}
              <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0 rounded-2xl text-white shadow-xl shadow-blue-600/20">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Lock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">End-to-End Secure</p>
                    <p className="text-blue-100 text-xs mt-0.5">All data encrypted. Hospital-controlled access. HIPAA-grade security.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Role Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">Choose Your Role</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              OrganEase connects all stakeholders in the organ donation process through one secure platform.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Donor",
                desc: "Register as a living organ donor. Your profile is verified by a hospital before any matching begins.",
                icon: Heart,
                color: "blue",
                href: "/onboarding/donor",
                features: ["Hospital-verified profile", "Track your donation journey", "Secure medical data"],
              },
              {
                title: "Recipient",
                desc: "Submit your organ request through a verified hospital. AI-powered matching finds compatible donors.",
                icon: UserCheck,
                color: "green",
                href: "/onboarding/recipient",
                features: ["Priority-based matching", "Real-time status updates", "Hospital-mediated communication"],
              },
              {
                title: "Hospital",
                desc: "Manage your hospital's donor and recipient pools. Verify profiles, run matching, and coordinate procedures.",
                icon: Building2,
                color: "indigo",
                href: "/onboarding/hospital",
                features: ["Admin-verified onboarding", "Same-hospital matching", "Full procedure management"],
              },
            ].map((role) => (
              <Link key={role.title} href={role.href}>
                <Card className="h-full border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 rounded-2xl cursor-pointer group">
                  <CardContent className="p-8">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${
                      role.color === "blue" ? "bg-blue-50" : role.color === "green" ? "bg-green-50" : "bg-indigo-50"
                    }`}>
                      <role.icon className={`h-7 w-7 ${
                        role.color === "blue" ? "text-blue-600" : role.color === "green" ? "text-green-600" : "text-indigo-600"
                      }`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{role.title}</h3>
                    <p className="text-sm text-gray-500 mb-5 leading-relaxed">{role.desc}</p>
                    <ul className="space-y-2.5">
                      {role.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 flex items-center text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
                      Get Started <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-1.5 text-sm font-medium rounded-full mb-4">
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              Platform Features
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900">Built for Trust & Safety</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Every feature designed with ethical organ donation principles at its core.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Shield, title: "Hospital Verified", desc: "All profiles verified by certified medical institutions", color: "blue" },
              { icon: Activity, title: "AI-Powered Matching", desc: "5-factor scoring within same-hospital pools", color: "green" },
              { icon: Lock, title: "Data Privacy", desc: "Encrypted data with role-based access controls", color: "indigo" },
              { icon: Stethoscope, title: "Medical Compliance", desc: "NOTTO-compliant processes and ethical safeguards", color: "amber" },
              { icon: FileCheck, title: "Document Verification", desc: "Secure document upload and hospital review", color: "emerald" },
              { icon: Building2, title: "Hospital Control", desc: "Hospitals manage all matching and procedures", color: "purple" },
              { icon: Clock, title: "Real-Time Tracking", desc: "Track every step from registration to procedure", color: "rose" },
              { icon: UserCheck, title: "Admin Oversight", desc: "Admin verifies hospitals before they can operate", color: "cyan" },
            ].map((feature) => (
              <Card key={feature.title} className="border-0 bg-white shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-${feature.color}-50`}>
                    <feature.icon className={`h-5 w-5 text-${feature.color}-600`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="text-gray-500 mt-3">A simple, transparent process from start to finish</p>
          </div>

          <div className="space-y-0">
            {[
              { step: "01", title: "Register & Choose Hospital", desc: "Create your profile, select a verified hospital, and upload required documents for verification.", icon: UserCheck },
              { step: "02", title: "Hospital Verification", desc: "Your assigned hospital reviews your documents and medical data. Admin-verified hospitals ensure trust.", icon: FileCheck },
              { step: "03", title: "AI-Powered Matching", desc: "Our 5-factor scoring algorithm finds compatible matches within the same hospital pool — blood compatibility, urgency, distance, waiting time, and verification.", icon: Activity },
              { step: "04", title: "Hospital Coordinates Procedure", desc: "The hospital manages all communication, scheduling, and procedure coordination. No direct donor-recipient contact.", icon: Building2 },
            ].map((item, i) => (
              <div key={item.step} className="flex gap-6 group">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-600/20">
                    {item.step}
                  </div>
                  {i < 3 && (
                    <div className="w-0.5 h-full bg-blue-100 my-2 min-h-[40px]" />
                  )}
                </div>
                {/* Content */}
                <div className="pb-10">
                  <div className="flex items-center gap-3 mb-2">
                    <item.icon className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-lg">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section id="safety" className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-green-50 text-green-700 border border-green-200 px-4 py-1.5 text-sm font-medium rounded-full mb-6">
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                Ethical & Legal
              </Badge>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Not a Marketplace.
                <span className="block text-blue-600">A Coordination Platform.</span>
              </h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                OrganEase is NOT an organ marketplace. It's a hospital-controlled platform that assists in coordinating living organ donations. All actions are managed by verified hospitals under regulatory oversight.
              </p>
              <div className="space-y-4">
                {[
                  "No direct donor-recipient interaction",
                  "Hospital controls all matching decisions",
                  "Admin simulates regulatory authority (NOTTO)",
                  "Matching strictly within same hospital",
                  "AI used for risk detection, not matching logic",
                  "Full audit trail of all actions",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {[
                { title: "Hospital Verification", desc: "Admin reviews and verifies each hospital before they can onboard donors or recipients.", icon: Building2, color: "blue" },
                { title: "Document Review", desc: "Hospitals review all medical documents and ID proofs before activating any profile.", icon: FileCheck, color: "green" },
                { title: "AI Risk Detection", desc: "AI analyzes donor-recipient pairs for potential risks and flags concerns for hospital review.", icon: Activity, color: "indigo" },
              ].map((card) => (
                <Card key={card.title} className="border border-gray-200 rounded-2xl shadow-sm">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      card.color === "blue" ? "bg-blue-50" : card.color === "green" ? "bg-green-50" : "bg-indigo-50"
                    }`}>
                      <card.icon className={`h-6 w-6 ${
                        card.color === "blue" ? "text-blue-600" : card.color === "green" ? "text-green-600" : "text-indigo-600"
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
                      <p className="text-sm text-gray-500">{card.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Save Lives?
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
            Join verified hospitals and donors working together to make organ donation safe, ethical, and accessible.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/onboarding/donor">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 h-12 text-base font-semibold rounded-xl">
                <Heart className="mr-2 h-5 w-5" />
                Register as Donor
              </Button>
            </Link>
            <Link href="/onboarding/hospital">
              <Button size="lg" variant="outline" className="border-2 border-white/40 text-white hover:bg-white/10 px-8 h-12 text-base font-semibold rounded-xl">
                <Building2 className="mr-2 h-5 w-5" />
                Hospital Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Heart className="h-4 w-4 text-white fill-white" />
              </div>
              <span className="text-lg font-bold text-white">OrganEase</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <a href="#safety" className="hover:text-white transition-colors">Safety</a>
              <Link href="/auth/signin" className="hover:text-white transition-colors">Sign In</Link>
            </div>
            <p className="text-sm text-gray-500">
              © 2025 OrganEase. Ethical organ donation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
