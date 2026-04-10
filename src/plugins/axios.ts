import axios from 'axios'

const api = axios.create({
  baseURL: '/tp-booking-api/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
)

export default api
