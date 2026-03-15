// WebSocket server configuration for real-time chat and notifications
// This file is currently a placeholder for Socket.IO setup

/*
 * To enable real-time features:
 * 
 * 1. Install additional dependencies:
 *    npm install socket.io socket.io-client
 * 
 * 2. Create a custom Next.js server (server.js):
 *    const { createServer } = require('http');
 *    const { parse } = require('url');
 *    const next = require('next');
 *    const { Server } = require('socket.io');
 * 
 *    const dev = process.env.NODE_ENV !== 'production';
 *    const app = next({ dev });
 *    const handle = app.getRequestHandler();
 * 
 *    app.prepare().then(() => {
 *      const server = createServer((req, res) => {
 *        const parsedUrl = parse(req.url, true);
 *        handle(req, res, parsedUrl);
 *      });
 * 
 *      const io = new Server(server, {
 *        cors: {
 *          origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
 *          methods: ['GET', 'POST']
 *        }
 *      });
 * 
 *      io.on('connection', (socket) => {
 *        console.log('Client connected:', socket.id);
 * 
 *        socket.on('join-match', (matchId) => {
 *          socket.join(matchId);
 *          console.log(`Socket ${socket.id} joined match ${matchId}`);
 *        });
 * 
 *        socket.on('send-message', (data) => {
 *          io.to(data.matchId).emit('new-message', data);
 *        });
 * 
 *        socket.on('typing', (data) => {
 *          socket.to(data.matchId).emit('user-typing', data);
 *        });
 * 
 *        socket.on('disconnect', () => {
 *          console.log('Client disconnected:', socket.id);
 *        });
 *      });
 * 
 *      const port = process.env.PORT || 3000;
 *      server.listen(port, () => {
 *        console.log(`> Ready on http://localhost:${port}`);
 *      });
 *    });
 * 
 * 3. Update package.json scripts:
 *    "scripts": {
 *      "dev": "node server.js",
 *      "build": "next build",
 *      "start": "NODE_ENV=production node server.js"
 *    }
 * 
 * 4. Client-side usage (in components):
 *    import { useEffect, useState } from 'react';
 *    import io from 'socket.io-client';
 * 
 *    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000');
 * 
 *    useEffect(() => {
 *      socket.emit('join-match', matchId);
 * 
 *      socket.on('new-message', (message) => {
 *        setMessages(prev => [...prev, message]);
 *      });
 * 
 *      socket.on('user-typing', (data) => {
 *        setIsTyping(true);
 *        setTimeout(() => setIsTyping(false), 3000);
 *      });
 * 
 *      return () => {
 *        socket.off('new-message');
 *        socket.off('user-typing');
 *      };
 *    }, [matchId]);
 */

export const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  
  // Match room events
  JOIN_MATCH: "join-match",
  LEAVE_MATCH: "leave-match",
  
  // Chat events
  SEND_MESSAGE: "send-message",
  NEW_MESSAGE: "new-message",
  MESSAGE_READ: "message-read",
  TYPING: "typing",
  USER_TYPING: "user-typing",
  STOP_TYPING: "stop-typing",
  
  // Notification events
  NEW_NOTIFICATION: "new-notification",
  NOTIFICATION_READ: "notification-read",
  
  // Match events
  NEW_MATCH: "new-match",
  MATCH_UPDATED: "match-updated",
  
  // Verification events
  PROFILE_VERIFIED: "profile-verified",
  PROFILE_REJECTED: "profile-rejected",
} as const;

export const SOCKET_CONFIG = {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  timeout: 20000,
} as const;

// Note: Socket.IO is installed but not configured. 
// Follow the instructions above to set up real-time features.
// For now, the app uses HTTP polling as a fallback.
