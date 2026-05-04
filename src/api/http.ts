import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const http = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true

      try {
        await axios.post(`${API_URL}/auth/refresh`, null, {
          withCredentials: true,
        })
        return http(original)
      } catch {
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  },
)
