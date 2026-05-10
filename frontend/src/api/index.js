import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally — clear storage and redirect to login
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  login:    data => api.post('/auth/login', data),
  register: data => api.post('/auth/register', data),
  me:       ()   => api.get('/auth/me'),
}

// ── Labs ──────────────────────────────────────────────────────────────────
export const labsAPI = {
  getAll:          ()           => api.get('/labs'),
  getById:         id           => api.get(`/labs/${id}`),
  getTimetable:    id           => api.get(`/labs/${id}/timetable`),
  getTimetableDay: (id, day)    => api.get(`/labs/${id}/timetable/${day}`),
  getAvailability: (id, date)   => api.get(`/labs/${id}/availability?date=${date}`),
}

// ── Bookings ──────────────────────────────────────────────────────────────
export const bookingsAPI = {
  submit:           data => api.post('/bookings', data),
  getMyBookings:    ()   => api.get('/bookings/my'),
  getById:          id   => api.get(`/bookings/${id}`),
  getAll:           ()   => api.get('/bookings'),
  getPendingForRole: ()  => api.get('/bookings/pending-approvals'),
  approve:          (id, data) => api.post(`/bookings/${id}/approve`, data),
  cancel:           id   => api.patch(`/bookings/${id}/cancel`),
  getStatusCounts:  ()   => api.get('/bookings/analytics/status-counts'),
}

// ── Override Events ───────────────────────────────────────────────────────
export const overrideAPI = {
  create:     data => api.post('/override-events', data),
  getAll:     ()   => api.get('/override-events'),
  getActive:  ()   => api.get('/override-events/active'),
  getById:    id   => api.get(`/override-events/${id}`),
  deactivate: id   => api.patch(`/override-events/${id}/deactivate`),
}

export default api
