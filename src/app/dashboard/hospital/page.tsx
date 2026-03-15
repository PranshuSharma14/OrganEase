"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Building2,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Heart,
  FileText,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  Activity,
  Calendar,
  Eye,
  Download,
  Shield,
  Edit,
  Trash2,
  LogOut,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { signOut } from "next-auth/react";

export default function HospitalDashboard() {
  const [hospitalProfile, setHospitalProfile] = useState<any>(null);
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [activeMatches, setActiveMatches] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalVerified: 0,
    pendingReview: 0,
    activeMatches: 0,
    completedProcedures: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<string>("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [matchDetailsDialog, setMatchDetailsDialog] = useState(false);
  const [approvingMatch, setApprovingMatch] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [schedulingMatch, setSchedulingMatch] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleType, setScheduleType] = useState<"test" | "procedure">("test");
  const [currentMatch, setCurrentMatch] = useState<any>(null);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  const viewDocument = async (url: string, filename: string) => {
    if (!url) {
      toast.error("Document not available");
      return;
    }

    console.log("Opening document:", filename, url);

    // For Cloudinary URLs, fetch and create blob for proper PDF viewing
    if (url.includes('cloudinary.com')) {
      try {
        toast.info("Loading document...");
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch document');
        }
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const newWindow = window.open(blobUrl, '_blank');
        if (!newWindow) {
          toast.error("Please allow popups to view documents");
        } else {
          toast.success("Document opened");
        }
        
        // Clean up after 2 minutes
        setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
      } catch (error) {
        console.error("Error opening document:", error);
        toast.error("Failed to open document. Trying direct link...");
        window.open(url, '_blank');
      }
      return;
    }

    // Check if it's a base64 data URL
    if (url.startsWith('data:')) {
      // For base64, create a blob and open it
      try {
        const base64Data = url.split(',')[1];
        const mimeType = url.split(':')[1].split(';')[0];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        
        const newWindow = window.open(blobUrl, '_blank');
        if (!newWindow) {
          toast.error("Please allow popups to view documents");
        }
        
        // Clean up after 1 minute
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      } catch (error) {
        console.error("Error opening document:", error);
        toast.error("Failed to open document");
      }
    } else {
      // For regular URLs
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        toast.error("Please allow popups to view documents");
      }
    }
  };

  const downloadDocument = async (url: string, filename: string) => {
    if (!url) {
      toast.error("Document not available");
      return;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      
      toast.success("Document downloaded");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  function openEditDialog() {
    setEditForm({
      contactEmail: hospitalProfile?.coordinatorEmail || hospitalProfile?.email || "",
      contactPhone: hospitalProfile?.contactNumber || hospitalProfile?.phoneNumber || "",
      address: hospitalProfile?.address || "",
      city: hospitalProfile?.city || "",
      state: hospitalProfile?.state || "",
      pincode: hospitalProfile?.pincode || "",
    });
    setIsEditDialogOpen(true);
  }

  async function handleEditSubmit() {
    try {
      const response = await fetch("/api/profile/edit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        toast.success("Profile updated successfully");
        setIsEditDialogOpen(false);
        fetchDashboardData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  }

  async function handleDeleteProfile() {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/profile/delete", {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Profile deleted successfully");
        await signOut({ callbackUrl: "/auth/signin" });
      } else {
        throw new Error("Failed to delete profile");
      }
    } catch (error) {
      console.error("Error deleting profile:", error);
      toast.error("Failed to delete profile");
    } finally {
      setIsDeleting(false);
    }
  }

  async function loadMatchDetails(matchId: string) {
    try {
      const response = await fetch(`/api/hospital/approve-match?matchId=${matchId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedMatch(data.match);
        setMatchDetailsDialog(true);
      } else {
        toast.error("Failed to load match details");
      }
    } catch (error) {
      toast.error("Failed to load match details");
    }
  }

  async function handleApproveMatch(matchId: string, approved: boolean) {
    setApprovingMatch(matchId);
    try {
      const response = await fetch("/api/hospital/approve-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          approved,
          notes: approvalNotes,
        }),
      });

      if (response.ok) {
        toast.success(approved ? "Match approved successfully!" : "Match rejected");
        setMatchDetailsDialog(false);
        setApprovalNotes("");
        fetchDashboardData();
        // Trigger refresh on donor/recipient dashboards via localStorage event
        localStorage.setItem('organease-refresh', Date.now().toString());
        // Also trigger custom event for same-tab updates
        window.dispatchEvent(new CustomEvent('organease-refresh'));
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update match");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setApprovingMatch(null);
    }
  }

  async function handleSchedule(matchId: string) {
    setSchedulingMatch(matchId);
    try {
      const response = await fetch("/api/matches/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          type: scheduleType,
          date: scheduleDate,
        }),
      });

      if (response.ok) {
        toast.success(`${scheduleType === "test" ? "Test" : "Procedure"} scheduled successfully!`);
        setScheduleDate("");
        fetchDashboardData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to schedule");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSchedulingMatch(null);
    }
  }

  async function handleCompleteMatch(matchId: string) {
    try {
      const response = await fetch("/api/matches/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });

      if (response.ok) {
        toast.success("Match marked as completed!");
        fetchDashboardData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to complete match");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  useEffect(() => {
    const checkSession = async () => {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setCurrentRole(data?.user?.role || "");
    };
    checkSession();
    fetchDashboardData();
  }, []);

  const [creatingMatches, setCreatingMatches] = useState(false);
  const [fixingMatches, setFixingMatches] = useState(false);

  const handleCreateAllMatches = async () => {
    setCreatingMatches(true);
    try {
      const response = await fetch("/api/matches/create-all");
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Successfully created ${data.created} match(es) for ${data.totalRecipients} verified recipient(s)`);
        fetchDashboardData(); // Refresh to show new matches
      } else {
        toast.error(data.error || "Failed to create matches");
      }
    } catch (error) {
      console.error("Error creating matches:", error);
      toast.error("Failed to create matches");
    } finally {
      setCreatingMatches(false);
    }
  };

  const handleFixMatchHospitals = async () => {
    setFixingMatches(true);
    try {
      const response = await fetch("/api/matches/fix-hospitals", {
        method: "POST",
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Fixed ${data.updated} match(es)! ${data.skipped} skipped.`);
        fetchDashboardData(); // Refresh to show matches
      } else {
        toast.error(data.error || "Failed to fix matches");
      }
    } catch (error) {
      console.error("Error fixing matches:", error);
      toast.error("Failed to fix matches");
    } finally {
      setFixingMatches(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [hospitalRes, verificationsRes, matchesRes, statsRes] = await Promise.all([
        fetch("/api/profile?role=hospital", { credentials: 'include' }),
        fetch("/api/hospital/verifications", { credentials: 'include' }),
        fetch("/api/matches?role=hospital", { credentials: 'include' }),
        fetch("/api/hospital/stats", { credentials: 'include' }),
      ]);

      const hospitalData = await hospitalRes.json();
      const verificationsData = await verificationsRes.json();
      const matchesData = await matchesRes.json();
      const statsData = await statsRes.json();

      console.log("Hospital Dashboard Data:", { 
        hospital: hospitalData, 
        verifications: verificationsData, 
        matches: matchesData, 
        stats: statsData 
      });

      // If API returned an error, show it instead of blindly redirecting
      if (hospitalData?.error) {
        console.warn('Hospital profile API returned error:', hospitalData);
        toast.error(hospitalData.message || hospitalData.error || 'Failed to load hospital profile');
        // Do not redirect automatically; user may be authenticated differently in this browser
      } else if (!hospitalData || (!hospitalData.id && !hospitalData.userId && !hospitalData.hospitalName)) {
        console.warn('Hospital profile empty or missing expected fields:', hospitalData);
        toast.info('Please complete hospital registration first');
        // Keep user on dashboard so developer can inspect logs; navigate to onboarding only if user confirms
        // router.push("/onboarding/hospital");
      } else {
        setHospitalProfile(hospitalData);
      }
      // Normalize pending verifications
      const pending = Array.isArray(verificationsData?.pending) ? verificationsData.pending : [];
      setPendingVerifications(pending);

      // Normalize matches response (some endpoints return array or { matches: [...] })
      const matchesList = Array.isArray(matchesData) ? matchesData : (matchesData?.matches || []);
      setActiveMatches(matchesList);

      // Use stats from stats endpoint but override pendingReview with actual pending list length for consistency
      const normalizedStats = { ...(statsData || stats) };
      normalizedStats.pendingReview = pending.length;
      setStats(normalizedStats);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (profileId: string, profileType: string, action: "approve" | "reject", reason?: string) => {
    try {
      const response = await fetch("/api/hospital/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          profileType,
          action,
          reason,
        }),
      });

      if (!response.ok) throw new Error("Verification failed");

      toast.success(`Profile ${action}d successfully`);
      fetchDashboardData(); // Refresh data
      setSelectedProfile(null);
    } catch (error) {
      console.error("Verification error:", error);
      toast.error(`Failed to ${action} profile`);
    }
  };

  const generateConsentPDF = async (matchId: string) => {
    try {
      toast.info("Generating PDF...");
      const response = await fetch(`/api/pdf/consent?matchId=${matchId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "PDF generation failed");
      }
      
      const data = await response.json();
      
      if (data.pdfUrl) {
        // Open the PDF URL in a new tab
        window.open(data.pdfUrl, '_blank');
        toast.success("Consent PDF opened in new tab");
      } else {
        throw new Error("PDF URL not received");
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate PDF");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      verified: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading hospital dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Building2 className="h-10 w-10 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">OrganEase - Hospital Admin</h1>
                <p className="text-sm text-gray-600">Manage verifications and procedures</p>
              </div>
            </div>
            
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                      {hospitalProfile?.hospitalName?.[0]?.toUpperCase() || 'H'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{hospitalProfile?.hospitalName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {hospitalProfile?.coordinatorEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/auth/signin" })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Verification banner for unverified hospitals */}
        {hospitalProfile && !hospitalProfile.verified && (
          <div className="mb-6 p-4 rounded-md bg-yellow-50 border-l-4 border-l-yellow-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Action required: Verify your hospital email</p>
                <p className="text-sm text-yellow-700">Your account is not yet verified. Verify your hospital email to unlock full access to donor/recipient contact details and reporting.</p>
              </div>
            </div>
          </div>
        )}

        {/* Hospital Code Quick Reference */}
        {hospitalProfile?.hospitalCode && (
          <div className="mb-6 p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-3">
            <Shield className="h-5 w-5 text-blue-500 shrink-0" />
            <span className="text-sm text-blue-700">Your hospital code:</span>
            <span className="font-mono font-bold text-blue-900 text-base">{hospitalProfile.hospitalCode}</span>
            <span className="text-xs text-blue-500">— share this with recipients during signup</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Verified</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalVerified}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending Review</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.pendingReview}</p>
                </div>
                <Clock className="h-10 w-10 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Matches</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeMatches}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Heart className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completedProcedures}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="verifications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="verifications">
              Pending Verifications ({pendingVerifications.length})
            </TabsTrigger>
            <TabsTrigger value="matches">Active Matches ({activeMatches.length})</TabsTrigger>
            <TabsTrigger value="profile">Hospital Profile</TabsTrigger>
            {/* Reports tab removed per request */}
          </TabsList>

          {/* Verifications Tab */}
          <TabsContent value="verifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profiles Awaiting Verification</CardTitle>
                <CardDescription>
                  Review and verify donor/recipient profiles and medical documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingVerifications.length > 0 ? (
                  <div className="space-y-4">
                    {pendingVerifications.map((profile) => (
                      <Card key={profile.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback className={profile.type === "donor" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}>
                                  {profile.fullName?.[0] || profile.type[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">{profile.fullName}</h3>
                                  <Badge variant={profile.type === "donor" ? "default" : "destructive"}>
                                    {profile.type}
                                  </Badge>
                                  <Badge className={getStatusColor(profile.verificationStatus)}>
                                    {profile.verificationStatus}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Activity className="h-3 w-3" />
                                    Blood: {profile.bloodGroup}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Heart className="h-3 w-3" />
                                    {profile.type === "donor" ? "Organs:" : "Needs:"} {
                                      profile.type === "donor" 
                                        ? (Array.isArray(profile.organs) ? profile.organs.join(", ") : profile.organs) || "N/A"
                                        : profile.requiredOrgan || "N/A"
                                    }
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Submitted: {new Date(profile.createdAt).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    Documents: {
                                      profile.type === "donor" 
                                        ? [profile.aadhaarUrl, profile.medicalCertificateUrl].filter(Boolean).length
                                        : [profile.hospitalLetterUrl, profile.medicalReportUrl].filter(Boolean).length
                                    } uploaded
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedProfile(profile)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleVerification(profile.id, profile.type, "approve")}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  const reason = prompt("Reason for rejection:");
                                  if (reason) handleVerification(profile.id, profile.type, "reject", reason);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Verifications</h3>
                    <p className="text-gray-600 mb-4">
                      There are currently no donor or recipient profiles awaiting verification.
                    </p>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>✓ All submitted profiles have been reviewed</p>
                      <p>✓ New submissions will appear here automatically</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile Review Modal */}
            {selectedProfile && (
              <Card className="border-4 border-blue-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Profile Review: {selectedProfile.fullName}</CardTitle>
                    <Button variant="ghost" onClick={() => setSelectedProfile(null)}>
                      ✕ Close
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Personal Information</h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>Name:</strong> {selectedProfile.fullName}</p>
                        <p><strong>Age:</strong> {selectedProfile.age} years</p>
                        <p><strong>Blood Group:</strong> {selectedProfile.bloodGroup}</p>
                        <p><strong>Email:</strong> {selectedProfile.email}</p>
                        <p><strong>Location:</strong> {selectedProfile.city}, {selectedProfile.state}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Medical Information</h4>
                      <div className="space-y-1 text-sm">
                        {selectedProfile.type === "donor" ? (
                          <>
                            <p><strong>Organs:</strong> {Array.isArray(selectedProfile.organs) ? selectedProfile.organs.join(", ") : selectedProfile.organs || "N/A"}</p>
                            <p><strong>Status:</strong> {selectedProfile.documentsVerified ? "Verified" : "Pending"}</p>
                          </>
                        ) : (
                          <>
                            <p><strong>Organ Needed:</strong> {selectedProfile.requiredOrgan}</p>
                            <p><strong>Priority:</strong> {selectedProfile.priority || "Medium"}</p>
                            <p><strong>Request Status:</strong> {selectedProfile.requestStatus || "Pending"}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Uploaded Documents</h4>
                    <div className="space-y-2">
                      {selectedProfile.aadhaarUrl && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                            onClick={() => viewDocument(selectedProfile.aadhaarUrl, "Aadhaar_Card.pdf")}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Aadhaar Card
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadDocument(selectedProfile.aadhaarUrl, "Aadhaar_Card.pdf")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {selectedProfile.medicalCertificateUrl && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                            onClick={() => viewDocument(selectedProfile.medicalCertificateUrl, "Medical_Certificate.pdf")}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Medical Certificate
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadDocument(selectedProfile.medicalCertificateUrl, "Medical_Certificate.pdf")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {selectedProfile.hospitalLetterUrl && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                            onClick={() => viewDocument(selectedProfile.hospitalLetterUrl, "Hospital_Letter.pdf")}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Hospital Letter
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadDocument(selectedProfile.hospitalLetterUrl, "Hospital_Letter.pdf")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {selectedProfile.medicalReportUrl && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                            onClick={() => viewDocument(selectedProfile.medicalReportUrl, "Medical_Report.pdf")}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Medical Report
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadDocument(selectedProfile.medicalReportUrl, "Medical_Report.pdf")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {selectedProfile.insuranceCardUrl && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                            onClick={() => viewDocument(selectedProfile.insuranceCardUrl, "Insurance_Card.pdf")}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Insurance Card
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadDocument(selectedProfile.insuranceCardUrl, "Insurance_Card.pdf")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {selectedProfile.governmentIdUrl && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                            onClick={() => viewDocument(selectedProfile.governmentIdUrl, "Government_ID.pdf")}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Government ID
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadDocument(selectedProfile.governmentIdUrl, "Government_ID.pdf")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {!selectedProfile.aadhaarUrl && !selectedProfile.medicalCertificateUrl && 
                     !selectedProfile.hospitalLetterUrl && !selectedProfile.medicalReportUrl &&
                     !selectedProfile.insuranceCardUrl && !selectedProfile.governmentIdUrl && (
                      <p className="text-sm text-gray-500 mt-2">No documents uploaded yet</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleVerification(selectedProfile.id, selectedProfile.type, "approve")}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Profile
                    </Button>
                    <Button
                      className="flex-1"
                      variant="destructive"
                      onClick={() => {
                        const reason = prompt("Reason for rejection:");
                        if (reason) handleVerification(selectedProfile.id, selectedProfile.type, "reject", reason);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches" className="space-y-4">
            {activeMatches.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>No Active Matches</CardTitle>
                  <CardDescription>
                    Create matches for verified recipients and donors
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={handleCreateAllMatches}
                    disabled={creatingMatches}
                    className="w-full"
                  >
                    {creatingMatches ? "Creating Matches..." : "Create Matches for Verified Profiles"}
                  </Button>
                  <Button 
                    onClick={handleFixMatchHospitals}
                    disabled={fixingMatches}
                    variant="outline"
                    className="w-full"
                  >
                    {fixingMatches ? "Fixing Matches..." : "Fix Existing Matches (Assign Hospital)"}
                  </Button>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    This will automatically create match records for all verified recipients with compatible verified donors
                  </p>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle>Active Donor-Recipient Matches</CardTitle>
                <CardDescription>Monitor and manage approved matches</CardDescription>
              </CardHeader>
              <CardContent>
                {activeMatches.length > 0 ? (
                  <div className="space-y-4">
                    {activeMatches.map((match) => (
                      <Card key={match.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="text-center">
                                  <Avatar className="h-12 w-12 mx-auto mb-1">
                                    <AvatarFallback className="bg-green-100 text-green-600">D</AvatarFallback>
                                  </Avatar>
                                  <p className="text-xs text-gray-600">Donor</p>
                                </div>
                                <div className="flex-1 border-t-2 border-dashed relative">
                                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                                    <Heart className="h-5 w-5 text-red-600" />
                                  </div>
                                </div>
                                <div className="text-center">
                                  <Avatar className="h-12 w-12 mx-auto mb-1">
                                    <AvatarFallback className="bg-red-100 text-red-600">R</AvatarFallback>
                                  </Avatar>
                                  <p className="text-xs text-gray-600">Recipient</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="font-medium">Match Score</p>
                                  <p className="text-gray-600">{match.score}%</p>
                                </div>
                                <div>
                                  <p className="font-medium">Status</p>
                                  <Badge className={getStatusColor(match.status || "pending")}>
                                    {match.status || "pending"}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="font-medium">Matched On</p>
                                  <p className="text-gray-600">{new Date(match.matchedAt || match.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-3">
                                {match.approvedByHospital && (
                                  <Badge className="bg-green-100 text-green-800 text-xs">
                                    Hospital Approved
                                  </Badge>
                                )}
                                {match.donorAccepted && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                                    Donor Accepted
                                  </Badge>
                                )}
                                {match.recipientAccepted && (
                                  <Badge className="bg-purple-100 text-purple-800 text-xs">
                                    Recipient Accepted
                                  </Badge>
                                )}
                                {match.testScheduledDate && (
                                  <Badge className="bg-orange-100 text-orange-800 text-xs">
                                    Test Scheduled: {new Date(match.testScheduledDate).toLocaleDateString()}
                                  </Badge>
                                )}
                                {match.procedureScheduledDate && (
                                  <Badge className="bg-indigo-100 text-indigo-800 text-xs">
                                    Procedure: {new Date(match.procedureScheduledDate).toLocaleDateString()}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <Button size="sm" variant="outline" onClick={() => loadMatchDetails(match.id)}>
                                <Eye className="h-4 w-4 mr-1" />
                                View Full Details
                              </Button>
                              
                              {match.donorAccepted && match.recipientAccepted && !match.testScheduledDate && (
                                <Button size="sm" onClick={() => {
                                  setCurrentMatch(match);
                                  setSchedulingMatch(match.id);
                                  setScheduleType("test");
                                  setScheduleDate("");
                                }}>
                                  Schedule Test
                                </Button>
                              )}
                              
                              {match.testScheduledDate && !match.procedureScheduledDate && (
                                <Button size="sm" onClick={() => {
                                  setCurrentMatch(match);
                                  setSchedulingMatch(match.id);
                                  setScheduleType("procedure");
                                  setScheduleDate("");
                                }}>
                                  Schedule Procedure
                                </Button>
                              )}
                              
                              {match.procedureScheduledDate && match.status !== "completed" && (
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleCompleteMatch(match.id)}>
                                  Mark Complete
                                </Button>
                              )}
                              
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => generateConsentPDF(match.id)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Get PDF
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No active matches</h3>
                    <p className="text-gray-600">Verified profiles will be automatically matched.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Hospital Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hospitalProfile ? (
                  <div className="space-y-6">
                    {/* Hospital Code Banner */}
                    {hospitalProfile.hospitalCode && (
                      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div>
                          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Your Hospital Code</p>
                          <p className="text-2xl font-mono font-bold text-blue-800">{hospitalProfile.hospitalCode}</p>
                          <p className="text-xs text-blue-600 mt-1">Share this code with recipients during their signup so they are linked to your hospital</p>
                        </div>
                        <Shield className="h-10 w-10 text-blue-400 shrink-0" />
                      </div>
                    )}
                    {/* Hospital Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="text-gray-600 text-xs mb-1">Hospital Name</p>
                            <p className="font-medium">{hospitalProfile.hospitalName || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs mb-1">Registration Number</p>
                            <p className="font-medium">{hospitalProfile.registrationNumber || "N/A"}</p>
                          </div>
                          {hospitalProfile.accreditation && (
                            <div>
                              <p className="text-gray-600 text-xs mb-1">Accreditation</p>
                              <p className="font-medium">{hospitalProfile.accreditation}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-600 text-xs mb-1">Contact Email</p>
                            <p className="font-medium">{hospitalProfile.coordinatorEmail || hospitalProfile.email || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs mb-1">Contact Phone</p>
                            <p className="font-medium">{hospitalProfile.contactNumber || hospitalProfile.phoneNumber || "N/A"}</p>
                          </div>
                          {(hospitalProfile.address || hospitalProfile.city || hospitalProfile.state) && (
                            <div>
                              <p className="text-gray-600 text-xs mb-1">Location</p>
                              <p className="font-medium">
                                {[
                                  hospitalProfile.address,
                                  hospitalProfile.city,
                                  hospitalProfile.state,
                                  hospitalProfile.pincode
                                ].filter(Boolean).join(", ") || "N/A"}
                              </p>
                            </div>
                          )}
                          {hospitalProfile.website && (
                            <div>
                              <p className="text-gray-600 text-xs mb-1">Website</p>
                              <p className="font-medium">{hospitalProfile.website}</p>
                            </div>
                          )}
                          {hospitalProfile.coordinatorName && (
                            <div>
                              <p className="text-gray-600 text-xs mb-1">Transplant Coordinator</p>
                              <p className="font-medium">{hospitalProfile.coordinatorName}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {(hospitalProfile.transplantDepartmentHead || 
                        hospitalProfile.departmentPhone || 
                        hospitalProfile.departmentEmail || 
                        hospitalProfile.numberOfTransplantSurgeons || 
                        hospitalProfile.transplantCapacity || 
                        (hospitalProfile.specializations && hospitalProfile.specializations.length > 0)) ? (
                        <div>
                          <h3 className="font-semibold mb-4">Transplant Department</h3>
                          <div className="space-y-3 text-sm">
                            {hospitalProfile.transplantDepartmentHead && (
                              <div>
                                <p className="text-gray-600 text-xs mb-1">Department Head</p>
                                <p className="font-medium">{hospitalProfile.transplantDepartmentHead}</p>
                              </div>
                            )}
                            {hospitalProfile.departmentPhone && (
                              <div>
                                <p className="text-gray-600 text-xs mb-1">Department Phone</p>
                                <p className="font-medium">{hospitalProfile.departmentPhone}</p>
                              </div>
                            )}
                            {hospitalProfile.departmentEmail && (
                              <div>
                                <p className="text-gray-600 text-xs mb-1">Department Email</p>
                                <p className="font-medium">{hospitalProfile.departmentEmail}</p>
                              </div>
                            )}
                            {hospitalProfile.numberOfTransplantSurgeons && (
                              <div>
                                <p className="text-gray-600 text-xs mb-1">Number of Surgeons</p>
                                <p className="font-medium">{hospitalProfile.numberOfTransplantSurgeons}</p>
                              </div>
                            )}
                            {hospitalProfile.transplantCapacity && (
                              <div>
                                <p className="text-gray-600 text-xs mb-1">Annual Capacity</p>
                                <p className="font-medium">{hospitalProfile.transplantCapacity} procedures/year</p>
                              </div>
                            )}
                            {hospitalProfile.specializations && hospitalProfile.specializations.length > 0 && (
                              <div>
                                <p className="text-gray-600 text-xs mb-2">Specializations</p>
                                <div className="flex flex-wrap gap-1">
                                  {hospitalProfile.specializations.map((spec: string) => (
                                    <Badge key={spec} variant="secondary" className="text-xs">{spec}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex gap-2 items-center pt-4 border-t">
                      <Button variant="outline" className="flex-1" onClick={openEditDialog}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                      <div className="flex-1 flex items-center justify-center">
                        {hospitalProfile?.verified ? (
                          <Badge className="bg-green-100 text-green-800">Verified</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">Verification pending</Badge>
                        )}
                      </div>
                      <Button variant="destructive" className="flex-1" onClick={() => setIsDeleteDialogOpen(true)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Profile
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No hospital profile found</p>
                    <Button onClick={() => window.location.href = "/onboarding/hospital"}>
                      Complete Hospital Registration
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports tab removed per request */}
        </Tabs>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Hospital Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={editForm.contactEmail || ""}
                onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={editForm.contactPhone || ""}
                onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={editForm.address || ""}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={editForm.city || ""}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={editForm.state || ""}
                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                value={editForm.pincode || ""}
                onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleEditSubmit} className="flex-1">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Profile Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Hospital Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-medium mb-2">⚠️ Warning: This action cannot be undone!</p>
              <p className="text-sm text-red-700">
                Deleting your hospital profile will permanently remove:
              </p>
              <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
                <li>All hospital information</li>
                <li>Verification records</li>
                <li>Match coordination history</li>
                <li>Administrative access</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this hospital profile?
            </p>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1" disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteProfile} className="flex-1" disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Profile"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Match Details Dialog */}
      <Dialog open={matchDetailsDialog} onOpenChange={setMatchDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Match Details & Approval</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Donor Information */}
                <div className="border rounded-lg p-4 bg-green-50">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-green-600" />
                    Donor Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{selectedMatch.donor?.fullName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-gray-600">Age</p>
                        <p className="font-medium">{selectedMatch.donor?.age}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Blood Group</p>
                        <p className="font-medium">{selectedMatch.donor?.bloodGroup}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium">{selectedMatch.donor?.city}, {selectedMatch.donor?.state}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Contact</p>
                      <p className="font-medium">{selectedMatch.donorUser?.email}</p>
                      <p className="font-medium">{selectedMatch.donorUser?.phone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Available Organs</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedMatch.donor?.organs?.map((organ: string) => (
                          <Badge key={organ} variant="secondary" className="text-xs">
                            {organ.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recipient Information */}
                <div className="border rounded-lg p-4 bg-red-50">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-red-600" />
                    Recipient Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{selectedMatch.recipient?.patientName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-gray-600">Age</p>
                        <p className="font-medium">{selectedMatch.recipient?.age}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Blood Group</p>
                        <p className="font-medium">{selectedMatch.recipient?.bloodGroup}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium">{selectedMatch.recipient?.city}, {selectedMatch.recipient?.state}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Contact</p>
                      <p className="font-medium">{selectedMatch.recipientUser?.email}</p>
                      <p className="font-medium">{selectedMatch.recipientUser?.phone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Required Organ</p>
                      <Badge variant="secondary" className="mt-1">
                        {selectedMatch.recipient?.requiredOrgan?.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Priority</p>
                      <Badge variant={selectedMatch.recipient?.priority === "emergency" ? "destructive" : "default"} className="mt-1">
                        {selectedMatch.recipient?.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {!selectedMatch.approvedByHospital && (
                <div className="border-t pt-4">
                  <Label htmlFor="notes" className="mb-2 block">Hospital Notes (Optional)</Label>
                  <textarea
                    id="notes"
                    className="w-full min-h-25 p-3 border rounded-lg"
                    placeholder="Add any notes about this match..."
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                  />
                  <div className="flex gap-3 mt-4">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApproveMatch(selectedMatch.id, true)}
                      disabled={approvingMatch === selectedMatch.id}
                    >
                      {approvingMatch === selectedMatch.id ? "Approving..." : "Approve Match"}
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleApproveMatch(selectedMatch.id, false)}
                      disabled={approvingMatch === selectedMatch.id}
                    >
                      Reject Match
                    </Button>
                  </div>
                </div>
              )}

              {selectedMatch.approvedByHospital && (
                <div className="border-t pt-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="font-semibold text-green-900">✓ Match Approved by Hospital</p>
                    <p className="text-sm text-green-700 mt-1">
                      Approved on: {new Date(selectedMatch.approvedAt).toLocaleDateString()}
                    </p>
                    {selectedMatch.hospitalNotes && (
                      <p className="text-sm text-green-700 mt-2">
                        Notes: {selectedMatch.hospitalNotes}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Scheduling Dialog */}
      <Dialog open={schedulingMatch !== null} onOpenChange={() => {
        setSchedulingMatch(null);
        setCurrentMatch(null);
        setScheduleDate("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Schedule {scheduleType === "test" ? "Medical Test" : "Transplant Procedure"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {scheduleType === "procedure" && currentMatch?.testScheduledDate && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
                <p className="text-blue-800">
                  <strong>Note:</strong> Test is scheduled for {new Date(currentMatch.testScheduledDate).toLocaleString()}
                </p>
                <p className="text-blue-700 mt-1">
                  Procedure must be scheduled after the test date.
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="scheduleDate">Date and Time</Label>
              <Input
                id="scheduleDate"
                type="datetime-local"
                value={scheduleDate}
                min={scheduleType === "procedure" && currentMatch?.testScheduledDate 
                  ? new Date(currentMatch.testScheduledDate).toISOString().slice(0, 16)
                  : new Date().toISOString().slice(0, 16)
                }
                onChange={(e) => setScheduleDate(e.target.value)}
              />
              {scheduleType === "procedure" && currentMatch?.testScheduledDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Minimum date: {new Date(currentMatch.testScheduledDate).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setSchedulingMatch(null);
                setCurrentMatch(null);
                setScheduleDate("");
              }} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => schedulingMatch && handleSchedule(schedulingMatch)}
                className="flex-1"
                disabled={!scheduleDate}
              >
                Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
