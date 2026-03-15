"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Heart, Activity, Clock, CheckCircle2, AlertCircle, FileText, MessageSquare, Power, Edit, Trash2, User, LogOut, Bell, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import Timeline, { generateTimelineSteps } from "@/components/Timeline";
import { DashboardSkeleton } from "@/components/LoadingSkeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOut } from "next-auth/react";
import ChatBox from "@/components/ChatBox";
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
  // Sync emergency checkbox with availability
  useEffect(() => {
    if (editForm && typeof editForm.emergencyAvailable !== "undefined") {
      if (availability === "paused" && editForm.emergencyAvailable) {
        setEditForm((prev: any) => ({ ...prev, emergencyAvailable: false }));
      }
      if (availability === "active" && !editForm.emergencyAvailable) {
        setEditForm((prev: any) => ({ ...prev, emergencyAvailable: true }));
      }
    }
    // eslint-disable-next-line
  }, [availability]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [chatMatchId, setChatMatchId] = useState<string | null>(null);
  const [acceptingMatch, setAcceptingMatch] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const viewDocument = (url: string) => {
    if (!url) {
      toast.error("Document not available");
      return;
    }
    window.open(url, '_blank');
  };

  useEffect(() => {
    if (session?.user) {
      loadDashboardData();
    }
  }, [session]);

  // Auto-refresh dashboard data periodically and when window regains focus
  useEffect(() => {
    // Refresh every 10 seconds to catch hospital approvals more quickly
    const interval = setInterval(() => {
      if (session?.user) {
        loadDashboardData();
      }
    }, 10000);

    // Refresh when window regains focus
    const handleFocus = () => {
      if (session?.user) {
        loadDashboardData();
      }
    };
    window.addEventListener('focus', handleFocus);

    // Refresh when receiving a notification (via storage event for cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'organease-refresh' && session?.user) {
        loadDashboardData();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom refresh event (for same-tab updates)
    const handleRefreshEvent = () => {
      if (session?.user) {
        loadDashboardData();
      }
    };
    window.addEventListener('organease-refresh', handleRefreshEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('organease-refresh', handleRefreshEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function loadDashboardData() {
    try {
      // First fetch profile to get the donor profile ID
      const profileRes = await fetch("/api/profile?role=donor");

      // Handle profile response errors separately so we don't redirect
      // to onboarding when there's a transient DB error.
      if (!profileRes.ok) {
        const err = await profileRes.json().catch(() => ({}));
        console.error("Failed fetching profile:", err);
        toast.error("Unable to fetch profile right now. Please try again later.");
        setLoading(false);
        return;
      }

      const profileData = await profileRes.json();

      // If no profile data (empty object or missing required fields), redirect to onboarding
      if (!profileData || !profileData.id || !profileData.fullName) {
        toast.info("Please complete your profile first");
        router.push("/onboarding/donor");
        return;
      }

      // Now fetch matches and notifications using the profile ID
      const [matchesRes, notifRes] = await Promise.all([
        fetch(`/api/matches?userId=${profileData.id}`),
        fetch("/api/notifications"),
      ]);

      const matchesData = await matchesRes.json();
      const notifData = await notifRes.json();
      
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
      setAvailability(profileData.availability || "active");
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
      setNotifications(notifData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard");
      setLoading(false);
    }
  }

  async function toggleAvailability() {
    setToggling(true);
    try {
      const newStatus = availability === "active" ? "paused" : "active";
      const response = await fetch("/api/profile/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: newStatus }),
      });

      if (response.ok) {
        setAvailability(newStatus);
        toast.success(
          newStatus === "active"
            ? "You are now available for donation"
            : "Your profile is paused. You won't receive new matches."
        );
      } else {
        throw new Error("Failed to update availability");
      }
    } catch (error) {
      console.error("Error toggling availability:", error);
      toast.error("Failed to update availability");
    } finally {
      setToggling(false);
    }
  }

  function openEditDialog() {
    setEditForm({
      city: profile?.city || "",
      state: profile?.state || "",
      organs: profile?.organs || [],
      emergencyAvailable: profile?.emergencyAvailable || false,
    });
    setIsEditDialogOpen(true);
  }

  async function handleEditSubmit() {
    if (!editForm.city || !editForm.state) {
      toast.error("City and State are required");
      return;
    }

    if (!editForm.organs || editForm.organs.length === 0) {
      toast.error("Please select at least one organ to donate");
      return;
    }

    try {
      const response = await fetch("/api/profile/edit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "donor", ...editForm }),
      });

      if (response.ok) {
        toast.success("Profile updated successfully");
        setIsEditDialogOpen(false);
        loadDashboardData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("An error occurred");
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
        toast.success("Match accepted! You can now chat with the recipient.");
        loadDashboardData();
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

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!profile?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Card className="max-w-md shadow-xl">
          <CardHeader className="text-center">
            <Heart className="h-16 w-16 mx-auto mb-4 text-blue-600 fill-blue-600" />
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <CardDescription>
              Please complete your donor profile to start helping others
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg" onClick={() => router.push("/onboarding/donor")}>
              Complete Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Heart className="h-10 w-10 text-blue-600 fill-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">OrganEase - Donor</h1>
                <p className="text-sm text-gray-600">Make a difference, save lives</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant={availability === "active" ? "default" : "outline"}
                onClick={toggleAvailability}
                disabled={toggling}
                className={availability === "active" ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <Power className="h-4 w-4 mr-2" />
                {toggling ? "Updating..." : availability === "active" ? "Available" : "Paused"}
              </Button>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                        {profile?.fullName?.[0]?.toUpperCase() || 'D'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.fullName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profile?.email || session?.user?.email}
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
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Profile Status</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {profile.documentsVerified ? "Verified" : "Pending"}
                  </p>
                </div>
                {profile.documentsVerified ? (
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                ) : (
                  <Clock className="h-10 w-10 text-yellow-500" />
                )}
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
                <Heart className="h-10 w-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Verified Recipients</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {matches.filter(m => m.documentsVerified).length}
                  </p>
                </div>
                <AlertCircle className="h-10 w-10 text-orange-500" />
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
                <TrendingUp className="h-10 w-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
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
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Profile</CardTitle>
                    <CardDescription>Donor information and availability</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">{profile.fullName}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Age</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">{profile.age} years</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Blood Group</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">{profile.bloodGroup}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">{profile.city}, {profile.state}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Emergency Available</label>
                        <Badge className="mt-2" variant={profile.emergencyAvailable ? "default" : "secondary"}>
                          {profile.emergencyAvailable ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">{profile.email || session?.user?.email}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-3">Organs Available for Donation</label>
                      <div className="flex flex-wrap gap-2">
                        {(profile.organs as string[]).map((organ) => (
                          <Badge key={organ} variant="secondary" className="px-3 py-1 text-sm">
                            {organ.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" className="flex-1" onClick={openEditDialog}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button variant="destructive" className="flex-1" onClick={() => setIsDeleteDialogOpen(true)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {/* Journey Timeline - Now showing first match if available */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Donation Journey</CardTitle>
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
                          { title: "Waiting for Match", description: "Looking for compatible recipients", status: "current" },
                        ]}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bell className="h-5 w-5" />
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
          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <CardTitle>Your Matches</CardTitle>
                <CardDescription>Potential recipients who need your help</CardDescription>
              </CardHeader>
              <CardContent>
                {matches.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600 font-medium">No matches yet</p>
                    <p className="text-sm text-gray-500 mt-2">Keep your profile active to help save lives!</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {matches.map((match) => (
                      <div key={match.id} className="border-2 rounded-xl p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-red-100 text-red-600 text-lg font-semibold">
                                {match.recipient?.patientName?.[0] || 'R'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-bold text-lg text-gray-900">{match.recipient?.patientName || 'Recipient'}</h4>
                              <p className="text-sm text-gray-600">
                                Needs: <span className="font-semibold">{match.organType?.replace(/_/g, " ") || match.recipient?.requiredOrgan?.replace(/_/g, " ") || 'N/A'}</span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            {match.approvedByHospital && (
                              <Badge className="bg-green-100 text-green-800 block">
                                Hospital Approved
                              </Badge>
                            )}
                            {match.donorAccepted && (
                              <Badge className="bg-blue-100 text-blue-800 block">
                                You Accepted
                              </Badge>
                            )}
                            {match.recipientAccepted && (
                              <Badge className="bg-purple-100 text-purple-800 block">
                                Recipient Accepted
                              </Badge>
                            )}
                            {match.priority && (
                              <Badge className="block" variant={match.priority === "emergency" ? "destructive" : "secondary"}>
                                {match.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 py-4 border-t border-b">
                          <div>
                            <p className="text-xs text-gray-500">Age</p>
                            <p className="font-semibold">{match.age} years</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Blood Group</p>
                            <p className="font-semibold">{match.recipient?.bloodGroup || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="font-semibold">{match.city}</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-3 mt-4">
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedMatch(match)}>
                            View Details
                          </Button>
                          
                          {(() => {
                            const isApproved = !!(match.approvedByHospital === true || match.approvedByHospital === "true" || match.approvedByHospital === 1 || match.approvedByHospital === "1");
                            const isDonorAccepted = !!(match.donorAccepted === true || match.donorAccepted === "true" || match.donorAccepted === 1 || match.donorAccepted === "1");
                            return isApproved && !isDonorAccepted ? (
                              <Button 
                                size="sm" 
                                className="flex-1 bg-green-600 hover:bg-green-700" 
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
                                className="flex-1" 
                                onClick={() => openChat(match.matchId || match.id)}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Chat with Recipient
                              </Button>
                            ) : null;
                          })()}
                          
                          {(() => {
                            const isApproved = !!(match.approvedByHospital === true || match.approvedByHospital === "true" || match.approvedByHospital === 1 || match.approvedByHospital === "1");
                            return !isApproved ? (
                              <Button size="sm" variant="secondary" className="flex-1" disabled>
                                Awaiting Hospital Approval
                              </Button>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    ))}
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
                <CardDescription>Stay updated with your donation journey</CardDescription>
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
                <CardTitle>Uploaded Documents</CardTitle>
                <CardDescription>Your verification documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {profile?.governmentId ? (
                    <div className="flex items-center justify-between p-4 border-2 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Government ID (Aadhaar/Passport)</p>
                          <p className="text-sm text-gray-600">Identity Verification</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => viewDocument(profile.governmentId)}>
                        View
                      </Button>
                    </div>
                  ) : null}

                  {profile?.medicalCertificate ? (
                    <div className="flex items-center justify-between p-4 border-2 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <FileText className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Medical Fitness Certificate</p>
                          <p className="text-sm text-gray-600">Health Verification</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => viewDocument(profile.medicalCertificate)}>
                        View
                      </Button>
                    </div>
                  ) : null}

                  {profile?.bloodGroupReport ? (
                    <div className="flex items-center justify-between p-4 border-2 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 rounded-lg">
                          <FileText className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Blood Group & Compatibility Reports</p>
                          <p className="text-sm text-gray-600">Matching & Health</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => viewDocument(profile.bloodGroupReport)}>
                        View
                      </Button>
                    </div>
                  ) : null}

                  {profile?.consentForm ? (
                    <div className="flex items-center justify-between p-4 border-2 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                          <FileText className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Consent Declaration (Signed)</p>
                          <p className="text-sm text-gray-600">Legal Requirement</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => viewDocument(profile.consentForm)}>
                        View
                      </Button>
                    </div>
                  ) : null}

                  {!profile?.governmentId && !profile?.medicalCertificate && !profile?.bloodGroupReport && !profile?.consentForm && (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>No documents uploaded yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs remain the same */}
      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Recipient Details</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-red-100 text-red-600 text-2xl">
                    {selectedMatch.patientName?.[0] || 'R'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedMatch.patientName}</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge className={selectedMatch.documentsVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                      {selectedMatch.documentsVerified ? 'Verified' : 'Pending'}
                    </Badge>
                    {selectedMatch.priority && (
                      <Badge variant={selectedMatch.priority === "emergency" ? "destructive" : "secondary"}>
                        {selectedMatch.priority}
                      </Badge>
                    )}
                  </div>
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
                  <p className="text-sm text-gray-600">Request Status</p>
                  <p className="font-medium capitalize">{selectedMatch.requestStatus || 'Pending'}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Organ Required</p>
                <Badge variant="secondary" className="capitalize">
                  {selectedMatch.requiredOrgan.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={editForm.city || ""}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  placeholder="e.g., Mumbai"
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={editForm.state || ""}
                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                  placeholder="e.g., Maharashtra"
                />
              </div>
            </div>
            
            <div>
              <Label>Organs to Donate *</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ORGAN_TYPES.map((organType) => (
                  <Badge
                    key={organType.value}
                    variant={editForm.organs?.includes(organType.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      const currentOrgans = editForm.organs || [];
                      const newOrgans = currentOrgans.includes(organType.value)
                        ? currentOrgans.filter((o: string) => o !== organType.value)
                        : [...currentOrgans, organType.value];
                      setEditForm({ ...editForm, organs: newOrgans });
                    }}
                  >
                    {organType.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="emergencyAvailable"
                checked={editForm.emergencyAvailable || false}
                onChange={(e) => {
                  setEditForm({ ...editForm, emergencyAvailable: e.target.checked });
                  setAvailability(e.target.checked ? "active" : "paused");
                }}
                className="h-4 w-4"
              />
              <Label htmlFor="emergencyAvailable" className="cursor-pointer">
                Available for emergency donations
              </Label>
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
            <DialogTitle>Chat with Recipient</DialogTitle>
          </DialogHeader>
          {chatMatchId && <ChatBox matchId={chatMatchId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
