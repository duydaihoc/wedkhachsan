import { Server } from 'socket.io'

let io

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173", // Frontend URL
      methods: ["GET", "POST"],
      credentials: true
    }
  })

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // User join room (để nhận notifications)
    socket.on('join-user-room', (userId) => {
      socket.join(`user-${userId}`)
      console.log(`User ${userId} joined their room`)
    })

    // Admin join admin room
    socket.on('join-admin-room', () => {
      socket.join('admin-room')
      console.log('Admin joined admin room')
    })

    // Disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
    })
  })

  return io
}

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized')
  }
  return io
}
