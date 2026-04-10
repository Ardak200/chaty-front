import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const http = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
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
        localStorage.setItem('token', data.data.token)
        original.headers.Authorization = `Bearer ${data.data.token}`
        return http(original)
      } catch {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)