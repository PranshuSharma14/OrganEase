"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Upload, Building2, FileText, Shield } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "next-auth/react";

export default function HospitalOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    // Step 1: Hospital Information
    hospitalName: "",
    registrationNumber: "",
    accreditation: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phoneNumber: "",
    email: "",
    website: "",
    
    // Step 2: Department & Staff
    transplantDepartmentHead: "",
    departmentPhone: "",
    departmentEmail: "",
    numberOfTransplantSurgeons: "",
    transplantCapacity: "",
    specializations: [] as string[],
    
    // Step 3: Documents
    hospitalLicense: null as File | null,
    accreditationCertificate: null as File | null,
    transplantAuthority: null as File | null,
    insuranceDocuments: null as File | null,
  });

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const handleFileChange = (field: string, file: File | null) => {
    updateFormData(field, file);
  };

  const validateStep = () => {
    if (step === 1) {
      const required = ["hospitalName", "registrationNumber", "address", "city", "state", "zipCode", "phoneNumber", "email"];
      
      // Check required fields
      for (const field of required) {
        if (!formData[field as keyof typeof formData]) {
          toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
          return false;
        }
      }
      
      // Validate phone number format
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        toast.error("Please enter a valid phone number");
        return false;
      }
      
      const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        toast.error("Phone number must be at least 10 digits");
        return false;
      }
      
      // Validate email format
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return false;
      }
    } else if (step === 2) {
      if (!formData.hospitalLicense || !formData.accreditationCertificate || !formData.transplantAuthority) {
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
      // In production, upload files to cloud storage first
      const documentUrls = {
        hospitalLicense: formData.hospitalLicense?.name || "",
        accreditationCertificate: formData.accreditationCertificate?.name || "",
        transplantAuthority: formData.transplantAuthority?.name || "",
        insuranceDocuments: formData.insuranceDocuments?.name || "",
      };

      // Ensure a user account exists for this hospital (onboarding can create one)
      let effectiveUserId: string | undefined = undefined;
      try {
        const accountResp = await fetch("/api/auth/create-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            name: formData.hospitalName,
            phone: formData.phoneNumber,
            role: "hospital",
          }),
        });

        if (accountResp.ok) {
          const accountData = await accountResp.json();
          effectiveUserId = accountData.userId;
        } else {
          const err = await accountResp.json();
          console.warn("Create-account failed:", err);
        }
      } catch (e) {
        console.error("create-account request failed", e);
      }

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "hospital",
          userId: effectiveUserId,
          hospitalName: formData.hospitalName,
          registrationNumber: formData.registrationNumber,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          website: formData.website,
          accreditation: formData.accreditation,
          transplantDepartmentHead: formData.transplantDepartmentHead,
          departmentPhone: formData.departmentPhone,
          departmentEmail: formData.departmentEmail,
          numberOfTransplantSurgeons: formData.numberOfTransplantSurgeons,
          transplantCapacity: formData.transplantCapacity,
          specializations: formData.specializations,
          hospitalLicense: formData.hospitalLicense?.name || "",
          accreditationCertificate: formData.accreditationCertificate?.name || "",
        }),
      });

      if (!response.ok) throw new Error("Failed to submit profile");

      // Attempt to sign in the newly created onboarding account so session matches profile
      try {
        await signIn("credentials", {
          email: formData.email.trim().toLowerCase(),
          password: "onboarding-account",
          redirect: false,
        });
      } catch (e) {
        console.warn('Auto sign-in after hospital onboarding failed', e);
      }

      // Send OTP to the provided email for immediate verification step
      try {
        const sendResp = await fetch('/api/hospital/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.email, userId: effectiveUserId }) });
        const sendJson = await sendResp.json().catch(() => ({}));
        if (!sendResp.ok) {
          console.error('send-otp failed:', sendJson);
          toast.error(sendJson?.error || 'Failed to send OTP. Please request verification from dashboard.');
        } else {
          setOtpSent(true);
          toast.success('OTP sent to the hospital email. Please enter it to verify your account.');
        }
      } catch (e) {
        console.error('Failed to send OTP:', e);
        toast.error('Profile submitted but failed to send OTP. Please request verification from dashboard.');
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) { toast.error('Enter OTP'); return; }
    try {
      const res = await fetch('/api/hospital/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.email, otp }) });
      const payload = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('Email verified. Redirecting to dashboard...');
        // close OTP modal and clear OTP
        setOtp("");
        setOtpSent(false);
        // redirect immediately — backend updates verification synchronously in /api/hospital/verify-otp
        try { router.push('/dashboard/hospital'); } catch (e) { window.location.href = '/dashboard/hospital'; }
      } else {
        console.error('verify-otp failed:', payload);
        toast.error(payload?.error || 'Invalid or expired OTP');
      }
    } catch (e) {
      console.error('OTP verify failed', e);
      toast.error('OTP verification failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= s ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  {step > s ? <CheckCircle2 className="h-6 w-6" /> : s}
                </div>
                {s < 2 && (
                  <div className={`w-24 h-1 mx-2 ${
                    step > s ? "bg-blue-600" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-16 mt-3 text-xs font-medium">
            <span className={`text-center w-28 ${step >= 1 ? "text-blue-600" : "text-gray-600"}`}>Hospital Info</span>
            <span className={`text-center w-28 ${step >= 2 ? "text-blue-600" : "text-gray-600"}`}>Verification Docs</span>
          </div>
        </div>

        {/* Step 1: Hospital Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-blue-600" />
                <CardTitle>Hospital Information</CardTitle>
              </div>
              <CardDescription>Provide your hospital's official details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="hospitalName">Hospital Name *</Label>
                  <Input
                    id="hospitalName"
                    value={formData.hospitalName}
                    onChange={(e) => updateFormData("hospitalName", e.target.value)}
                    placeholder="AIIMS Delhi / Apollo Hospital"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number *</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={(e) => updateFormData("registrationNumber", e.target.value)}
                    placeholder="MH/2024/12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accreditation">Accreditation</Label>
                  <Input
                    id="accreditation"
                    value={formData.accreditation}
                    onChange={(e) => updateFormData("accreditation", e.target.value)}
                    placeholder="JCI, NABH, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateFormData("address", e.target.value)}
                  placeholder="123, Ansari Nagar, New Delhi"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => updateFormData("state", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => updateFormData("zipCode", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => updateFormData("phoneNumber", e.target.value)}
                    placeholder="+91 11 2658 8500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Official Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                    placeholder="info@hospital.co.in"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateFormData("website", e.target.value)}
                  placeholder="https://www.hospital.co.in"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNext} size="lg">
                  Next: Department Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2 originally contained department details; removed to simplify onboarding. */}

        {/* Step 3: Documents */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Upload className="h-6 w-6 text-blue-600" />
                <CardTitle>Verification Documents</CardTitle>
              </div>
              <CardDescription>Upload official documents for verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 space-y-2">
                  <Label htmlFor="hospitalLicense" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Hospital Operating License * {formData.hospitalLicense && <Badge variant="secondary">✓ Uploaded</Badge>}
                  </Label>
                  <Input
                    id="hospitalLicense"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange("hospitalLicense", e.target.files?.[0] || null)}
                  />
                  <p className="text-sm text-gray-500">Valid hospital operating license</p>
                </div>

                <div className="border-2 border-dashed rounded-lg p-6 space-y-2">
                  <Label htmlFor="accreditationCertificate" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Accreditation Certificate * {formData.accreditationCertificate && <Badge variant="secondary">✓ Uploaded</Badge>}
                  </Label>
                  <Input
                    id="accreditationCertificate"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange("accreditationCertificate", e.target.files?.[0] || null)}
                  />
                  <p className="text-sm text-gray-500">JCI, NABH, or equivalent accreditation</p>
                </div>

                <div className="border-2 border-dashed rounded-lg p-6 space-y-2">
                  <Label htmlFor="transplantAuthority" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Transplant Authority License * {formData.transplantAuthority && <Badge variant="secondary">✓ Uploaded</Badge>}
                  </Label>
                  <Input
                    id="transplantAuthority"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange("transplantAuthority", e.target.files?.[0] || null)}
                  />
                  <p className="text-sm text-gray-500">Authorization to perform organ transplants</p>
                </div>

                <div className="border-2 border-dashed rounded-lg p-6 space-y-2">
                  <Label htmlFor="insuranceDocuments" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Insurance Documents {formData.insuranceDocuments && <Badge variant="secondary">✓ Uploaded</Badge>}
                  </Label>
                  <Input
                    id="insuranceDocuments"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange("insuranceDocuments", e.target.files?.[0] || null)}
                  />
                  <p className="text-sm text-gray-500">Optional: Malpractice insurance and liability coverage</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Verification Process:</strong> All documents will be reviewed by our admin team. 
                  Verification typically takes 2-5 business days. You'll receive an email once your hospital profile is approved.
                </p>
              </div>

              <div className="flex justify-between">
                <Button onClick={() => setStep(1)} variant="outline">
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? "Submitting..." : "Submit for Verification"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {otpSent && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40">
            <div className="bg-white p-6 rounded shadow-md w-96">
              <h3 className="text-lg font-semibold mb-2">Enter verification code</h3>
              <p className="text-sm text-gray-600 mb-4">We've sent a 6-digit code to {formData.email}. Enter it below to verify your hospital email.</p>
              <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" />
              <div className="flex gap-2 mt-4">
                <Button onClick={handleVerifyOtp} className="flex-1">Verify</Button>
                <Button variant="outline" className="flex-1" onClick={() => setOtpSent(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
