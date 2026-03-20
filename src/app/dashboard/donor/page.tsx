"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/DashboardLayout";
import HospitalMessageBox from "@/components/HospitalMessageBox";
import Timeline, { generateTimelineSteps } from "@/components/Timeline";
import {
  Heart, Activity, Clock, CheckCircle2, AlertCircle, FileText,
  MessageSquare, Power, Edit, Trash2, TrendingUp, Building2,
  Droplets, MapPin, Shield,
} from "lucide-react";
import { toast } from "sonner";
import { ORGAN_TYPES } from "@/lib/constants";

export default function DonorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<"active" | "paused">("active");
  const [toggling, setToggling] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [acceptingMatch, setAcceptingMatch] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) loadDashboardData();
  }, [session]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (session?.user) loadDashboardData();
    }, 15000);
    return () => clearInterval(interval);
  }, [session]);

  async function loadDashboardData() {
    try {
      const profileRes = await fetch("/api/profile?role=donor");
      if (!profileRes.ok) {
        toast.error("Unable to fetch profile");
        setLoading(false);
        return;
      }
      const profileData = await profileRes.json();
      if (!profileData?.id || !profileData?.fullName) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const [matchesRes, notifRes] = await Promise.all([
        fetch(`/api/matches?userId=${profileData.id}`),
        fetch("/api/notifications"),
      ]);
      const matchesData = await matchesRes.json();
      const notifData = await notifRes.json();

      setProfile(profileData);
      setAvailability(profileData.availability || "active");
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

  async function toggleAvailability() {
    setToggling(true);
    try {
      const newStatus = availability === "active" ? "paused" : "active";
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "donor", availability: newStatus }),
      });
      if (res.ok) {
        setAvailability(newStatus);
        toast.success(`Status: ${newStatus}`);
      }
    } catch { toast.error("Failed to toggle"); }
    finally { setToggling(false); }
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

  async function handleEditProfile() {
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, role: "donor" }),
      });
      if (res.ok) {
        toast.success("Profile updated");
        setIsEditDialogOpen(false);
        loadDashboardData();
      }
    } catch { toast.error("Failed to update"); }
  }

  const navItems = [
    { label: "Overview", href: "/dashboard/donor", icon: <Activity className="h-4 w-4" /> },
    { label: "Status", href: "/dashboard/donor", icon: <TrendingUp className="h-4 w-4" /> },
    { label: "Hospital", href: "/dashboard/donor", icon: <Building2 className="h-4 w-4" /> },
    { label: "Messages", href: "/dashboard/donor", icon: <MessageSquare className="h-4 w-4" /> },
  ];

  if (loading) {
    return (
      <DashboardLayout role="donor" userName={(session?.user as any)?.name} userEmail={(session?.user as any)?.email} navItems={navItems}>
        <div className="flex items-center justify-center h-64">
          <Activity className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout role="donor" userName={(session?.user as any)?.name || "User"} userEmail={(session?.user as any)?.email || ""} navItems={navItems}>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md text-center border-0 shadow-lg rounded-2xl">
            <CardContent className="p-10">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
                <Heart className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Complete Your Donor Profile</h2>
              <p className="text-sm text-gray-500 mb-6">You haven't set up your donor profile yet. Complete onboarding to start your donation journey.</p>
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8 h-11" onClick={() => router.push("/onboarding/donor")}>
                <Heart className="mr-2 h-4 w-4" />
                Start Onboarding
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="donor"
      userName={(session?.user as any)?.name || "Donor"}
      userEmail={(session?.user as any)?.email || ""}
      navItems={navItems}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile?.fullName || "Donor"}</h1>
          <p className="text-sm text-gray-500 mt-1">Your organ donation journey</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={availability === "active" ? "default" : "secondary"} className={availability === "active" ? "bg-green-100 text-green-800" : ""}>
            {availability === "active" ? "Active" : "Paused"}
          </Badge>
          <Button variant="outline" size="sm" onClick={toggleAvailability} disabled={toggling}>
            <Power className="h-4 w-4 mr-1" />
            {availability === "active" ? "Pause" : "Activate"}
          </Button>
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

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Organs</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{(profile?.organs as string[])?.length || 0} registered</p>
              </div>
              <Heart className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Matches</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{matches.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Verification</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{profile?.documentsVerified ? "Verified" : "Pending"}</p>
              </div>
              <Shield className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white shadow-sm">
          <TabsTrigger value="overview" className="px-4">Overview</TabsTrigger>
          <TabsTrigger value="status" className="px-4">Journey Status</TabsTrigger>
          <TabsTrigger value="hospital" className="px-4">Hospital</TabsTrigger>
          <TabsTrigger value="messages" className="px-4">Messages</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-blue-600" /> Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Full Name</p>
                  <p className="text-sm font-semibold">{profile?.fullName}</p>
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
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 font-medium">Organs</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(profile?.organs as string[])?.map((o: string) => (
                      <Badge key={o} variant="outline" className="text-xs">{o.replace(/_/g, " ")}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Documents</p>
                  <Badge className={profile?.documentsVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                    {profile?.documentsVerified ? "Verified" : "Pending Review"}
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
              <CardDescription>Your donor matches — managed by your hospital</CardDescription>
            </CardHeader>
            <CardContent>
              {matches.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No matches yet. Your hospital will find compatible recipients.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matches.map((match: any) => (
                    <div key={match.id} className="border rounded-xl p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-800 text-xs">{match.organType?.replace(/_/g, " ")}</Badge>
                            {match.matchScore && (
                              <Badge variant="outline" className="text-xs">{match.matchScore}% match</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            Status: {match.approvedByHospital ? "Hospital approved" : "Awaiting hospital review"}
                            {match.donorAccepted && " • You accepted"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {match.approvedByHospital && !match.donorAccepted && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleAcceptMatch(match.id)}
                              disabled={acceptingMatch === match.id}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Accept
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedMatch(match)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journey Status Tab */}
        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Donation Journey</CardTitle>
              <CardDescription>Track your progress through the donation process</CardDescription>
            </CardHeader>
            <CardContent>
              {matches.length > 0 ? (
                <Timeline steps={generateTimelineSteps(matches[0])} />
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Your timeline will appear once you are matched.</p>
                  <p className="text-sm text-gray-400 mt-2">Your hospital will handle the matching process.</p>
                </div>
              )}
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
              <CardDescription>Your linked hospital manages your donation process</CardDescription>
            </CardHeader>
            <CardContent>
              {(profile?.registeredHospitalId || profile?.verifiedByHospitalId) ? (
                <div className="space-y-3">
                  <div className="border rounded-lg p-4 bg-blue-50/30">
                    <p className="font-semibold text-gray-900">{profile?.hospitalName || "Your Hospital"}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      {profile?.hospitalCity || profile?.city}, {profile?.hospitalState || profile?.state}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Linked
                      </Badge>
                      {profile?.documentsVerified && (
                        <Badge className="bg-blue-100 text-blue-800">
                          Documents Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    All communications and procedures are handled through your assigned hospital.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No hospital linked yet.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Your hospital will be linked once they verify your documents.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages">
          {(profile?.registeredHospitalId || profile?.verifiedByHospitalId) ? (
            <HospitalMessageBox
              hospitalId={profile?.registeredHospitalId || profile?.verifiedByHospitalId}
              hospitalName={profile.hospitalName}
              userId={session?.user?.id || ""}
              userRole="donor"
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Messaging will be available after a hospital verifies your documents.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Match Details Dialog */}
      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Match Details</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Organ Type</p>
                  <p className="font-medium">{selectedMatch.organType?.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Match Score</p>
                  <p className="font-medium">{selectedMatch.matchScore || "—"}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Hospital Approved</p>
                  <Badge className={selectedMatch.approvedByHospital ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                    {selectedMatch.approvedByHospital ? "Yes" : "Pending"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Your Status</p>
                  <Badge className={selectedMatch.donorAccepted ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                    {selectedMatch.donorAccepted ? "Accepted" : "Pending"}
                  </Badge>
                </div>
              </div>
              {selectedMatch.approvedByHospital && !selectedMatch.donorAccepted && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => { handleAcceptMatch(selectedMatch.id); setSelectedMatch(null); }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Accept Match
                </Button>
              )}
              <p className="text-xs text-gray-400 text-center">
                All match details are managed by your hospital.
                Personal information of recipients is not disclosed.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Full Name</Label>
              <Input value={editForm.fullName || ""} onChange={e => setEditForm({...editForm, fullName: e.target.value})} />
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
