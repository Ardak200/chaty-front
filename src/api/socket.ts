import { io, Socket } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

let socket: Socket | null = null

export function connectSocket() {
  const token = localStorage.getItem('token')
  if (!token || socket?.connected) return

  socket = io(API_URL, {
    auth: { token },
  })

  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}