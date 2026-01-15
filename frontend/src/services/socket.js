import { io } from 'socket.io-client'

// Tạo socket connection
const socket = io('http://localhost:5000', {
  autoConnect: false, // Không tự động kết nối, cần gọi connect() thủ công
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
})

export default socket
