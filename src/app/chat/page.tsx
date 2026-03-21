"use client";

import { useSearchParams } from "next/navigation";
import { ChatComponent } from "@/components/ChatComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchId = searchParams.get("matchId") || "";
  const currentUserId = searchParams.get("userId") || "";
  const currentUserRole = searchParams.get("role") || "";

  if (!matchId || !currentUserId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Chat Session</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Missing required parameters. Please access chat from your dashboard.
            </p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        <ChatComponent
          matchId={matchId}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
        />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
