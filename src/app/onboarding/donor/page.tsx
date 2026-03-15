"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, Upload, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { ORGAN_TYPES, BLOOD_GROUPS } from "@/lib/constants";
import { signIn } from "next-auth/react";

export default function DonorOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    age: "",
    bloodGroup: "",
    city: "",
    state: "",
    organs: [] as string[],
    emergencyAvailable: false,
    governmentId: "",
    medicalCertificate: "",
    bloodGroupReport: "",
    consentForm: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email and phone
    if (!formData.email || !formData.phone) {
      toast.error("Email and phone are required");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    console.log("=== SUBMITTING DONOR PROFILE ===");
    console.log("Email:", formData.email);
    console.log("Government ID URL length:", formData.governmentId?.length || 0);
    console.log("Medical Certificate URL length:", formData.medicalCertificate?.length || 0);
    console.log("Blood Group Report URL length:", formData.bloodGroupReport?.length || 0);
    console.log("Consent Form URL length:", formData.consentForm?.length || 0);

    try {
      // Create user account with email
      const userResponse = await fetch("/api/auth/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          name: formData.fullName,
          phone: formData.phone,
          role: "donor",
        }),
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        toast.error(errorData.error || "Failed to create account");
        return;
      }

      const userData = await userResponse.json();
      console.log("User created:", userData);

      // Create donor profile
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "donor",
          userId: userData.userId,
          ...formData,
          age: parseInt(formData.age),
        }),
      });

      if (response.ok) {
        toast.success("Profile created successfully!");
        
        // Automatically sign in the user
        await signIn("credentials", {
          email: formData.email.trim().toLowerCase(),
          password: "onboarding-account",
          redirect: false,
        });
        
        // Redirect to dashboard
        router.push("/dashboard/donor");
      } else {
        const errorData = await response.json();
        console.error("Profile creation failed:", errorData);
        toast.error("Failed to create profile");
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      toast.error("An error occurred");
    }
  };

  const toggleOrgan = (organ: string) => {
    setFormData(prev => ({
      ...prev,
      organs: prev.organs.includes(organ)
        ? prev.organs.filter(o => o !== organ)
        : [...prev.organs, organ],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Heart className="h-16 w-16 text-blue-600 fill-blue-600" />
          </div>
          <CardTitle className="text-3xl font-bold">Become a Verified Donor</CardTitle>
          <CardDescription className="text-base mt-2">
            Complete your profile to start saving lives
          </CardDescription>
          
          {/* Progress Steps */}
          <div className="mt-8 space-y-3">
            <div className="flex justify-center items-center gap-3">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      s <= step ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                  {s < 3 && (
                    <div
                      className={`h-1 w-16 mx-1 ${
                        s < step ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-16">
              <p className="text-xs text-gray-600 text-center w-20">Personal Info</p>
              <p className="text-xs text-gray-600 text-center w-20">Organs</p>
              <p className="text-xs text-gray-600 text-center w-20">Documents</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-5">
                <h3 className="font-bold text-xl text-gray-900 mb-4">Personal Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="As per Aadhaar"
                    required
                    className="h-11"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="yourname@gmail.com"
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-sm font-medium">Age *</Label>
                    <Input
                      id="age"
                      type="number"
                      min="18"
                      max="65"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="18-65"
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bloodGroup" className="text-sm font-medium">Blood Group *</Label>
                    <Select
                      value={formData.bloodGroup}
                      onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
                      required
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOOD_GROUPS.map((bg) => (
                          <SelectItem key={bg} value={bg}>
                            {bg}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Your city"
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-medium">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="Your state"
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full h-12 text-base font-semibold mt-6"
                  onClick={() => {
                    // Validation before proceeding
                    if (!formData.fullName || !formData.age || !formData.bloodGroup || !formData.city || !formData.state) {
                      toast.error("Please fill in all required fields");
                      return;
                    }
                    
                    // Validate age range
                    const ageNum = parseInt(formData.age);
                    if (isNaN(ageNum) || ageNum < 18 || ageNum > 65) {
                      toast.error("Age must be between 18 and 65");
                      return;
                    }
                    
                    setStep(2);
                  }}
                >
                  Continue
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Organs You're Willing to Donate</h3>
                <p className="text-sm text-gray-600">
                  Select all that apply. You can update this later.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {ORGAN_TYPES.map((organ) => (
                    <button
                      key={organ.value}
                      type="button"
                      onClick={() => toggleOrgan(organ.value)}
                      className={`p-4 border-2 rounded-lg text-left transition-all cursor-pointer ${
                        formData.organs.includes(organ.value)
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium">{organ.label}</span>
                        {formData.organs.includes(organ.value) && (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 p-4 border rounded-lg">
                  <input
                    type="checkbox"
                    id="emergency"
                    checked={formData.emergencyAvailable}
                    onChange={(e) => setFormData({ ...formData, emergencyAvailable: e.target.checked })}
                    className="h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="emergency" className="text-sm">
                    I'm available for <strong>emergency cases</strong>
                  </label>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 h-12 text-base font-semibold"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 h-12 text-base font-semibold"
                    onClick={() => setStep(3)}
                    disabled={formData.organs.length === 0}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg">Document Upload</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload required documents for verification. All documents are mandatory.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Government ID */}
                  <div className="border-2 border-dashed rounded-lg p-5 hover:border-blue-300 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <Upload className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-1">Government ID (Aadhaar / Passport) *</h4>
                        <p className="text-xs text-gray-500 mb-3">
                          Identity verification to prevent brokers and impersonation. Upload clear photo of your Aadhaar card or Passport.
                        </p>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="cursor-pointer"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error("File size must be less than 5MB");
                                return;
                              }
                              
                              toast.loading("Uploading Government ID...");
                              
                              try {
                                const uploadFormData = new FormData();
                                uploadFormData.append("file", file);
                                
                                const response = await fetch("/api/upload", {
                                  method: "POST",
                                  body: uploadFormData,
                                });
                                
                                if (!response.ok) throw new Error("Upload failed");
                                
                                const data = await response.json();
                                setFormData(prev => ({ ...prev, governmentId: data.url }));
                                toast.dismiss();
                                toast.success(`Government ID uploaded successfully`);
                              } catch (error) {
                                console.error("Upload error:", error);
                                toast.dismiss();
                                toast.error("Failed to upload file");
                              }
                            }
                          }}
                        />
                        {formData.governmentId && (
                          <Badge className="mt-2" variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Uploaded Successfully
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Medical Fitness Certificate */}
                  <div className="border-2 border-dashed rounded-lg p-5 hover:border-blue-300 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="bg-green-100 p-3 rounded-full">
                        <Upload className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-1">Medical Fitness Certificate *</h4>
                        <p className="text-xs text-gray-500 mb-3">
                          Must be issued by a registered hospital or doctor, clearly stating that you are medically fit and the organ intended for donation is healthy.
                        </p>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="cursor-pointer"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error("File size must be less than 5MB");
                                return;
                              }
                              
                              toast.loading("Uploading Medical Certificate...");
                              
                              try {
                                const uploadFormData = new FormData();
                                uploadFormData.append("file", file);
                                
                                const response = await fetch("/api/upload", {
                                  method: "POST",
                                  body: uploadFormData,
                                });
                                
                                if (!response.ok) throw new Error("Upload failed");
                                
                                const data = await response.json();
                                setFormData(prev => ({ ...prev, medicalCertificate: data.url }));
                                toast.dismiss();
                                toast.success(`Medical Certificate uploaded successfully`);
                              } catch (error) {
                                console.error("Upload error:", error);
                                toast.dismiss();
                                toast.error("Failed to upload file");
                              }
                            }
                          }}
                        />
                        {formData.medicalCertificate && (
                          <Badge className="mt-2" variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Uploaded Successfully
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Blood Group & Compatibility Reports */}
                  <div className="border-2 border-dashed rounded-lg p-5 hover:border-blue-300 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="bg-red-100 p-3 rounded-full">
                        <Upload className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-1">Blood Group & Compatibility Reports *</h4>
                        <p className="text-xs text-gray-500 mb-3">
                          Blood group proof and basic organ health reports to verify compatibility with recipients.
                        </p>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="cursor-pointer"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error("File size must be less than 5MB");
                                return;
                              }
                              
                              toast.loading("Uploading Blood Group Report...");
                              
                              try {
                                const uploadFormData = new FormData();
                                uploadFormData.append("file", file);
                                
                                const response = await fetch("/api/upload", {
                                  method: "POST",
                                  body: uploadFormData,
                                });
                                
                                if (!response.ok) throw new Error("Upload failed");
                                
                                const data = await response.json();
                                setFormData(prev => ({ ...prev, bloodGroupReport: data.url }));
                                toast.dismiss();
                                toast.success(`Blood Group Report uploaded successfully`);
                              } catch (error) {
                                console.error("Upload error:", error);
                                toast.dismiss();
                                toast.error("Failed to upload file");
                              }
                            }
                          }}
                        />
                        {formData.bloodGroupReport && (
                          <Badge className="mt-2" variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Uploaded Successfully
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Consent Declaration */}
                  <div className="border-2 border-dashed rounded-lg p-5 hover:border-blue-300 transition-colors bg-yellow-50">
                    <div className="flex items-start gap-4">
                      <div className="bg-yellow-100 p-3 rounded-full">
                        <Upload className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-1">🔴 Consent Declaration (Signed) *</h4>
                        <p className="text-xs text-gray-500 mb-2">
                          <strong>MOST IMPORTANT:</strong> Download the OrganEase consent form, print it, sign it, and upload the signed copy. This declares "I am donating voluntarily" and is legally required.
                        </p>
                        <div className="mb-3 space-y-2">
                          <a 
                            href="/consent-form-template.html" 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline text-sm font-medium inline-flex items-center gap-1 mr-4"
                          >
                            📄 View/Download Consent Form
                          </a>
                          <p className="text-xs text-gray-600 italic">
                            Tip: Open the form, press Ctrl+P, and save as PDF to print it.
                          </p>
                        </div>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="cursor-pointer"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error("File size must be less than 5MB");
                                return;
                              }
                              
                              toast.loading("Uploading Signed Consent Form...");
                              
                              try {
                                const uploadFormData = new FormData();
                                uploadFormData.append("file", file);
                                
                                const response = await fetch("/api/upload", {
                                  method: "POST",
                                  body: uploadFormData,
                                });
                                
                                if (!response.ok) throw new Error("Upload failed");
                                
                                const data = await response.json();
                                setFormData(prev => ({ ...prev, consentForm: data.url }));
                                toast.dismiss();
                                toast.success(`Signed Consent Form uploaded successfully`);
                              } catch (error) {
                                console.error("Upload error:", error);
                                toast.dismiss();
                                toast.error("Failed to upload file");
                              }
                            }
                          }}
                        />
                        {formData.consentForm && (
                          <Badge className="mt-2" variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Uploaded Successfully
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">📋 What happens next?</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>✓ Hospital will verify your documents (2-3 business days)</li>
                    <li>✓ You'll be notified via email and dashboard</li>
                    <li>✓ Once verified, you'll be visible to compatible recipients</li>
                    <li>✓ Hospital will coordinate all matches and procedures</li>
                  </ul>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1 h-12 text-base font-semibold"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 text-base font-semibold"
                    disabled={!formData.governmentId || !formData.medicalCertificate || !formData.bloodGroupReport || !formData.consentForm}
                  >
                    Complete Registration
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
