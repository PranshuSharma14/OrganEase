"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface Message {
  id: string;
  senderId: string;
  senderRole: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export default function ChatBox({ matchId, recipientName, donorName }: { 
  matchId: string;
  recipientName?: string;
  donorName?: string;
}) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadMessages();
    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [matchId]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/chat?matchId=${matchId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          message: newMessage.trim(),
        }),
      });

      if (response.ok) {
        setNewMessage("");
        await loadMessages();
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getOtherUserName = () => {
    if (session?.user?.role === "donor") return recipientName || "Recipient";
    if (session?.user?.role === "recipient") return donorName || "Donor";
    return "User";
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <CardTitle className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-blue-600" />
          Chat with {getOtherUserName()}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Communicate securely about the donation process
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.senderId === session?.user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={isOwn ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"}>
                      {msg.senderRole === "donor" ? "D" : "R"}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 ${isOwn ? "text-right" : ""}`}>
                    <div
                      className={`inline-block max-w-[70%] rounded-2xl px-4 py-3 ${
                        isOwn
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 px-2">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex gap-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
              disabled={loading}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !newMessage.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send • All messages are encrypted
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
