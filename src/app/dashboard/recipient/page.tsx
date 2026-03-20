"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/DashboardLayout";
import HospitalMessageBox from "@/components/HospitalMessageBox";
import Timeline, { generateTimelineSteps } from "@/components/Timeline";
import {
  Heart, Clock, MapPin, AlertCircle, CheckCircle, MessageSquare,
  FileText, Activity, TrendingUp, Edit, Building2, Upload,
  Droplets, Shield,
} from "lucide-react";
import { toast } from "sonner";

export default function RecipientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [acceptingMatch, setAcceptingMatch] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (session?.user) loadDashboardData();
  }, [session]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (session?.user) loadDashboardData();
    }, 15000);
    return () => clearInterval(interval);
  }, [session]);

  async function loadDashboardData() {
    try {
      const profileRes = await fetch("/api/profile?role=recipient");
      if (!profileRes.ok) {
        toast.error("Unable to fetch profile");
        setLoading(false);
        return;
      }
      const profileData = await profileRes.json();
      if (!profileData?.id || !profileData?.patientName) {
        router.push("/onboarding/recipient");
        return;
      }

      const [matchesRes, notifRes] = await Promise.all([
        fetch(`/api/matches?userId=${profileData.id}`),
        fetch("/api/notifications"),
      ]);
      const matchesData = await matchesRes.json();
      const notifData = await notifRes.json();

      setProfile(profileData);
      const processedMatches = (matchesData.matches || matchesData || []).map((m: any) => ({
        ...m,
        approvedByHospital: !!m.approvedByHospital,
        donorAccepted: !!m.donorAccepted,
        recipientAccepted: !!m.recipientAccepted,
      }));
      setMatches(processedMatches);
      setNotifications(notifData);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptMatch(matchId: string) {
    setAcceptingMatch(matchId);
    try {
      const res = await fetch("/api/matches/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, accepted: true }),
      });
      if (res.ok) {
        toast.success("Match accepted!");
        loadDashboardData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed");
      }
    } catch { toast.error("Failed to accept match"); }
    finally { setAcceptingMatch(null); }
  }

  async function handleUploadDocument(type: string, file: File) {
    setUploadingDoc(type);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        // Update profile with document URL
        await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "recipient", [type]: data.url }),
        });
        toast.success("Document uploaded!");
        loadDashboardData();
      }
    } catch { toast.error("Upload failed"); }
    finally { setUploadingDoc(null); }
  }

  async function handleEditProfile() {
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, role: "recipient" }),
      });
      if (res.ok) {
        toast.success("Profile updated");
        setIsEditDialogOpen(false);
        loadDashboardData();
      }
    } catch { toast.error("Failed to update"); }
  }

  const navItems = [
    { label: "Overview", href: "/dashboard/recipient", icon: <Activity className="h-4 w-4" /> },
    { label: "Documents", href: "/dashboard/recipient", icon: <FileText className="h-4 w-4" /> },
    { label: "Hospital", href: "/dashboard/recipient", icon: <Building2 className="h-4 w-4" /> },
    { label: "Messages", href: "/dashboard/recipient", icon: <MessageSquare className="h-4 w-4" /> },
  ];

  if (loading) {
    return (
      <DashboardLayout role="recipient" userName={(session?.user as any)?.name} userEmail={(session?.user as any)?.email} navItems={navItems}>
        <div className="flex items-center justify-center h-64">
          <Activity className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  const statusColor = {
    pending: "bg-yellow-100 text-yellow-800",
    under_review: "bg-blue-100 text-blue-800",
    verified: "bg-green-100 text-green-800",
    matched: "bg-purple-100 text-purple-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    completed: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-gray-100 text-gray-800",
  };

  return (
    <DashboardLayout
      role="recipient"
      userName={(session?.user as any)?.name || "Recipient"}
      userEmail={(session?.user as any)?.email || ""}
      navItems={navItems}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile?.patientName || "Patient"}</h1>
          <p className="text-sm text-gray-500 mt-1">Your organ request status</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={(statusColor as any)[profile?.requestStatus] || "bg-gray-100 text-gray-800"}>
            {profile?.requestStatus?.replace(/_/g, " ") || "pending"}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => { setEditForm(profile || {}); setIsEditDialogOpen(true); }}>
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Blood Group</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{profile?.bloodGroup || "—"}</p>
              </div>
              <Droplets className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Required Organ</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{profile?.requiredOrgan?.replace(/_/g, " ") || "—"}</p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Priority</p>
                <p className="text-lg font-bold text-gray-900 mt-1 capitalize">{profile?.priority || "normal"}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Matches</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{matches.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white shadow-sm">
          <TabsTrigger value="overview" className="px-4">Overview</TabsTrigger>
          <TabsTrigger value="documents" className="px-4">Medical Docs</TabsTrigger>
          <TabsTrigger value="hospital" className="px-4">Hospital</TabsTrigger>
          <TabsTrigger value="status" className="px-4">Status</TabsTrigger>
          <TabsTrigger value="messages" className="px-4">Messages</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-blue-600" /> Your Request
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Patient Name</p>
                  <p className="text-sm font-semibold">{profile?.patientName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Age</p>
                  <p className="text-sm font-semibold">{profile?.age}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Blood Group</p>
                  <p className="text-sm font-semibold">{profile?.bloodGroup}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Location</p>
                  <p className="text-sm font-semibold">{profile?.city}, {profile?.state}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Required Organ</p>
                  <Badge variant="outline">{profile?.requiredOrgan?.replace(/_/g, " ")}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Priority</p>
                  <Badge variant="outline" className="capitalize">{profile?.priority}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Documents</p>
                  <Badge className={profile?.documentsVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                    {profile?.documentsVerified ? "Verified" : "Pending"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Matches */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" /> Matches ({matches.length})
              </CardTitle>
              <CardDescription>Potential donor matches managed by your hospital</CardDescription>
            </CardHeader>
            <CardContent>
              {matches.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No matches yet. Your hospital is looking for compatible donors.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matches.map((match: any) => (
                    <div key={match.id} className="border rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-800 text-xs">{match.organType?.replace(/_/g, " ")}</Badge>
                            {match.matchScore && <Badge variant="outline" className="text-xs">{match.matchScore}% match</Badge>}
                          </div>
                          <p className="text-sm text-gray-500">
                            Status: {match.approvedByHospital ? "Hospital approved" : "Awaiting hospital review"}
                            {match.recipientAccepted && " • You accepted"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {match.approvedByHospital && !match.recipientAccepted && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleAcceptMatch(match.id)}
                              disabled={acceptingMatch === match.id}>
                              <CheckCircle className="h-4 w-4 mr-1" /> Accept
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" /> Medical Documents
              </CardTitle>
              <CardDescription>Upload and manage your medical documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { key: "hospitalLetterUrl", label: "Hospital Letter", desc: "Letter from referring hospital" },
                  { key: "medicalReportUrl", label: "Medical Report", desc: "Latest medical examination report" },
                  { key: "insuranceCardUrl", label: "Insurance Card", desc: "Health insurance documentation" },
                  { key: "governmentIdUrl", label: "Government ID", desc: "Valid government-issued ID" },
                ].map(doc => (
                  <div key={doc.key} className="border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{doc.label}</p>
                      <p className="text-xs text-gray-500">{doc.desc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(profile as any)?.[doc.key] ? (
                        <>
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" /> Uploaded
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => window.open((profile as any)[doc.key], "_blank")}>
                            View
                          </Button>
                        </>
                      ) : (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadDocument(doc.key, file);
                            }}
                          />
                          <div className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                            <Upload className="h-4 w-4" /> Upload
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hospital Tab */}
        <TabsContent value="hospital">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" /> Assigned Hospital
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile?.registeredHospitalId ? (
                <div className="space-y-3">
                  <div className="border rounded-lg p-4 bg-blue-50/30">
                    <p className="font-semibold text-gray-900">{profile?.hospitalName || "Your Hospital"}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      <MapPin className="h-3 w-3 inline mr-1" /> {profile?.city}, {profile?.state}
                    </p>
                    <Badge className="bg-green-100 text-green-800 mt-2">
                      <CheckCircle className="h-3 w-3 mr-1" /> Linked
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400">
                    Your hospital manages your case, including matching and approvals.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No hospital linked yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Tab */}
        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Request Timeline</CardTitle>
              <CardDescription>Track your organ request progress</CardDescription>
            </CardHeader>
            <CardContent>
              {matches.length > 0 ? (
                <Timeline steps={generateTimelineSteps(matches[0])} />
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Your timeline will appear once a match is found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages">
          {profile?.registeredHospitalId ? (
            <HospitalMessageBox
              hospitalId={profile.registeredHospitalId}
              hospitalName={profile.hospitalName}
              userId={session?.user?.id || ""}
              userRole="recipient"
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Messaging is available after linking to a hospital.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Patient Name</Label>
              <Input value={editForm.patientName || ""} onChange={e => setEditForm({...editForm, patientName: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>City</Label>
                <Input value={editForm.city || ""} onChange={e => setEditForm({...editForm, city: e.target.value})} />
              </div>
              <div>
                <Label>State</Label>
                <Input value={editForm.state || ""} onChange={e => setEditForm({...editForm, state: e.target.value})} />
              </div>
            </div>
            <Button onClick={handleEditProfile} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
