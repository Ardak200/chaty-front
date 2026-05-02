import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const TOKEN_KEY = 'accessToken'

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export const http = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

http.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, null, {
          withCredentials: true,
        })
        const newToken = data?.data?.token
        if (newToken) setAccessToken(newToken)
        if (newToken) original.headers.Authorization = `Bearer ${newToken}`
        return http(original)
      } catch {
        clearAccessToken()
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  },
)