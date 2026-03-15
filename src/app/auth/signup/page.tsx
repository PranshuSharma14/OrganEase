"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Mail, Users, Hospital, ArrowRight, CheckCircle2, Clock, Shield, Activity, Lock, User, Loader2, Eye, EyeOff, Phone } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialRole = searchParams?.get("role") || "donor";
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const roles = [
    {
      value: "donor",
      label: "Organ Donor",
      shortLabel: "Donor",
      description: "Be a life-saver by registering as an organ donor",
      icon: Heart,
      color: "bg-blue-100 text-blue-600",
      borderColor: "border-blue-600",
      bgColor: "bg-blue-50",
      features: ["Quick registration", "Emergency contact", "Medical verification"]
    },
    {
      value: "recipient",
      label: "Organ Recipient",
      shortLabel: "Recipient",
      description: "Find matching donors for life-saving transplants",
      icon: Users,
      color: "bg-red-100 text-red-600",
      borderColor: "border-red-600",
      bgColor: "bg-red-50",
      features: ["Priority matching", "Real-time updates", "Hospital coordination"]
    },
    {
      value: "hospital",
      label: "Hospital Admin",
      shortLabel: "Hospital",
      description: "Manage and coordinate organ donation programs",
      icon: Hospital,
      color: "bg-purple-100 text-purple-600",
      borderColor: "border-purple-600",
      bgColor: "bg-purple-50",
      features: ["Profile verification", "Match management", "Coordination tools"]
    },
  ];

  const selectedRoleData = roles.find(r => r.value === selectedRole);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const errors: string[] = [];

    // Validate required fields
    if (!formData.name) errors.push("Name is required");
    if (!formData.email) errors.push("Email is required");
    if (!formData.phone) errors.push("Phone number is required");
    if (!formData.password) errors.push("Password is required");
    if (!formData.confirmPassword) errors.push("Please confirm your password");

    // Validate name
    if (formData.name && formData.name.trim().length < 2) {
      errors.push("Name must be at least 2 characters long");
    }
    if (formData.name && formData.name.length > 100) {
      errors.push("Name is too long (max 100 characters)");
    }

    // Validate email format
    if (formData.email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        errors.push("Invalid email format");
      }
      if (formData.email.length > 254) {
        errors.push("Email is too long");
      }
    }

    // Validate phone number
    if (formData.phone) {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(formData.phone)) {
        errors.push("Invalid phone number format");
      }
      if (formData.phone.replace(/\D/g, '').length < 10) {
        errors.push("Phone number must be at least 10 digits");
      }
    }

    // Validate password
    if (formData.password) {
      if (formData.password.length < 8) {
        errors.push("Password must be at least 8 characters long");
      }
      if (formData.password.length > 128) {
        errors.push("Password is too long (max 128 characters)");
      }

      // Validate password complexity
      const hasUpperCase = /[A-Z]/.test(formData.password);
      const hasLowerCase = /[a-z]/.test(formData.password);
      const hasNumber = /[0-9]/.test(formData.password);

      if (!hasUpperCase) errors.push("Password must contain uppercase letter");
      if (!hasLowerCase) errors.push("Password must contain lowercase letter");
      if (!hasNumber) errors.push("Password must contain a number");

      // Check for common weak passwords
      const weakPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password1'];
      if (weakPasswords.some(weak => formData.password.toLowerCase().includes(weak))) {
        errors.push("Password is too common");
      }
    }

    // Check password confirmation
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      errors.push("Passwords do not match");
    }

    // If there are errors, show them all
    if (errors.length > 0) {
      setError(errors.join("; "));
      return false;
    }

    return true;
  };

  const handleCredentialSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Sanitize and prepare data
      const sanitizedData = {
        name: formData.name.trim().replace(/\s+/g, ' '),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone?.trim() || undefined,
        password: formData.password,
        role: selectedRole,
      };

      // Create user account
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sanitizedData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
        setIsLoading(false);
        return;
      }

      // Auto sign in after successful registration
      const result = await signIn("credentials", {
        email: sanitizedData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but failed to sign in. Please sign in manually.");
        setTimeout(() => {
          router.push(`/auth/signin?role=${selectedRole}`);
        }, 2000);
      } else {
        router.push(`/onboarding/${selectedRole}`);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: `/onboarding/${selectedRole}` });
    } catch (err) {
      setError("Failed to sign up with Google");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Heart className="h-16 w-16 text-blue-600 fill-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Join OrganEase</h1>
          <p className="text-lg text-gray-600">Every registration brings hope to someone in need</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Benefits Cards */}
          <Card className="text-center">
            <CardContent className="pt-6">
              <Clock className="h-10 w-10 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Fast Registration</h3>
              <p className="text-sm text-gray-600">Complete setup in under 5 minutes</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Shield className="h-10 w-10 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">100% Secure</h3>
              <p className="text-sm text-gray-600">Medical-grade encryption & privacy</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Activity className="h-10 w-10 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Smart Matching</h3>
              <p className="text-sm text-gray-600">AI-powered compatibility analysis</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Sign Up Card */}
        <Card className="w-full shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Choose Your Role</CardTitle>
            <CardDescription>
              Select how you'd like to participate in organ donation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            {/* Role Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.value;
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value)}
                    className={`p-6 border-2 rounded-xl transition-all text-left cursor-pointer ${
                      isSelected
                        ? `${role.borderColor} ${role.bgColor}`
                        : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                    }`}
                  >
                    <Icon className={`h-10 w-10 mb-3 ${
                      isSelected ? role.color.split(' ')[1] : "text-gray-400"
                    }`} />
                    <h3 className="font-semibold text-gray-900 mb-1">{role.label}</h3>
                    <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                    
                    {isSelected && (
                      <div className="space-y-1 mt-3 pt-3 border-t">
                        {role.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                            <CheckCircle2 className={`h-4 w-4 ${role.color.split(' ')[1]}`} />
                            {feature}
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleCredentialSignUp} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Raj Kumar"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="pl-10"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="yourname@gmail.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10 pr-10"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="pl-10 pr-10"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account as {selectedRoleData?.shortLabel}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              {selectedRole && (
                <p className="text-xs text-center text-gray-600">
                  After signing up, you'll complete your {selectedRoleData?.shortLabel.toLowerCase()} profile
                </p>
              )}
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* OAuth Sign Up Button */}
            <Button 
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
            >
              <Mail className="mr-2 h-5 w-5" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Already registered?</span>
              </div>
            </div>
            
            <Button 
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => window.location.href = `/auth/signin?role=${selectedRole}`}
            >
              Sign In to Existing Account
            </Button>

            <div className="text-center text-xs text-gray-500 mt-4 pt-4 border-t">
              By signing up, you agree to our{" "}
              <a href="#" className="text-blue-600 hover:underline cursor-pointer">Terms of Service</a>
              {" "}and{" "}
              <a href="#" className="text-blue-600 hover:underline cursor-pointer">Privacy Policy</a>
            </div>
          </CardContent>
        </Card>

        {/* Footer Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">1000+</div>
            <div className="text-sm text-gray-600">Registered Donors</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">250+</div>
            <div className="text-sm text-gray-600">Lives Saved</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">50+</div>
            <div className="text-sm text-gray-600">Partner Hospitals</div>
          </div>
        </div>
      </div>
    </div>
  );
}
