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
  Building2,
  Users,
  Heart,
  TrendingUp,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Activity,
  BarChart3,
  Eye,
  Flag,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
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

  const pendingHospitals = hospitals.filter(h => h.verificationStatus === "pending");
  const verifiedHospitals = hospitals.filter(h => h.verificationStatus === "verified");
  const rejectedHospitals = hospitals.filter(h => h.verificationStatus === "rejected");

  const navItems = [
    { label: "Overview", href: "/dashboard/admin", icon: <BarChart3 className="h-4 w-4" /> },
    { label: "Hospitals", href: "/dashboard/admin", icon: <Building2 className="h-4 w-4" />, badge: pendingHospitals.length },
    { label: "Monitoring", href: "/dashboard/admin", icon: <Activity className="h-4 w-4" /> },
    { label: "Flags", href: "/dashboard/admin", icon: <Flag className="h-4 w-4" /> },
  ];

  if (loading) {
    return (
      <DashboardLayout
        role="admin"
        userName="Admin"
        userEmail={(session?.user as any)?.email || ""}
        navItems={navItems}
      >
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalMatches || 0}</p>
              </div>
              <Heart className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="hospitals" className="space-y-4">
        <TabsList className="bg-white shadow-sm">
          <TabsTrigger value="hospitals" className="px-4">
            Hospitals ({hospitals.length})
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="px-4">Monitoring</TabsTrigger>
          <TabsTrigger value="flags" className="px-4">Flags</TabsTrigger>
        </TabsList>

        {/* Hospitals Tab */}
        <TabsContent value="hospitals" className="space-y-4">
          {/* Pending Hospitals */}
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
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 w-full"
                          onClick={() => handleVerifyHospital(hospital.id, "verified")}
                          disabled={verifyingId === hospital.id && verifyingId !== hospital.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full"
                          onClick={() => handleVerifyHospital(hospital.id, "rejected")}
                          disabled={verifyingId === hospital.id && verifyingId !== hospital.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Verified Hospitals */}
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

          {/* Rejected */}
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

        {/* Monitoring Tab */}
        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>System Monitoring</CardTitle>
              <CardDescription>Platform health and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-gray-900">{stats.totalDonors || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Total Donors</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-gray-900">{stats.totalRecipients || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Total Recipients</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-gray-900">{stats.totalMatches || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Total Matches</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-gray-900">{stats.totalHospitals || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Total Hospitals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flags Tab */}
        <TabsContent value="flags">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                AI Risk Alerts
              </CardTitle>
              <CardDescription>
                Suspicious patterns detected by AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No flags currently. AI risk alerts will appear here.</p>
                <p className="text-sm text-gray-400 mt-2">
                  {process.env.NEXT_PUBLIC_OPENAI_CONFIGURED
                    ? "AI monitoring is active"
                    : "Add OPENAI_API_KEY to .env file to enable AI risk detection"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
