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
import {
  Building2, Users, CheckCircle, XCircle, Clock, Heart,
  FileText, MessageSquare, AlertCircle, TrendingUp, Activity,
  Calendar, Eye, Download, Shield, Edit, User, Search,
  Droplets, MapPin, Zap, BarChart3,
} from "lucide-react";
import { toast } from "sonner";

export default function HospitalDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hospitalProfile, setHospitalProfile] = useState<any>(null);
  const [donors, setDonors] = useState<any[]>([]);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [activeMatches, setActiveMatches] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalDonors: 0, totalRecipients: 0, pendingReview: 0, activeMatches: 0, completedProcedures: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [selectedProfileType, setSelectedProfileType] = useState<"donor" | "recipient">("donor");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchResults, setMatchResults] = useState<any[]>([]);
  const [findingMatches, setFindingMatches] = useState(false);
  const [selectedMatchDetails, setSelectedMatchDetails] = useState<any>(null);
  const [chatUser, setChatUser] = useState<any>(null);
  const [scheduleMatchId, setScheduleMatchId] = useState<string | null>(null);
  const [scheduleType, setScheduleType] = useState<"test" | "procedure">("test");
  const [scheduleDate, setScheduleDate] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (session?.user) fetchDashboardData();
  }, [session]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (session?.user) fetchDashboardData();
    }, 15000);
    return () => clearInterval(interval);
  }, [session]);

  async function fetchDashboardData() {
    try {
      // Fetch hospital profile first
      const profileRes = await fetch("/api/profile?role=hospital");
      if (!profileRes.ok) {
        const err = await profileRes.json().catch(() => ({}));
        if (!hospitalProfile) {
          router.push("/onboarding/hospital");
        }
        setLoading(false);
        return;
      }

      const profileData = await profileRes.json();
      if (!profileData?.id || !profileData?.hospitalName) {
        router.push("/onboarding/hospital");
        return;
      }
      setHospitalProfile(profileData);

      // Fetch hospital stats and data
      const statsRes = await fetch("/api/hospital/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setDonors(statsData.donors || []);
        setRecipients(statsData.recipients || []);
        setActiveMatches(statsData.matches || []);
        setStats({
          totalDonors: statsData.donors?.length || 0,
          totalRecipients: statsData.recipients?.length || 0,
          pendingReview: (statsData.donors || []).filter((d: any) => !d.documentsVerified).length +
                        (statsData.recipients || []).filter((r: any) => !r.documentsVerified).length,
          activeMatches: statsData.matches?.length || 0,
          completedProcedures: (statsData.matches || []).filter((m: any) => m.completedAt).length,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyProfile(profileId: string, profileType: "donor" | "recipient", action: "approve" | "reject") {
    setVerifyingId(profileId);
    try {
      const res = await fetch("/api/hospital/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, profileType, action }),
      });
      if (res.ok) {
        toast.success(`Profile ${action}d`);
        fetchDashboardData();
        setSelectedProfile(null);
      } else {
        const data = await res.json();
        toast.error(data.error || "Action failed");
      }
    } catch { toast.error("Failed"); }
    finally { setVerifyingId(null); }
  }

  async function handleApproveMatch(matchId: string) {
    try {
      const res = await fetch("/api/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, action: "approve", role: "hospital" }),
      });
      if (res.ok) {
        toast.success("Match approved");
        fetchDashboardData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed");
      }
    } catch { toast.error("Failed to approve match"); }
  }

  async function handleSchedule(matchId: string, type: "test" | "procedure", date: string) {
    try {
      const res = await fetch("/api/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, action: `schedule-${type}`, date }),
      });
      if (res.ok) {
        toast.success(`${type === "test" ? "Test" : "Procedure"} scheduled`);
        fetchDashboardData();
      }
    } catch { toast.error("Failed to schedule"); }
  }

  async function handleFindMatches() {
    setFindingMatches(true);
    try {
      const res = await fetch("/api/matches/find", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setMatchResults(data.results || []);
        setShowMatchModal(true);
        if (data.results?.length > 0) {
          toast.success(`Found ${data.results.length} potential matches`);
        } else {
          toast.info("No new matches found");
        }
        fetchDashboardData();
      }
    } catch { toast.error("Failed to run matching"); }
    finally { setFindingMatches(false); }
  }

  const pendingDonors = donors.filter(d => !d.documentsVerified);
  const verifiedDonors = donors.filter(d => d.documentsVerified);
  const pendingRecipients = recipients.filter(r => !r.documentsVerified);
  const verifiedRecipients = recipients.filter(r => r.documentsVerified);

  const navItems = [
    { label: "Overview", href: "/dashboard/hospital", icon: <BarChart3 className="h-4 w-4" /> },
    { label: "Donors", href: "/dashboard/hospital", icon: <Heart className="h-4 w-4" />, badge: pendingDonors.length },
    { label: "Recipients", href: "/dashboard/hospital", icon: <Users className="h-4 w-4" />, badge: pendingRecipients.length },
    { label: "Matches", href: "/dashboard/hospital", icon: <TrendingUp className="h-4 w-4" /> },
    { label: "Documents", href: "/dashboard/hospital", icon: <FileText className="h-4 w-4" /> },
    { label: "Communication", href: "/dashboard/hospital", icon: <MessageSquare className="h-4 w-4" /> },
  ];

  if (loading) {
    return (
      <DashboardLayout role="hospital" userName={hospitalProfile?.hospitalName || "Hospital"} userEmail={(session?.user as any)?.email} navItems={navItems}>
        <div className="flex items-center justify-center h-64">
          <Activity className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="hospital"
      userName={hospitalProfile?.hospitalName || "Hospital"}
      userEmail={(session?.user as any)?.email || ""}
      navItems={navItems}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{hospitalProfile?.hospitalName || "Hospital Dashboard"}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {hospitalProfile?.city}, {hospitalProfile?.state} • Code: <span className="font-mono text-blue-600">{hospitalProfile?.hospitalCode || "—"}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={hospitalProfile?.verificationStatus === "verified" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
            {hospitalProfile?.verificationStatus || "pending"}
          </Badge>
          <Button onClick={handleFindMatches} disabled={findingMatches} className="bg-blue-600 hover:bg-blue-700">
            <Zap className="h-4 w-4 mr-1" /> Find Matches
          </Button>
        </div>
      </div>

      {/* Hospital not verified warning */}
      {hospitalProfile?.verificationStatus !== "verified" && (
        <Card className="mb-6 border-yellow-300 bg-yellow-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-800">Hospital Verification Pending</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Your hospital is awaiting admin verification. Some features may be limited until verification is complete.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Donors</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalDonors}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Recipients</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalRecipients}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending Review</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingReview}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Matches</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeMatches}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Completed</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completedProcedures}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white shadow-sm">
          <TabsTrigger value="overview" className="px-3">Overview</TabsTrigger>
          <TabsTrigger value="donors" className="px-3">Donors ({donors.length})</TabsTrigger>
          <TabsTrigger value="recipients" className="px-3">Recipients ({recipients.length})</TabsTrigger>
          <TabsTrigger value="matches" className="px-3">Matches ({activeMatches.length})</TabsTrigger>
          <TabsTrigger value="communication" className="px-3">Communication</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Pending verifications */}
          {(pendingDonors.length > 0 || pendingRecipients.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" /> Pending Verifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingDonors.slice(0, 3).map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <p className="font-medium text-sm">{d.fullName}</p>
                        <p className="text-xs text-gray-500">Donor • {d.bloodGroup} • {d.city}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedProfile(d); setSelectedProfileType("donor"); }}>
                          <Eye className="h-3 w-3 mr-1" /> Review
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pendingRecipients.slice(0, 3).map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <p className="font-medium text-sm">{r.patientName}</p>
                        <p className="text-xs text-gray-500">Recipient • {r.bloodGroup} • {r.requiredOrgan?.replace(/_/g, " ")}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedProfile(r); setSelectedProfileType("recipient"); }}>
                          <Eye className="h-3 w-3 mr-1" /> Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent matches */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" /> Recent Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeMatches.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No matches yet. Click "Find Matches" to run the matching engine.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeMatches.slice(0, 5).map((match: any) => (
                    <div key={match.id} className="border rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800 text-xs">{match.organType?.replace(/_/g, " ")}</Badge>
                          {match.matchScore && <Badge variant="outline" className="text-xs font-mono">{match.matchScore}%</Badge>}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {match.donor?.fullName || "Donor"} → {match.recipient?.patientName || "Recipient"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!match.approvedByHospital && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproveMatch(match.id)}>
                            Approve
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setSelectedMatchDetails(match)}>
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Donors Tab */}
        <TabsContent value="donors" className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search donors..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Pending */}
          {pendingDonors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" /> Pending Verification ({pendingDonors.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingDonors.filter(d => !searchQuery || d.fullName?.toLowerCase().includes(searchQuery.toLowerCase())).map((d: any) => (
                  <div key={d.id} className="border rounded-lg p-3 bg-yellow-50/30 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-medium text-sm">{d.fullName}</p>
                      <p className="text-xs text-gray-500">{d.bloodGroup} • Age: {d.age} • {d.city}, {d.state}</p>
                      <div className="flex gap-1 mt-1">
                        {(d.organs as string[])?.map((o: string) => (
                          <Badge key={o} variant="outline" className="text-[10px]">{o.replace(/_/g, " ")}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleVerifyProfile(d.id, "donor", "approve")}
                        disabled={verifyingId === d.id}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive"
                        onClick={() => handleVerifyProfile(d.id, "donor", "reject")}
                        disabled={verifyingId === d.id}>
                        <XCircle className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Verified */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> Verified Donors ({verifiedDonors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {verifiedDonors.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No verified donors yet</p>
              ) : (
                <div className="space-y-2">
                  {verifiedDonors.filter(d => !searchQuery || d.fullName?.toLowerCase().includes(searchQuery.toLowerCase())).map((d: any) => (
                    <div key={d.id} className="border rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{d.fullName}</p>
                        <p className="text-xs text-gray-500">{d.bloodGroup} • {(d.organs as string[])?.map((o: string) => o.replace(/_/g, " ")).join(", ")}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Verified</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recipients Tab */}
        <TabsContent value="recipients" className="space-y-4">
          {pendingRecipients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" /> Pending Verification ({pendingRecipients.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingRecipients.map((r: any) => (
                  <div key={r.id} className="border rounded-lg p-3 bg-yellow-50/30 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{r.patientName}</p>
                      <p className="text-xs text-gray-500">{r.bloodGroup} • {r.requiredOrgan?.replace(/_/g, " ")} • {r.priority} priority</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleVerifyProfile(r.id, "recipient", "approve")}
                        disabled={verifyingId === r.id}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive"
                        onClick={() => handleVerifyProfile(r.id, "recipient", "reject")}
                        disabled={verifyingId === r.id}>
                        <XCircle className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> Verified Recipients ({verifiedRecipients.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {verifiedRecipients.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No verified recipients yet</p>
              ) : (
                <div className="space-y-2">
                  {verifiedRecipients.map((r: any) => (
                    <div key={r.id} className="border rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{r.patientName}</p>
                        <p className="text-xs text-gray-500">{r.bloodGroup} • {r.requiredOrgan?.replace(/_/g, " ")} • {r.priority}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Verified</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Matches Tab */}
        <TabsContent value="matches" className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Matches within your hospital&apos;s pool only</p>
            <Button onClick={handleFindMatches} disabled={findingMatches} size="sm">
              <Zap className="h-4 w-4 mr-1" /> Run Matching
            </Button>
          </div>

          {activeMatches.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No matches yet</p>
                <p className="text-sm text-gray-400 mt-2">Run the matching engine to find compatible donors and recipients within your hospital.</p>
              </CardContent>
            </Card>
          ) : (
            activeMatches.map((match: any) => (
              <Card key={match.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-800">{match.organType?.replace(/_/g, " ")}</Badge>
                        {match.matchScore && (
                          <Badge variant="outline" className="font-mono text-sm">{match.matchScore}% compatibility</Badge>
                        )}
                        <Badge className={match.approvedByHospital ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                          {match.approvedByHospital ? "Approved" : "Pending Approval"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="border rounded-lg p-3 bg-blue-50/30">
                          <p className="text-xs text-gray-500 font-medium mb-1">DONOR</p>
                          <p className="text-sm font-semibold">{match.donor?.fullName || "—"}</p>
                          <p className="text-xs text-gray-500">{match.donor?.bloodGroup} • {match.donor?.city}</p>
                        </div>
                        <div className="border rounded-lg p-3 bg-green-50/30">
                          <p className="text-xs text-gray-500 font-medium mb-1">RECIPIENT</p>
                          <p className="text-sm font-semibold">{match.recipient?.patientName || "—"}</p>
                          <p className="text-xs text-gray-500">{match.recipient?.bloodGroup} • {match.recipient?.city}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>Donor: {match.donorAccepted ? "✅ Accepted" : "⏳ Pending"}</span>
                        <span>Recipient: {match.recipientAccepted ? "✅ Accepted" : "⏳ Pending"}</span>
                        {match.testScheduledDate && <span>Test: {new Date(match.testScheduledDate).toLocaleDateString()}</span>}
                        {match.procedureScheduledDate && <span>Procedure: {new Date(match.procedureScheduledDate).toLocaleDateString()}</span>}
                      </div>
                      {match.aiMatchExplanation && (
                        <div className="border rounded-lg p-2 bg-indigo-50/30 text-xs text-gray-600 mt-2">
                          <p className="font-medium text-indigo-700 mb-0.5">AI Analysis</p>
                          {match.aiMatchExplanation}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4 min-w-[120px]">
                      {!match.approvedByHospital && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 w-full" onClick={() => handleApproveMatch(match.id)}>
                          Approve
                        </Button>
                      )}
                      {match.approvedByHospital && match.donorAccepted && match.recipientAccepted && !match.testScheduledDate && (
                        scheduleMatchId === match.id && scheduleType === "test" ? (
                          <div className="flex flex-col gap-1 w-full">
                            <Label className="text-xs">Select Test Date</Label>
                            <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                              min={new Date().toISOString().split("T")[0]} className="text-xs" />
                            <div className="flex gap-1">
                              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                                disabled={!scheduleDate}
                                onClick={() => { handleSchedule(match.id, "test", new Date(scheduleDate).toISOString()); setScheduleMatchId(null); setScheduleDate(""); }}>
                                Confirm
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1 text-xs"
                                onClick={() => { setScheduleMatchId(null); setScheduleDate(""); }}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="w-full"
                            onClick={() => { setScheduleMatchId(match.id); setScheduleType("test"); setScheduleDate(""); }}>
                            <Calendar className="h-3 w-3 mr-1" /> Schedule Test
                          </Button>
                        )
                      )}
                      {match.testScheduledDate && !match.procedureScheduledDate && (
                        scheduleMatchId === match.id && scheduleType === "procedure" ? (
                          <div className="flex flex-col gap-1 w-full">
                            <Label className="text-xs">Select Procedure Date</Label>
                            <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                              min={new Date().toISOString().split("T")[0]} className="text-xs" />
                            <div className="flex gap-1">
                              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                                disabled={!scheduleDate}
                                onClick={() => { handleSchedule(match.id, "procedure", new Date(scheduleDate).toISOString()); setScheduleMatchId(null); setScheduleDate(""); }}>
                                Confirm
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1 text-xs"
                                onClick={() => { setScheduleMatchId(null); setScheduleDate(""); }}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="w-full"
                            onClick={() => { setScheduleMatchId(match.id); setScheduleType("procedure"); setScheduleDate(""); }}>
                            <Calendar className="h-3 w-3 mr-1" /> Schedule Procedure
                          </Button>
                        )
                      )}
                      {match.procedureScheduledDate && !match.completedAt && (
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 w-full"
                          onClick={async () => {
                            try {
                              const res = await fetch("/api/matches", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ matchId: match.id, action: "complete" }),
                              });
                              if (res.ok) {
                                toast.success("Procedure marked as complete!");
                                fetchDashboardData();
                              } else {
                                const data = await res.json();
                                toast.error(data.error || "Failed");
                              }
                            } catch { toast.error("Failed to complete"); }
                          }}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Mark Complete
                        </Button>
                      )}
                      {match.completedAt && (
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 w-full"
                          onClick={async () => {
                            try {
                              const res = await fetch("/api/pdf/consent", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ matchId: match.id }),
                              });
                              if (res.ok) {
                                const data = await res.json();
                                if (data.pdfUrl) {
                                  window.open(data.pdfUrl, "_blank");
                                  toast.success("Certificate generated!");
                                  fetchDashboardData();
                                }
                              } else {
                                const data = await res.json();
                                toast.error(data.error || "Failed to generate certificate");
                              }
                            } catch { toast.error("Failed to generate certificate"); }
                          }}>
                          <Download className="h-3 w-3 mr-1" /> Certificate
                        </Button>
                      )}
                      {match.status === "approved" && (
                        <Badge className="text-xs text-center bg-green-100 text-green-800">Active</Badge>
                      )}
                      {match.completedAt && (
                        <Badge className="text-xs text-center bg-purple-100 text-purple-800">Completed</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" /> Messages
              </CardTitle>
              <CardDescription>
                Communicate with registered donors and recipients. No direct donor-recipient messaging.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...donors, ...recipients].length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No registered users to message</p>
                  </div>
                ) : (
                  [...donors.map(d => ({ ...d, type: "donor", name: d.fullName })),
                   ...recipients.map(r => ({ ...r, type: "recipient", name: r.patientName }))]
                  .map((person: any) => (
                    <div key={person.id} className={`border rounded-lg p-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${chatUser?.id === person.id ? "border-blue-500 bg-blue-50" : ""}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${person.type === "donor" ? "bg-blue-100" : "bg-green-100"}`}>
                          <User className={`h-4 w-4 ${person.type === "donor" ? "text-blue-600" : "text-green-600"}`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{person.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{person.type} • {person.bloodGroup}</p>
                        </div>
                      </div>
                      <Button variant={chatUser?.id === person.id ? "default" : "outline"} size="sm" onClick={() => setChatUser(chatUser?.id === person.id ? null : person)}>
                        <MessageSquare className="h-3 w-3 mr-1" /> {chatUser?.id === person.id ? "Close" : "Message"}
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Chat box for selected user */}
              {chatUser && hospitalProfile && (
                <div className="mt-4">
                  <HospitalMessageBox
                    hospitalId={hospitalProfile.id}
                    hospitalName={hospitalProfile.hospitalName}
                    userId={chatUser.userId}
                    userRole={chatUser.type}
                    currentUserId={session?.user?.id || ""}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Profile Review Dialog */}
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Profile Review — {selectedProfileType === "donor" ? "Donor" : "Recipient"}</DialogTitle>
          </DialogHeader>
          {selectedProfile && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-medium">{selectedProfile.fullName || selectedProfile.patientName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Blood Group</p>
                  <p className="font-medium">{selectedProfile.bloodGroup}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Age</p>
                  <p className="font-medium">{selectedProfile.age}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="font-medium">{selectedProfile.city}, {selectedProfile.state}</p>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">Documents</p>
                {selectedProfileType === "donor" ? (
                  <>
                    {selectedProfile.aadhaarUrl && <a href={selectedProfile.aadhaarUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline block">View Aadhaar</a>}
                    {selectedProfile.medicalCertificateUrl && <a href={selectedProfile.medicalCertificateUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline block">View Medical Certificate</a>}
                    {selectedProfile.bloodGroupReport && <a href={selectedProfile.bloodGroupReport} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline block">View Blood Group Report</a>}
                  </>
                ) : (
                  <>
                    {selectedProfile.hospitalLetterUrl && <a href={selectedProfile.hospitalLetterUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline block">View Hospital Letter</a>}
                    {selectedProfile.medicalReportUrl && <a href={selectedProfile.medicalReportUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline block">View Medical Report</a>}
                    {selectedProfile.insuranceCardUrl && <a href={selectedProfile.insuranceCardUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline block">View Insurance Card</a>}
                    {selectedProfile.governmentIdUrl && <a href={selectedProfile.governmentIdUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline block">View Government ID</a>}
                  </>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleVerifyProfile(selectedProfile.id, selectedProfileType, "approve")}
                  disabled={verifyingId === selectedProfile.id}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button variant="destructive" className="flex-1"
                  onClick={() => handleVerifyProfile(selectedProfile.id, selectedProfileType, "reject")}
                  disabled={verifyingId === selectedProfile.id}>
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Match Details Dialog */}
      <Dialog open={!!selectedMatchDetails} onOpenChange={() => setSelectedMatchDetails(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-purple-500" />
              Match Details
            </DialogTitle>
          </DialogHeader>
          {selectedMatchDetails && (
            <div className="space-y-5">
              {/* Match Score & Status */}
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="bg-indigo-100 text-indigo-800">
                  {selectedMatchDetails.organType?.replace(/_/g, " ")}
                </Badge>
                <Badge variant="outline" className="font-mono">
                  {selectedMatchDetails.matchScore}% compatibility
                </Badge>
                <Badge className={
                  selectedMatchDetails.status === "completed" ? "bg-purple-100 text-purple-800" :
                  selectedMatchDetails.status === "approved" ? "bg-green-100 text-green-800" :
                  "bg-yellow-100 text-yellow-800"
                }>
                  {selectedMatchDetails.status}
                </Badge>
              </div>

              {/* Donor Info */}
              <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-semibold text-blue-600 uppercase mb-3">👤 Donor Information</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Full Name</p>
                    <p className="font-medium">{selectedMatchDetails.donor?.fullName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Age</p>
                    <p className="font-medium">{selectedMatchDetails.donor?.age || "—"} years</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Blood Group</p>
                    <p className="font-medium flex items-center gap-1">
                      <Droplets className="h-3 w-3 text-red-500" />
                      {selectedMatchDetails.donor?.bloodGroup || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      {selectedMatchDetails.donor?.city}, {selectedMatchDetails.donor?.state}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Organs Available</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(selectedMatchDetails.donor?.organs as string[] || []).map((organ: string) => (
                        <Badge key={organ} className="text-xs bg-blue-100 text-blue-700">{organ.replace(/_/g, " ")}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Availability</p>
                    <Badge className={selectedMatchDetails.donor?.availability === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                      {selectedMatchDetails.donor?.availability || "—"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Recipient Info */}
              <div className="bg-green-50/50 rounded-xl p-4 border border-green-100">
                <p className="text-xs font-semibold text-green-600 uppercase mb-3">🏥 Recipient Information</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Patient Name</p>
                    <p className="font-medium">{selectedMatchDetails.recipient?.patientName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Age</p>
                    <p className="font-medium">{selectedMatchDetails.recipient?.age || "—"} years</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Blood Group</p>
                    <p className="font-medium flex items-center gap-1">
                      <Droplets className="h-3 w-3 text-red-500" />
                      {selectedMatchDetails.recipient?.bloodGroup || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      {selectedMatchDetails.recipient?.city}, {selectedMatchDetails.recipient?.state}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Required Organ</p>
                    <Badge className="bg-pink-100 text-pink-800">
                      {selectedMatchDetails.recipient?.requiredOrgan?.replace(/_/g, " ") || "—"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Priority</p>
                    <Badge className={
                      selectedMatchDetails.recipient?.priority === "emergency" ? "bg-red-100 text-red-800" :
                      selectedMatchDetails.recipient?.priority === "high" ? "bg-orange-100 text-orange-800" :
                      "bg-gray-100 text-gray-700"
                    }>
                      {selectedMatchDetails.recipient?.priority === "emergency" && <Zap className="h-3 w-3 mr-1" />}
                      {selectedMatchDetails.recipient?.priority || "normal"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Match Progress */}
              <div className="bg-gray-50 rounded-xl p-4 border">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-3">📋 Match Progress</p>
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${selectedMatchDetails.approvedByHospital ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {selectedMatchDetails.approvedByHospital ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    Hospital Approval
                  </div>
                  <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${selectedMatchDetails.donorAccepted ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {selectedMatchDetails.donorAccepted ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    Donor Accepted
                  </div>
                  <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${selectedMatchDetails.recipientAccepted ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {selectedMatchDetails.recipientAccepted ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    Recipient Accepted
                  </div>
                  {selectedMatchDetails.testScheduledDate && (
                    <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-blue-50 text-blue-700">
                      <Calendar className="h-4 w-4" />
                      Test Scheduled: {new Date(selectedMatchDetails.testScheduledDate).toLocaleDateString()}
                    </div>
                  )}
                  {selectedMatchDetails.procedureScheduledDate && (
                    <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-purple-50 text-purple-700">
                      <Calendar className="h-4 w-4" />
                      Procedure: {new Date(selectedMatchDetails.procedureScheduledDate).toLocaleDateString()}
                    </div>
                  )}
                  {selectedMatchDetails.completedAt && (
                    <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-teal-50 text-teal-700">
                      <CheckCircle className="h-4 w-4" />
                      Completed: {new Date(selectedMatchDetails.completedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Match Score Breakdown */}
              <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
                <p className="text-xs font-semibold text-indigo-600 uppercase mb-2">📊 Score Breakdown</p>
                <p className="text-xs text-gray-500 mb-3">Matching is based on Blood Compatibility (30pts), Urgency (25pts), Location (15pts), Waiting Time (20pts), Verification (10pts)</p>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all"
                    style={{ width: `${selectedMatchDetails.matchScore}%` }}
                  />
                </div>
                <p className="text-right text-xs text-gray-500 mt-1">{selectedMatchDetails.matchScore}/100</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
