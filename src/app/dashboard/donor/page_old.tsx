"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Activity, Clock, CheckCircle2, AlertCircle, FileText, MessageSquare, Power, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Timeline from "@/components/Timeline";
import { DashboardSkeleton } from "@/components/LoadingSkeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOut } from "next-auth/react";

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
  const [userEmail, setUserEmail] = useState<string>("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?role=donor");
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
      if (session.user.email) {
        setUserEmail(session.user.email);
      }
    }
  }, [session]);

  async function loadDashboardData() {
    try {
      // Load profile
      const profileRes = await fetch("/api/profile?role=donor");
      const profileData = await profileRes.json();
      setProfile(profileData);
      setAvailability(profileData.availability || "active");

      // Load matches - use new find-matches API
      const matchesRes = await fetch(`/api/find-matches?userId=${session?.user.id}`);
      const matchesData = await matchesRes.json();
      setMatches(matchesData.matches || []);

      // Load notifications
      const notifRes = await fetch("/api/notifications");
      const notifData = await notifRes.json();
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
      phone: profile?.phone || "",
      city: profile?.city || "",
      state: profile?.state || "",
      emergencyContactName: profile?.emergencyContactName || "",
      emergencyContactPhone: profile?.emergencyContactPhone || "",
    });
    setIsEditDialogOpen(true);
  }

  async function handleEditSubmit() {
    // Validate phone number
    if (editForm.phone) {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(editForm.phone)) {
        toast.error("Please enter a valid phone number");
        return;
      }
      const phoneDigits = editForm.phone.replace(/\\D/g, '');
      if (phoneDigits.length < 10) {
        toast.error("Phone number must be at least 10 digits");
        return;
      }
    }
    
    // Validate emergency contact
    if (editForm.emergencyContactPhone) {
      const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\\s.]?[(]?[0-9]{1,4}[)]?[-\\s.]?[0-9]{1,9}$/;
      if (!phoneRegex.test(editForm.emergencyContactPhone)) {
        toast.error("Please enter a valid emergency contact phone");
        return;
      }
      const emergencyPhoneDigits = editForm.emergencyContactPhone.replace(/\\D/g, '');
      if (emergencyPhoneDigits.length < 10) {
        toast.error("Emergency contact phone must be at least 10 digits");
        return;
      }
    }
    
    try {
      const response = await fetch("/api/profile/edit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!profile?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <Heart className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              Please complete your donor profile to start helping others
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push("/onboarding/donor")}>
              Complete Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-blue-600 fill-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Donor Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {profile.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={availability === "active" ? "default" : "outline"}
              onClick={toggleAvailability}
              disabled={toggling}
              className={availability === "active" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              <Power className="h-4 w-4 mr-2" />
              {toggling ? "Updating..." : availability === "active" ? "Available" : "Paused"}
            </Button>
            <Badge variant={availability === "active" ? "default" : "secondary"} className="text-base px-3 py-1">
              {availability}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Profile Status</p>
                  <p className="text-2xl font-bold">
                    {profile.documentsVerified ? "Verified" : "Pending"}
                  </p>
                </div>
                {profile.documentsVerified ? (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                ) : (
                  <Clock className="h-8 w-8 text-yellow-500" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Matches</p>
                  <p className="text-2xl font-bold">{matches.length}</p>
                </div>
                <Heart className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Verified Recipients</p>
                  <p className="text-2xl font-bold">
                    {matches.filter(m => m.documentsVerified).length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Lives Impacted</p>
                  <p className="text-2xl font-bold">
                    {matches.filter(m => m.requestStatus === "verified").length}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Profile Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>Donor information and availability</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Name</label>
                    <p className="font-medium">{profile.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Age</label>
                    <p className="font-medium">{profile.age} years</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Blood Group</label>
                    <p className="font-medium">{profile.bloodGroup}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Location</label>
                    <p className="font-medium">{profile.city}, {profile.state}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Emergency Available</label>
                    <p className="font-medium">{profile.emergencyAvailable ? "Yes" : "No"}</p>
                  </div>
                  {userEmail && (
                    <div>
                      <label className="text-sm text-gray-600">Email</label>
                      <p className="font-medium">{userEmail}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="text-sm text-gray-600 block mb-2">Organs Available</label>
                  <div className="flex flex-wrap gap-2">
                    {(profile.organs as string[]).map((organ) => (
                      <Badge key={organ} variant="secondary">
                        {organ.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600 block mb-2">Uploaded Documents</label>
                  <div className="space-y-2">
                    {profile.aadhaarUrl && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => viewDocument(profile.aadhaarUrl)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Aadhaar Card
                      </Button>
                    )}
                    {profile.medicalCertificateUrl && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => viewDocument(profile.medicalCertificateUrl)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Medical Certificate
                      </Button>
                    )}
                    {!profile.aadhaarUrl && !profile.medicalCertificateUrl && (
                      <p className="text-sm text-gray-500">No documents uploaded</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
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

            {/* Matches */}
            <Card>
              <CardHeader>
                <CardTitle>Your Matches</CardTitle>
                <CardDescription>Potential recipients and match status</CardDescription>
              </CardHeader>
              <CardContent>
                {matches.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No matches yet. Keep your profile active!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matches.map((match) => (
                      <div key={match.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{match.patientName}</h4>
                            <p className="text-sm text-gray-600">
                              Organ Needed: {match.requiredOrgan.replace(/_/g, " ")}
                            </p>
                            <p className="text-sm text-gray-600">
                              Location: {match.city}, {match.state}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={match.documentsVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                              {match.documentsVerified ? "Verified" : "Pending"}
                            </Badge>
                            {match.priority && (
                              <Badge className="mt-1" variant={match.priority === "emergency" ? "destructive" : "secondary"}>
                                {match.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 text-sm text-gray-600">
                          <span>Age: {match.age}</span>
                          <span>•</span>
                          <span>Blood: {match.bloodGroup}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => toast.info("Chat feature coming soon!")}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contact
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setSelectedMatch(match)}>
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Donation Journey Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Donation Journey</CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline
                  steps={[
                    { label: "Profile Verified", status: profile ? "completed" : "pending" },
                    { label: "Match Found", status: matches.length > 0 ? "completed" : profile ? "current" : "pending" },
                    { label: "Hospital Coordination", status: matches.some(m => m.status === "approved") ? "current" : "pending" },
                    { label: "Donation Complete", status: matches.some(m => m.status === "completed") ? "completed" : "pending" },
                  ]}
                />
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.slice(0, 5).map((notif) => (
                  <div key={notif.id} className="mb-4 pb-4 border-b last:border-0">
                    <p className="font-medium text-sm">{notif.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Match Details Modal */}
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

              {selectedMatch.email && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">Contact Email</p>
                  <p className="font-medium">{selectedMatch.email}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Priority Level</p>
                <p className="font-medium capitalize">{selectedMatch.priority || 'Normal'}</p>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={editForm.phone || ""}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="emergencyName">Emergency Contact Name</Label>
              <Input
                id="emergencyName"
                value={editForm.emergencyContactName || ""}
                onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
              <Input
                id="emergencyPhone"
                value={editForm.emergencyContactPhone || ""}
                onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })}
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
    </div>
  );
}
