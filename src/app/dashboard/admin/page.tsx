"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Building2, Users, Heart, TrendingUp, Shield, CheckCircle, XCircle,
  Clock, AlertTriangle, Activity, BarChart3, Eye, Flag, Search,
  Droplets, MapPin, FileText, User, Calendar, Zap,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiFlags, setAiFlags] = useState<any[]>([]);
  const [loadingFlags, setLoadingFlags] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    try {
      const res = await fetch("/api/admin");
      if (!res.ok) {
        if (res.status === 403) {
          toast.error("Admin access required");
          router.push("/");
          return;
        }
        throw new Error("Failed to fetch");
      }
      const data = await res.json();
      setHospitals(data.hospitals || []);
      setDonors(data.donors || []);
      setRecipients(data.recipients || []);
      setAllMatches(data.matches || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyHospital(hospitalId: string, status: "verified" | "rejected") {
    setVerifyingId(hospitalId);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-hospital",
          hospitalId,
          status,
          notes: adminNotes,
        }),
      });
      if (res.ok) {
        toast.success(`Hospital ${status === "verified" ? "approved" : "rejected"}`);
        setAdminNotes("");
        fetchAdminData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Action failed");
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setVerifyingId(null);
    }
  }

  async function fetchAIFlags() {
    setLoadingFlags(true);
    try {
      const res = await fetch("/api/admin/flags");
      if (res.ok) {
        const data = await res.json();
        setAiFlags(data.flags || []);
        if (data.flags?.length > 0) {
          toast.success(`AI analyzed ${allMatches.length} matches — found ${data.flags.length} risk flags`);
        } else {
          toast.info("AI analysis complete — no risk flags detected");
        }
      } else {
        toast.error("Failed to run AI analysis");
      }
    } catch {
      toast.error("AI analysis failed");
    } finally {
      setLoadingFlags(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "matched": return "bg-blue-100 text-blue-800";
      case "approved": return "bg-green-100 text-green-800";
      case "completed": return "bg-purple-100 text-purple-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "emergency": return "bg-red-100 text-red-800 border-red-300";
      case "high": return "bg-orange-100 text-orange-800 border-orange-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  }

  const pendingHospitals = hospitals.filter(h => h.verificationStatus === "pending");
  const verifiedHospitals = hospitals.filter(h => h.verificationStatus === "verified");
  const rejectedHospitals = hospitals.filter(h => h.verificationStatus === "rejected");

  const navItems = [
    { label: "Overview", href: "/dashboard/admin", icon: <BarChart3 className="h-4 w-4" /> },
    { label: "Hospitals", href: "/dashboard/admin", icon: <Building2 className="h-4 w-4" />, badge: pendingHospitals.length },
    { label: "Users", href: "/dashboard/admin", icon: <Users className="h-4 w-4" />, badge: donors.length + recipients.length },
    { label: "Matches", href: "/dashboard/admin", icon: <Heart className="h-4 w-4" />, badge: allMatches.length },
    { label: "Monitoring", href: "/dashboard/admin", icon: <Activity className="h-4 w-4" /> },
    { label: "Flags", href: "/dashboard/admin", icon: <Flag className="h-4 w-4" />, badge: aiFlags.length },
  ];

  if (loading) {
    return (
      <DashboardLayout role="admin" userName="Admin" userEmail={(session?.user as any)?.email || ""} navItems={navItems}>
        <div className="flex items-center justify-center h-64">
          <Activity className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="admin"
      userName={(session?.user as any)?.name || "Admin"}
      userEmail={(session?.user as any)?.email || ""}
      navItems={navItems}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Verified Hospitals</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.verifiedHospitals || 0}</p>
              </div>
              <Building2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingHospitals || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Matches</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeMatches || 0}</p>
              </div>
              <Heart className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Completed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completedMatches || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-teal-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="hospitals" className="space-y-4">
        <TabsList className="bg-white shadow-sm flex-wrap">
          <TabsTrigger value="hospitals" className="px-4">Hospitals ({hospitals.length})</TabsTrigger>
          <TabsTrigger value="users" className="px-4">Users ({donors.length + recipients.length})</TabsTrigger>
          <TabsTrigger value="matches" className="px-4">Matches ({allMatches.length})</TabsTrigger>
          <TabsTrigger value="monitoring" className="px-4">Monitoring</TabsTrigger>
          <TabsTrigger value="flags" className="px-4">
            Flags {aiFlags.length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{aiFlags.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ========== HOSPITALS TAB ========== */}
        <TabsContent value="hospitals" className="space-y-4">
          {pendingHospitals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Pending Verification ({pendingHospitals.length})
                </CardTitle>
                <CardDescription>Review and approve hospital registrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingHospitals.map((hospital) => (
                  <div key={hospital.id} className="border rounded-xl p-4 bg-yellow-50/30">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-gray-900">{hospital.hospitalName}</h3>
                        <p className="text-sm text-gray-600">
                          Reg: {hospital.registrationNumber} | {hospital.city}, {hospital.state}
                        </p>
                        <p className="text-sm text-gray-500">
                          Coordinator: {hospital.coordinatorName} ({hospital.coordinatorEmail})
                        </p>
                        <p className="text-xs text-gray-400">
                          Registered: {new Date(hospital.createdAt).toLocaleDateString()}
                        </p>
                        {hospital.licenseDocUrl && (
                          <a href={hospital.licenseDocUrl} target="_blank" rel="noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                            <Eye className="h-3 w-3" /> View License Document
                          </a>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 min-w-[120px]">
                        <Input
                          placeholder="Admin notes..."
                          value={verifyingId === hospital.id ? adminNotes : ""}
                          onChange={(e) => {
                            setVerifyingId(hospital.id);
                            setAdminNotes(e.target.value);
                          }}
                          className="text-xs"
                        />
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 w-full"
                          onClick={() => handleVerifyHospital(hospital.id, "verified")}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="w-full"
                          onClick={() => handleVerifyHospital(hospital.id, "rejected")}>
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Verified Hospitals ({verifiedHospitals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {verifiedHospitals.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No verified hospitals yet</p>
              ) : (
                <div className="space-y-3">
                  {verifiedHospitals.map((hospital) => (
                    <div key={hospital.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <p className="font-medium text-gray-900">{hospital.hospitalName}</p>
                        <p className="text-sm text-gray-500">{hospital.city}, {hospital.state}</p>
                        <p className="text-xs text-gray-400">Coordinator: {hospital.coordinatorName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">Verified</Badge>
                        {hospital.hospitalCode && (
                          <Badge variant="outline" className="font-mono text-xs">{hospital.hospitalCode}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {rejectedHospitals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <XCircle className="h-5 w-5 text-red-500" />
                  Rejected ({rejectedHospitals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rejectedHospitals.map((hospital) => (
                    <div key={hospital.id} className="flex items-center justify-between border rounded-lg p-3 bg-red-50/30">
                      <div>
                        <p className="font-medium text-gray-900">{hospital.hospitalName}</p>
                        <p className="text-sm text-gray-500">{hospital.city}, {hospital.state}</p>
                        {hospital.adminNotes && (
                          <p className="text-xs text-red-600 mt-1">Reason: {hospital.adminNotes}</p>
                        )}
                      </div>
                      <Badge variant="destructive">Rejected</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ========== USERS TAB ========== */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search donors or recipients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Donors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="h-5 w-5 text-blue-500" />
                Donors ({donors.length})
              </CardTitle>
              <CardDescription>All registered donors across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {donors.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No donors registered yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-medium text-gray-600">Name</th>
                        <th className="text-left p-3 font-medium text-gray-600">Email</th>
                        <th className="text-left p-3 font-medium text-gray-600">Blood</th>
                        <th className="text-left p-3 font-medium text-gray-600">Organs</th>
                        <th className="text-left p-3 font-medium text-gray-600">Location</th>
                        <th className="text-left p-3 font-medium text-gray-600">Status</th>
                        <th className="text-left p-3 font-medium text-gray-600">Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donors
                        .filter(d => !searchQuery ||
                          d.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.city?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((donor) => (
                        <tr key={donor.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-3 font-medium">{donor.fullName}</td>
                          <td className="p-3 text-gray-500">{donor.user?.email || "—"}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="font-mono">
                              <Droplets className="h-3 w-3 mr-1 text-red-500" />
                              {donor.bloodGroup}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {(donor.organs as string[] || []).map((organ: string) => (
                                <Badge key={organ} className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  {organ.replace(/_/g, " ")}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {donor.city}, {donor.state}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <Badge className={donor.documentsVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                {donor.documentsVerified ? "Verified" : "Pending"}
                              </Badge>
                              <Badge className={donor.availability === "active" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}>
                                {donor.availability}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-3 text-gray-400 text-xs">{new Date(donor.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-green-500" />
                Recipients ({recipients.length})
              </CardTitle>
              <CardDescription>All registered recipients across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {recipients.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No recipients registered yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-medium text-gray-600">Patient Name</th>
                        <th className="text-left p-3 font-medium text-gray-600">Email</th>
                        <th className="text-left p-3 font-medium text-gray-600">Blood</th>
                        <th className="text-left p-3 font-medium text-gray-600">Required Organ</th>
                        <th className="text-left p-3 font-medium text-gray-600">Priority</th>
                        <th className="text-left p-3 font-medium text-gray-600">Location</th>
                        <th className="text-left p-3 font-medium text-gray-600">Status</th>
                        <th className="text-left p-3 font-medium text-gray-600">Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipients
                        .filter(r => !searchQuery ||
                          r.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.city?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((recipient) => (
                        <tr key={recipient.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-3 font-medium">{recipient.patientName}</td>
                          <td className="p-3 text-gray-500">{recipient.user?.email || "—"}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="font-mono">
                              <Droplets className="h-3 w-3 mr-1 text-red-500" />
                              {recipient.bloodGroup}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge className="bg-pink-50 text-pink-700 border-pink-200">
                              {recipient.requiredOrgan?.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={getPriorityColor(recipient.priority)}>
                              {recipient.priority === "emergency" && <Zap className="h-3 w-3 mr-1" />}
                              {recipient.priority}
                            </Badge>
                          </td>
                          <td className="p-3 text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {recipient.city}, {recipient.state}
                            </span>
                          </td>
                          <td className="p-3">
                            <Badge className={recipient.documentsVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                              {recipient.documentsVerified ? "Verified" : "Pending"}
                            </Badge>
                          </td>
                          <td className="p-3 text-gray-400 text-xs">{new Date(recipient.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== MATCHES TAB ========== */}
        <TabsContent value="matches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="h-5 w-5 text-purple-500" />
                All Matches ({allMatches.length})
              </CardTitle>
              <CardDescription>Complete match pipeline across all hospitals</CardDescription>
            </CardHeader>
            <CardContent>
              {allMatches.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No matches found yet</p>
                  <p className="text-sm text-gray-400 mt-2">Matches will appear here once hospitals run the matching engine</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allMatches.map((match) => (
                    <div key={match.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* Match Header */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge className="bg-indigo-50 text-indigo-700">
                              {match.organType?.replace(/_/g, " ")}
                            </Badge>
                            <span className="text-sm font-semibold text-gray-700">
                              {match.matchScore}% compatibility
                            </span>
                            <Badge className={getStatusColor(match.status)}>
                              {match.status}
                            </Badge>
                          </div>

                          {/* Donor & Recipient */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50/50 rounded-lg p-3">
                              <p className="text-xs font-medium text-blue-600 uppercase mb-1">Donor</p>
                              <p className="font-semibold text-gray-900">{match.donor?.fullName || "—"}</p>
                              <p className="text-xs text-gray-500">
                                {match.donor?.bloodGroup} • {match.donor?.city}
                              </p>
                            </div>
                            <div className="bg-green-50/50 rounded-lg p-3">
                              <p className="text-xs font-medium text-green-600 uppercase mb-1">Recipient</p>
                              <p className="font-semibold text-gray-900">{match.recipient?.patientName || "—"}</p>
                              <p className="text-xs text-gray-500">
                                {match.recipient?.bloodGroup} • {match.recipient?.city}
                                {match.recipient?.priority === "emergency" && (
                                  <Badge className="ml-1 bg-red-100 text-red-800 text-xs py-0">Emergency</Badge>
                                )}
                              </p>
                            </div>
                            <div className="bg-purple-50/50 rounded-lg p-3">
                              <p className="text-xs font-medium text-purple-600 uppercase mb-1">Hospital</p>
                              <p className="font-semibold text-gray-900">{match.hospital?.hospitalName || "—"}</p>
                              <p className="text-xs text-gray-500">{match.hospital?.city || "—"}</p>
                            </div>
                          </div>

                          {/* Match Progress */}
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className={`px-2 py-0.5 rounded-full ${match.approvedByHospital ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                              {match.approvedByHospital ? "✅ Hospital Approved" : "⏳ Awaiting Approval"}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full ${match.donorAccepted ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                              {match.donorAccepted ? "✅ Donor Accepted" : "⏳ Donor Pending"}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full ${match.recipientAccepted ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                              {match.recipientAccepted ? "✅ Recipient Accepted" : "⏳ Recipient Pending"}
                            </span>
                            {match.testScheduledDate && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                🧪 Test: {new Date(match.testScheduledDate).toLocaleDateString()}
                              </span>
                            )}
                            {match.procedureScheduledDate && (
                              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                🏥 Procedure: {new Date(match.procedureScheduledDate).toLocaleDateString()}
                              </span>
                            )}
                            {match.completedAt && (
                              <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                                ✅ Completed: {new Date(match.completedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== MONITORING TAB ========== */}
        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>System Monitoring</CardTitle>
              <CardDescription>Platform health and statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4 text-center bg-gradient-to-b from-blue-50 to-white">
                  <Droplets className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900">{stats.totalDonors || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Total Donors</p>
                </div>
                <div className="border rounded-lg p-4 text-center bg-gradient-to-b from-green-50 to-white">
                  <User className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900">{stats.totalRecipients || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Total Recipients</p>
                </div>
                <div className="border rounded-lg p-4 text-center bg-gradient-to-b from-purple-50 to-white">
                  <Heart className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900">{stats.totalMatches || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Total Matches</p>
                </div>
                <div className="border rounded-lg p-4 text-center bg-gradient-to-b from-indigo-50 to-white">
                  <Building2 className="h-6 w-6 text-indigo-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-gray-900">{stats.totalHospitals || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Total Hospitals</p>
                </div>
              </div>

              {/* Match Pipeline */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Match Pipeline</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{allMatches.filter(m => m.status === "matched").length}</p>
                    <p className="text-xs text-gray-500">Matched</p>
                  </div>
                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{allMatches.filter(m => m.status === "approved").length}</p>
                    <p className="text-xs text-gray-500">Approved</p>
                  </div>
                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-600">{allMatches.filter(m => m.status === "completed").length}</p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                  <div className="border rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{allMatches.filter(m => m.status === "cancelled" || m.status === "rejected").length}</p>
                    <p className="text-xs text-gray-500">Cancelled/Rejected</p>
                  </div>
                </div>
              </div>

              {/* Organ Distribution */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Organ Type Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {["kidney", "partial_liver", "bone_marrow", "blood_whole", "blood_plasma"].map(organ => {
                    const count = allMatches.filter(m => m.organType === organ).length;
                    const donorCount = donors.filter(d => (d.organs as string[] || []).includes(organ)).length;
                    return (
                      <div key={organ} className="border rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500 capitalize">{organ.replace(/_/g, " ")}</p>
                        <p className="text-lg font-bold text-gray-800">{count} <span className="text-xs font-normal text-gray-400">matches</span></p>
                        <p className="text-xs text-blue-500">{donorCount} donors</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== FLAGS TAB ========== */}
        <TabsContent value="flags">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    AI Risk Alerts
                  </CardTitle>
                  <CardDescription>
                    OpenAI-powered analysis of matches for organ trafficking, fraud, and compliance risks
                  </CardDescription>
                </div>
                <Button
                  onClick={fetchAIFlags}
                  disabled={loadingFlags}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {loadingFlags ? (
                    <><Activity className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Zap className="h-4 w-4 mr-2" /> Run AI Scan</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiFlags.length === 0 && !loadingFlags ? (
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No risk flags detected</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Click "Run AI Scan" to analyze all matches for suspicious patterns using OpenAI GPT
                  </p>
                </div>
              ) : loadingFlags ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-indigo-500 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600 font-medium">AI is analyzing your matches...</p>
                  <p className="text-sm text-gray-400 mt-2">This may take a few seconds</p>
                </div>
              ) : (
                aiFlags.map((flag) => (
                  <div key={flag.id} className={`border rounded-xl p-4 ${
                    flag.severity === "high" ? "border-red-200 bg-red-50/30" :
                    flag.severity === "medium" ? "border-orange-200 bg-orange-50/30" :
                    "border-yellow-200 bg-yellow-50/30"
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={
                            flag.severity === "high" ? "bg-red-100 text-red-800" :
                            flag.severity === "medium" ? "bg-orange-100 text-orange-800" :
                            "bg-yellow-100 text-yellow-800"
                          }>
                            {flag.severity === "high" && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {flag.severity.toUpperCase()} RISK
                          </Badge>
                          <Badge variant="outline" className="font-mono text-xs">
                            Risk Score: {flag.riskScore}/100
                          </Badge>
                          <Badge className="bg-indigo-50 text-indigo-700">
                            {flag.organType?.replace(/_/g, " ")}
                          </Badge>
                        </div>

                        {/* Match info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="bg-white/70 rounded-lg p-2 border">
                            <p className="text-xs text-blue-600 font-medium">DONOR</p>
                            <p className="text-sm font-semibold">{flag.donorName}</p>
                          </div>
                          <div className="bg-white/70 rounded-lg p-2 border">
                            <p className="text-xs text-green-600 font-medium">RECIPIENT</p>
                            <p className="text-sm font-semibold">{flag.recipientName}</p>
                          </div>
                        </div>

                        {/* AI Explanation */}
                        <div className="bg-white/50 rounded-lg p-3 border border-dashed">
                          <p className="text-xs font-medium text-gray-500 mb-1">🤖 AI Analysis:</p>
                          <p className="text-sm text-gray-700">{flag.explanation}</p>
                        </div>

                        {/* Individual flags */}
                        {flag.riskFlags && flag.riskFlags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {flag.riskFlags.map((rf: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs bg-white/70">
                                ⚠️ {rf}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>Hospital: {flag.hospitalName}</span>
                          <span>Match: {flag.matchId?.slice(0, 8)}...</span>
                          <span>Compatibility: {flag.matchScore}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              <div className="border-t pt-4 mt-4">
                <p className="text-xs text-gray-400 text-center">
                  🤖 Powered by OpenAI GPT — analyzes donor age, registration patterns, location anomalies, and organ trafficking indicators
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
