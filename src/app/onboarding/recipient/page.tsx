"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ORGAN_TYPES, BLOOD_GROUPS, URGENCY_LEVELS } from "@/lib/constants";
import { CheckCircle2, Upload, User, FileText, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function RecipientOnboarding() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    fullName: string;
    email: string;
    dateOfBirth: string;
    phoneNumber: string;
    city: string;
    state: string;
    bloodGroup: string;
    hospitalCode: string;
    organNeeded: string;
    urgencyLevel: string;
    medicalReports: string;
    doctorReferral: string;
    insuranceCard: string;
    governmentId: string;
  }>({
    // Step 1: Personal Information
    fullName: "",
    email: "",
    dateOfBirth: "",
    phoneNumber: "",
    city: "",
    state: "",
    bloodGroup: "",
    hospitalCode: "",
    
    // Step 2: Medical Information
    organNeeded: "",
    urgencyLevel: "",
    
    // Step 3: Documents (store as URLs)
    medicalReports: "",
    doctorReferral: "",
    insuranceCard: "",
    governmentId: "",
  });

  const [hospitalInfo, setHospitalInfo] = useState<{ hospitalName: string; city: string; state: string } | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (field: string, file: File | null) => {
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }
    
    toast.loading(`Uploading ${field}...`);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) throw new Error("Upload failed");
      
      const data = await response.json();
      console.log(`${field} uploaded to Cloudinary:`, data.url);
      
      updateFormData(field, data.url);
      toast.dismiss();
      toast.success("Document uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.dismiss();
      toast.error("Failed to upload file");
    }
  };

  const validateHospitalCode = async (code: string) => {
    if (!code) return;
    setValidatingCode(true);
    setHospitalInfo(null);
    try {
      const res = await fetch(`/api/hospital/verifications?validateCode=${encodeURIComponent(code.toUpperCase().trim())}`);
      const data = await res.json();
      if (data.valid) {
        setHospitalInfo({ hospitalName: data.hospitalName, city: data.city, state: data.state });
      } else {
        setHospitalInfo(null);
      }
    } catch {
      setHospitalInfo(null);
    } finally {
      setValidatingCode(false);
    }
  };

  const validateStep = () => {
    if (step === 1) {
      const required = ["fullName", "email", "dateOfBirth", "phoneNumber", "city", "state", "bloodGroup", "hospitalCode"];
      
      // Check required fields
      for (const field of required) {
        if (!formData[field as keyof typeof formData]) {
          toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
          return false;
        }
      }

      // Validate hospital code
      if (!hospitalInfo) {
        toast.error("Please enter a valid hospital code and wait for it to be verified");
        return false;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return false;
      }
      
      // Validate phone number format
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        toast.error("Please enter a valid phone number");
        return false;
      }
      
      // Validate phone number length (min 10 digits)
      const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        toast.error("Phone number must be at least 10 digits");
        return false;
      }
    } else if (step === 2) {
      const required = ["organNeeded", "urgencyLevel"];
      
      for (const field of required) {
        if (!formData[field as keyof typeof formData]) {
          toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
          return false;
        }
      }
    } else if (step === 3) {
      if (!formData.medicalReports || !formData.doctorReferral || !formData.governmentId) {
        toast.error("Please upload all required documents");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    

    
    try {
      let userId: string | undefined;

      if (session?.user?.id) {
        // OAuth user — use session ID
        userId = session.user.id as string;
        await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updateRole: "recipient" }),
        }).catch(() => {});
      } else {
        // Create account
        const userResponse = await fetch("/api/auth/create-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email.trim().toLowerCase(), name: formData.fullName, phone: formData.phoneNumber, role: "recipient" }),
        });

        if (!userResponse.ok) {
          const err = await userResponse.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to create account');
        }

        const userData = await userResponse.json();
        userId = userData.userId;
      }

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            role: "recipient",
            userId,
            ...formData,
            email: session?.user?.email || formData.email,
            verificationStatus: "pending",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit profile");
      }

      toast.success("Profile submitted successfully!");
      router.push("/auth/redirect");
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= s ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  {step > s ? <CheckCircle2 className="h-6 w-6" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-24 h-1 mx-2 ${
                    step > s ? "bg-blue-600" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-20 mt-3 text-xs font-medium">
            <span className={`text-center w-24 ${step >= 1 ? "text-blue-600" : "text-gray-600"}`}>Personal Info</span>
            <span className={`text-center w-24 ${step >= 2 ? "text-blue-600" : "text-gray-600"}`}>Medical Info</span>
            <span className={`text-center w-24 ${step >= 3 ? "text-blue-600" : "text-gray-600"}`}>Documents</span>
          </div>
        </div>

        {/* Step 1: Personal Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-6 w-6 text-red-600" />
                <CardTitle>Personal Information</CardTitle>
              </div>
              <CardDescription>Tell us about yourself and your emergency contact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => updateFormData("fullName", e.target.value)}
                    placeholder="Raj Kumar"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                    placeholder="yourname@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => updateFormData("phoneNumber", e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group *</Label>
                  <Select value={formData.bloodGroup} onValueChange={(val) => updateFormData("bloodGroup", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_GROUPS.map((group) => (
                        <SelectItem key={group} value={group}>{group}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData("city", e.target.value)}
                    placeholder="Mumbai"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => updateFormData("state", e.target.value)}
                    placeholder="Maharashtra"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospitalCode">Hospital Code *</Label>
                <div className="flex gap-2">
                  <Input
                    id="hospitalCode"
                    value={formData.hospitalCode}
                    onChange={(e) => {
                      updateFormData("hospitalCode", e.target.value.toUpperCase());
                      setHospitalInfo(null);
                    }}
                    onBlur={(e) => validateHospitalCode(e.target.value)}
                    placeholder="HOSP-XXXXXX"
                    className="uppercase"
                  />
                  {validatingCode && <span className="text-sm text-gray-500 self-center">Checking…</span>}
                </div>
                {hospitalInfo && (
                  <p className="text-sm text-green-700 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    {hospitalInfo.hospitalName} — {hospitalInfo.city}, {hospitalInfo.state}
                  </p>
                )}
                {formData.hospitalCode && !hospitalInfo && !validatingCode && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Invalid hospital code. Please check with your hospital.
                  </p>
                )}
                <p className="text-xs text-gray-500">Enter the unique code provided by your hospital (e.g. HOSP-AB1234)</p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNext} size="lg">
                  Next: Medical Information
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Medical Information */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-red-600" />
                <CardTitle>Medical Information</CardTitle>
              </div>
              <CardDescription>Provide details about your medical needs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organNeeded">Organ Needed *</Label>
                  <Select value={formData.organNeeded} onValueChange={(val) => updateFormData("organNeeded", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organ" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORGAN_TYPES.map((organ) => (
                        <SelectItem key={organ.value} value={organ.value}>{organ.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urgencyLevel">Urgency Level *</Label>
                  <Select value={formData.urgencyLevel} onValueChange={(val) => updateFormData("urgencyLevel", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      {URGENCY_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          <Badge variant={level === "critical" ? "destructive" : level === "high" ? "default" : "secondary"}>
                            {level.toUpperCase()}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between">
                <Button onClick={() => setStep(1)} variant="outline">
                  Back
                </Button>
                <Button onClick={handleNext}>
                  Next: Upload Documents
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Documents */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Upload className="h-6 w-6 text-red-600" />
                <CardTitle>Upload Documents</CardTitle>
              </div>
              <CardDescription>Upload required medical and identification documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 space-y-2">
                  <Label htmlFor="doctorReferral" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-5 w-5 text-red-600" />
                    Doctor's Referral Letter * {formData.doctorReferral && <Badge variant="secondary">✓ Uploaded</Badge>}
                  </Label>
                  <Input
                    id="doctorReferral"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange("doctorReferral", e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-gray-500 leading-relaxed">
                    <span className="font-semibold text-red-600">🔴 MOST IMPORTANT:</span> Must include diagnosis, organ required, urgency level, and be issued by a registered hospital/doctor
                  </p>
                </div>

                <div className="border-2 border-dashed rounded-lg p-6 space-y-2">
                  <Label htmlFor="medicalReports" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-5 w-5 text-red-600" />
                    Medical Reports * {formData.medicalReports && <Badge variant="secondary">✓ Uploaded</Badge>}
                  </Label>
                  <Input
                    id="medicalReports"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange("medicalReports", e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Recent test results, organ failure proof, and blood group reports to verify your medical condition
                  </p>
                </div>

                <div className="border-2 border-dashed rounded-lg p-6 space-y-2">
                  <Label htmlFor="governmentId" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-5 w-5 text-red-600" />
                    Government ID (Aadhaar/Passport) * {formData.governmentId && <Badge variant="secondary">✓ Uploaded</Badge>}
                  </Label>
                  <Input
                    id="governmentId"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange("governmentId", e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Identity verification to prevent fake cases and ensure authenticity of your request
                  </p>
                </div>

                <div className="border-2 border-dashed rounded-lg p-6 space-y-2">
                  <Label htmlFor="insuranceCard" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-5 w-5 text-gray-600" />
                    Insurance Card (Optional) {formData.insuranceCard && <Badge variant="secondary">✓ Uploaded</Badge>}
                  </Label>
                  <Input
                    id="insuranceCard"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange("insuranceCard", e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Optional: Upload your health insurance card (front and back) for hospital coordination
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> All documents will be securely stored and reviewed by hospital staff. 
                  You'll receive a notification once your profile is verified.
                </p>
              </div>

              <div className="flex justify-between">
                <Button onClick={() => setStep(2)} variant="outline">
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? "Submitting..." : "Submit Profile"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
