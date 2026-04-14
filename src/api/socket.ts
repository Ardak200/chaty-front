import { io, Socket } from 'socket.io-client'
import { getAccessToken } from './http'
import { bindCallListeners } from '../composables/useWebRTC'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

let socket: Socket | null = null

export function connectSocket() {
  if (socket?.connected) return socket

  socket = io(API_URL, {
    withCredentials: true,
    auth: { token: getAccessToken() },
  })

  bindCallListeners(socket)

  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}