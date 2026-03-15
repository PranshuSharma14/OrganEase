"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Timeline, { generateTimelineSteps } from "@/components/Timeline";
import {
  Heart,
  User,
  Clock,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  FileText,
  Bell,
  Activity,
  Calendar,
  TrendingUp,
  Edit,
  Trash2,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOut } from "next-auth/react";
import ChatBox from "@/components/ChatBox";

export default function RecipientDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [chatMatchId, setChatMatchId] = useState<string | null>(null);
  const [acceptingMatch, setAcceptingMatch] = useState<string | null>(null);

  // Fetch dashboard data once on mount. Do not re-fetch when `session` changes
  // (avoids the profile/email switching if session is updated in another tab).
  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep session email in sync separately, but don't re-run the main fetch.
  useEffect(() => {
    if (session?.user?.email) {
      setUserEmail(session.user.email);
    }
  }, [session]);

  // Auto-refresh dashboard data periodically and when window regains focus
  useEffect(() => {
    // Refresh every 10 seconds to catch hospital approvals more quickly
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000);

    // Refresh when window regains focus
    const handleFocus = () => {
      fetchDashboardData();
    };
    window.addEventListener('focus', handleFocus);

    // Refresh when receiving a notification (via storage event for cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'organease-refresh') {
        fetchDashboardData();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom refresh event (for same-tab updates)
    const handleRefreshEvent = () => {
      fetchDashboardData();
    };
    window.addEventListener('organease-refresh', handleRefreshEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('organease-refresh', handleRefreshEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const viewDocument = (url: string) => {
    if (!url) {
      toast.error("Document not available");
      return;
    }
    window.open(url, '_blank');
  };

  const fetchDashboardData = async () => {
    try {
      // First fetch profile to get the recipient profile ID
      const profileRes = await fetch("/api/profile?role=recipient");
      const profileData = await profileRes.json();

      // If no profile data (empty object or no required fields), redirect to onboarding
      if (!profileData || !profileData.id || !profileData.patientName) {
        toast.info("Please complete your profile first");
        router.push("/onboarding/recipient");
        return;
      }

      // Now fetch matches and notifications using the profile ID
      const [matchesRes, notificationsRes] = await Promise.all([
        fetch(`/api/matches?userId=${profileData.id}`),
        fetch("/api/notifications"),
      ]);

      const matchesData = await matchesRes.json();
      const notificationsData = await notificationsRes.json();
      
      console.log('Raw matches data from API:', {
        matchesCount: matchesData.matches?.length || matchesData.length || 0,
        matches: (matchesData.matches || matchesData || []).map((m: any) => ({
          id: m.id,
          approvedByHospital: m.approvedByHospital,
          type: typeof m.approvedByHospital,
          donorAccepted: m.donorAccepted,
          recipientAccepted: m.recipientAccepted,
        }))
      });

      setProfile(profileData);
      // Ensure approvedByHospital is properly converted to boolean
      const processedMatches = (matchesData.matches || matchesData || []).map((match: any) => {
        // Simple and robust boolean conversion - handle all possible values
        const approvedByHospital = match.approvedByHospital === true || match.approvedByHospital === "true" || match.approvedByHospital === 1 || match.approvedByHospital === "1" || match.approvedByHospital === true;
        const donorAccepted = match.donorAccepted === true || match.donorAccepted === "true" || match.donorAccepted === 1 || match.donorAccepted === "1" || match.donorAccepted === true;
        const recipientAccepted = match.recipientAccepted === true || match.recipientAccepted === "true" || match.recipientAccepted === 1 || match.recipientAccepted === "1" || match.recipientAccepted === true;
        
        const processed = {
          ...match,
          approvedByHospital: !!approvedByHospital,
          donorAccepted: !!donorAccepted,
          recipientAccepted: !!recipientAccepted,
        };
        // Debug logging
        console.log('Processed match:', {
          id: processed.id,
          approvedByHospital: processed.approvedByHospital,
          type: typeof processed.approvedByHospital,
          donorAccepted: processed.donorAccepted,
          recipientAccepted: processed.recipientAccepted,
          original: {
            approvedByHospital: match.approvedByHospital,
            type: typeof match.approvedByHospital,
            donorAccepted: match.donorAccepted,
            recipientAccepted: match.recipientAccepted,
          }
        });
        return processed;
      });
      console.log('Setting matches state:', processedMatches.map((m: any) => ({ id: m.id, approved: m.approvedByHospital })));
      setMatches(processedMatches);
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  function openEditDialog() {
    // Only allow editing fields that donors will see after hospital approval
    setEditForm({
      patientName: profile?.patientName || "",
      age: profile?.age || "",
      bloodGroup: profile?.bloodGroup || "",
      requiredOrgan: profile?.requiredOrgan || "",
      city: profile?.city || "",
      state: profile?.state || "",
      priority: profile?.priority || "",
    });
    setIsEditDialogOpen(true);
  }

  async function handleEditSubmit() {
    // No phone/hospital/doctor validations here — only editing visible match fields
    
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

  async function handleAcceptMatch(matchId: string) {
    setAcceptingMatch(matchId);
    try {
      const response = await fetch("/api/matches/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, accepted: true }),
      });

      if (response.ok) {
        toast.success("Match accepted! You can now chat with the donor.");
        fetchDashboardData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to accept match");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setAcceptingMatch(null);
    }
  }

  function openChat(matchId: string) {
    setChatMatchId(matchId);
    setShowChatDialog(true);
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      verified: "bg-blue-100 text-blue-800",
      matched: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getUrgencyBadge = (level: string) => {
    const variants: Record<string, any> = {
      emergency: { variant: "destructive", label: "EMERGENCY" },
      high: { variant: "default", label: "HIGH" },
      normal: { variant: "secondary", label: "NORMAL" },
    };
    const config = variants[level] || variants.normal;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">      {/* Navigation Bar */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Heart className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold">OrganEase - Recipient</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{profile?.patientName || "User"}</p>
                    <p className="text-xs text-gray-500">{profile?.email || ""}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/auth/signin" })}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Recipient Dashboard</h1>
          <p className="text-gray-600">Track your profile, matches, and communications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Profile Status</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {profile?.documentsVerified ? "Verified" : "Pending"}
                  </p>
                </div>
                <CheckCircle className={`h-10 w-10 ${profile?.documentsVerified ? "text-green-600" : "text-yellow-600"}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Matches</p>
                  <p className="text-3xl font-bold text-gray-900">{matches.length}</p>
                </div>
                <Heart className="h-10 w-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Verified Donors</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {matches.filter(m => m.documentsVerified).length}
                  </p>
                </div>
                <Activity className="h-10 w-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Lives Impacted</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {matches.filter(m => m.status === 'completed').length}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white p-1 shadow-sm">
            <TabsTrigger value="overview" className="px-6">Overview</TabsTrigger>
            <TabsTrigger value="matches" className="px-6">
              Matches ({matches.length})
            </TabsTrigger>
            <TabsTrigger value="notifications" className="px-6">
              Notifications ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="documents" className="px-6">Documents</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-red-600" />
                    Your Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profile ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback className="bg-red-100 text-red-600 text-xl">
                            {profile.patientName?.[0] || "R"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold">{profile.patientName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getStatusColor(profile.requestStatus || "pending")}>
                              {profile.documentsVerified ? "Verified" : "Pending"}
                            </Badge>
                            {getUrgencyBadge(profile.priority || "normal")}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <Heart className="h-4 w-4 text-red-600" />
                          <span className="font-medium">Organ Needed:</span>
                          <span className="text-gray-600">{profile.requiredOrgan}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Activity className="h-4 w-4 text-red-600" />
                          <span className="font-medium">Blood Group:</span>
                          <span className="text-gray-600">{profile.bloodGroup}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-red-600" />
                          <span className="font-medium">Location:</span>
                          <span className="text-gray-600">{profile.city}, {profile.state}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-red-600" />
                          <span className="font-medium">Age:</span>
                          <span className="text-gray-600">{profile.age} years</span>
                        </div>
                      </div>

                      {profile.email && (
                        <div className="pt-4 border-t">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-red-600" />
                            <span className="font-medium">Email:</span>
                            <span className="text-gray-600">{profile.email}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" className="flex-1" onClick={openEditDialog}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                        <Button variant="destructive" className="flex-1" onClick={() => setIsDeleteDialogOpen(true)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Profile
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No profile found</p>
                      <Button onClick={() => window.location.href = "/onboarding/recipient"}>
                        Complete Your Profile
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-red-600" />
                      Request Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {matches.length > 0 ? (() => {
                      // Find approved match or use first match
                      const selectedMatch = matches.find((m: any) => m.approvedByHospital === true) || matches[0];
                      console.log('Timeline match selected:', {
                        matchId: selectedMatch?.id,
                        approvedByHospital: selectedMatch?.approvedByHospital,
                        type: typeof selectedMatch?.approvedByHospital,
                        allMatches: matches.map((m: any) => ({ id: m.id, approved: m.approvedByHospital }))
                      });
                      return <Timeline key={selectedMatch?.id || 'default'} steps={generateTimelineSteps(selectedMatch)} />;
                    })() : (
                      <Timeline
                        steps={[
                          { title: "Profile Created", description: "Your profile is active", status: "completed", date: new Date(profile.createdAt).toLocaleDateString() },
                          { title: "Waiting for Match", description: "Looking for compatible donors", status: "current" },
                        ]}
                      />
                    )}
                    <div className="mt-4 text-sm text-gray-600">
                      {!profile?.documentsVerified && (
                        <p className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Awaiting hospital verification
                        </p>
                      )}
                      {profile?.documentsVerified && matches.length === 0 && (
                        <p className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Searching for compatible donors...
                        </p>
                      )}
                      {profile?.documentsVerified && matches.length > 0 && (
                        <p className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          {matches.length} compatible donor(s) found!
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bell className="h-5 w-5 text-red-600" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {notifications.slice(0, 3).map((notif) => (
                      <div key={notif.id} className="mb-4 pb-4 border-b last:border-0 last:mb-0 last:pb-0">
                        <p className="font-medium text-sm text-gray-900">{notif.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <p className="text-sm text-gray-500">No recent activity</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Potential Donor Matches</CardTitle>
                <CardDescription>
                  Donors who match your requirements and have been verified by hospitals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matches.length > 0 ? (
                  <div className="space-y-4">
                    {matches.map((match) => (
                      <Card key={match.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-green-100 text-green-600">
                                  {match.fullName?.[0] || 'D'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">{match.fullName || 'Anonymous Donor'}</h3>
                                  <Badge className="bg-green-100 text-green-800">
                                    {match.documentsVerified ? 'Verified' : 'Pending'}
                                  </Badge>
                                  <Badge variant="outline">
                                    Compatible
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <Activity className="h-3 w-3" />
                                    Blood: {match.bloodGroup}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {match.city}, {match.state}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    Age: {match.age} years
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Heart className="h-3 w-3" />
                                    Organs: {Array.isArray(match.organs) ? match.organs.join(', ') : match.organs}
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
                                      You Accepted
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              {(() => {
                                const isApproved = !!(match.approvedByHospital === true || match.approvedByHospital === "true" || match.approvedByHospital === 1 || match.approvedByHospital === "1");
                                const isRecipientAccepted = !!(match.recipientAccepted === true || match.recipientAccepted === "true" || match.recipientAccepted === 1 || match.recipientAccepted === "1");
                                return isApproved && !isRecipientAccepted ? (
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => handleAcceptMatch(match.matchId || match.id)}
                                    disabled={acceptingMatch === match.id}
                                  >
                                    {acceptingMatch === match.id ? "Accepting..." : "Accept Match"}
                                  </Button>
                                ) : null;
                              })()}
                              
                              {/* Show chat button after hospital approval - chat works immediately */}
                              {(() => {
                                const isApproved = !!(match.approvedByHospital === true || match.approvedByHospital === "true" || match.approvedByHospital === 1 || match.approvedByHospital === "1");
                                console.log('Chat button check:', {
                                  matchId: match.id,
                                  approvedByHospital: match.approvedByHospital,
                                  type: typeof match.approvedByHospital,
                                  isApproved,
                                  willShow: isApproved
                                });
                                return isApproved ? (
                                  <Button 
                                    size="sm" 
                                    onClick={() => openChat(match.matchId || match.id)}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    Chat with Donor
                                  </Button>
                                ) : null;
                              })()}
                              
                              {(() => {
                                const isApproved = !!(match.approvedByHospital === true || match.approvedByHospital === "true" || match.approvedByHospital === 1 || match.approvedByHospital === "1");
                                return !isApproved ? (
                                  <Button size="sm" variant="secondary" disabled>
                                    Awaiting Hospital
                                  </Button>
                                ) : null;
                              })()}
                              
                              <Button size="sm" variant="outline" onClick={() => setSelectedMatch(match)}>
                                View Details
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches yet</h3>
                    <p className="text-gray-600 mb-4">
                      We're actively searching for compatible donors. You'll be notified when matches are found.
                    </p>
                    <Badge variant="secondary">Matching system is running 24/7</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Stay updated with your request journey</CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600">No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{notif.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          {!notif.read && (
                            <Badge variant="default" className="ml-4">New</Badge>
                          )}
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
                <CardTitle>Your Documents</CardTitle>
                <CardDescription>Uploaded verification and medical documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile?.medicalReportUrl ? (
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-medium">Medical Reports</p>
                          <p className="text-sm text-gray-600">Uploaded</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => viewDocument(profile.medicalReportUrl)}>View</Button>
                    </div>
                  ) : null}
                  {profile?.hospitalLetterUrl ? (
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-medium">Doctor's Referral Letter</p>
                          <p className="text-sm text-gray-600">Uploaded</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => viewDocument(profile.hospitalLetterUrl)}>View</Button>
                    </div>
                  ) : null}
                  {profile?.insuranceCardUrl ? (
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-medium">Insurance Card</p>
                          <p className="text-sm text-gray-600">Uploaded</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => viewDocument(profile.insuranceCardUrl)}>View</Button>
                    </div>
                  ) : null}
                  {profile?.governmentIdUrl ? (
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-medium">Government ID</p>
                          <p className="text-sm text-gray-600">Uploaded</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => viewDocument(profile.governmentIdUrl)}>View</Button>
                    </div>
                  ) : null}
                  {!profile?.medicalReportUrl && !profile?.hospitalLetterUrl && !profile?.insuranceCardUrl && !profile?.governmentIdUrl && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No documents uploaded yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Match Details Modal */}
      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Donor Details</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-green-100 text-green-600 text-2xl">
                    {selectedMatch.fullName?.[0] || 'D'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedMatch.fullName || 'Anonymous Donor'}</h3>
                  <Badge className="bg-green-100 text-green-800">
                    {selectedMatch.documentsVerified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600">Blood Group</p>
                  <p className="font-medium">{selectedMatch.bloodGroup}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Age</p>
                  <p className="font-medium">{selectedMatch.age} years</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">{selectedMatch.city}, {selectedMatch.state}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Availability</p>
                  <p className="font-medium capitalize">{selectedMatch.availability}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Organs Available for Donation</p>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(selectedMatch.organs) && selectedMatch.organs.map((organ: string) => (
                    <Badge key={organ} variant="secondary" className="capitalize">
                      {organ.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedMatch.email && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">Contact Email</p>
                  <p className="font-medium">{selectedMatch.email}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Emergency Available</p>
                <p className="font-medium">{selectedMatch.emergencyAvailable ? 'Yes' : 'No'}</p>
              </div>

              <div className="pt-4 border-t text-sm text-gray-500">
                <p>Contact information is shared only between verified matches for privacy and security.</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patientName">Patient Name</Label>
                <Input
                  id="patientName"
                  value={editForm.patientName || ""}
                  onChange={(e) => setEditForm({ ...editForm, patientName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={editForm.age || ""}
                  onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Input
                  id="bloodGroup"
                  value={editForm.bloodGroup || ""}
                  onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="requiredOrgan">Required Organ</Label>
                <Input
                  id="requiredOrgan"
                  value={editForm.requiredOrgan || ""}
                  onChange={(e) => setEditForm({ ...editForm, requiredOrgan: e.target.value })}
                />
              </div>
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
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                value={editForm.priority || ""}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
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
            <DialogTitle className="text-red-600">Delete Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-medium mb-2">⚠️ Warning: This action cannot be undone!</p>
              <p className="text-sm text-red-700">
                Deleting your profile will permanently remove:
              </p>
              <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
                <li>All your profile information</li>
                <li>Your match history</li>
                <li>All uploaded documents</li>
                <li>Your account access</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete your profile?
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

      {/* Chat Dialog */}
      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Chat with Donor</DialogTitle>
          </DialogHeader>
          {chatMatchId && <ChatBox matchId={chatMatchId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
