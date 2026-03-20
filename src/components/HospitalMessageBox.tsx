"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, MessageSquare, Building2 } from "lucide-react";

type Message = {
  id: string;
  message: string;
  senderRole: string;
  senderId: string;
  createdAt: string;
  read: boolean;
};

type HospitalMessageBoxProps = {
  hospitalId: string;
  hospitalName?: string;
  userId: string;
  userRole: "donor" | "recipient" | string;
  matchId?: string;
  currentUserId?: string;
};

export default function HospitalMessageBox({
  hospitalId,
  hospitalName,
  userId,
  userRole,
  matchId,
  currentUserId,
}: HospitalMessageBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    // Poll for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [hospitalId, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages() {
    try {
      const res = await fetch(`/api/chat?hospitalId=${hospitalId}&userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId,
          userId,
          message: newMessage.trim(),
          matchId,
        }),
      });

      if (res.ok) {
        setNewMessage("");
        loadMessages();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-600" />
          {hospitalName ? `Chat with ${hospitalName}` : "Hospital Communication"}
        </CardTitle>
        <p className="text-xs text-gray-500">
          All messages are securely routed through your assigned hospital
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80">
          {loading ? (
            <p className="text-center text-gray-400 text-sm py-8">Loading messages...</p>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No messages yet</p>
              <p className="text-xs text-gray-400 mt-1">Send a message to your hospital</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === (currentUserId || userId);
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-xl px-4 py-2 ${
                      isMine
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-gray-100 text-gray-900 rounded-bl-sm"
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] border-0 px-1 py-0 ${
                          isMine ? "text-blue-100" : "text-gray-500"
                        }`}
                      >
                        {msg.senderRole === "hospital" ? "Hospital" : isMine ? "You" : msg.senderRole}
                      </Badge>
                    </div>
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? "text-blue-200" : "text-gray-400"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-3 flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={sending}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={sending || !newMessage.trim()} size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
