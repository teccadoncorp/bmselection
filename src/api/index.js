import api from './axios'

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login/', data),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  me: () => api.get('/auth/me/'),
}

// ─── Operators ────────────────────────────────────────────────────────────────
export const operatorAPI = {
  list: (params) => api.get('/auth/operators/', { params }),
  create: (data) => api.post('/auth/operators/', data),
  update: (id, data) => api.patch(`/auth/operators/${id}/`, data),
  delete: (id) => api.delete(`/auth/operators/${id}/`),
  toggleActive: (id) => api.post(`/auth/operators/${id}/toggle-active/`),
  resetPassword: (id, data) => api.post(`/auth/operators/${id}/reset-password/`, data),
}

// ─── Beneficiaries ────────────────────────────────────────────────────────────
export const beneficiaryAPI = {
  list: (params) => api.get('/beneficiary/', { params }),
  detail: (id) => api.get(`/beneficiary/${id}/`),
  create: (data) => api.post('/beneficiary/', data),
  update: (id, data) => api.patch(`/beneficiary/${id}/`, data),
  delete: (id) => api.delete(`/beneficiary/${id}/`),
  bulkUpload: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/beneficiary/bulk-upload/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  filterBySurvey: (params) => api.get('/beneficiary/filter-by-survey/', { params }),
}

// ─── Assignments ──────────────────────────────────────────────────────────────
export const assignmentAPI = {
  list: (params) => api.get('/assignments/', { params }),
  bulkAssign: (data) => api.post('/assignments/bulk-assign/', data),
  reassign: (data) => api.post('/assignments/reassign/', data),
  operatorSummary: () => api.get('/assignments/operator-summary/'),
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  dashboard: (params) => api.get('/analytics/dashboard/', { params }),
  operators: (params) => api.get('/analytics/operators/', { params }),
  geography: (params) => api.get('/analytics/geography/', { params }),
  faqStats: (params) => api.get('/analytics/faq-stats/', { params }),
}

// ─── Geography ────────────────────────────────────────────────────────────────
export const geographyAPI = {
  states: { list: (p) => api.get('/geography/states/', { params: p }), create: (d) => api.post('/geography/states/', d), update: (id, d) => api.patch(`/geography/states/${id}/`, d), delete: (id) => api.delete(`/geography/states/${id}/`) },
  districts: { list: (p) => api.get('/geography/districts/', { params: p }), create: (d) => api.post('/geography/districts/', d), update: (id, d) => api.patch(`/geography/districts/${id}/`, d), delete: (id) => api.delete(`/geography/districts/${id}/`) },
  blocks: { list: (p) => api.get('/geography/blocks/', { params: p }), create: (d) => api.post('/geography/blocks/', d), update: (id, d) => api.patch(`/geography/blocks/${id}/`, d), delete: (id) => api.delete(`/geography/blocks/${id}/`) },
  gps: { list: (p) => api.get('/geography/gram-panchayats/', { params: p }), create: (d) => api.post('/geography/gram-panchayats/', d), update: (id, d) => api.patch(`/geography/gram-panchayats/${id}/`, d), delete: (id) => api.delete(`/geography/gram-panchayats/${id}/`) },
}

// ─── Survey (Operator) ────────────────────────────────────────────────────────
export const surveyAPI = {
  dashboard: () => api.get('/survey/dashboard/'),
  assignedList: (params) => api.get('/survey/assigned/', { params }),
  detail: (id) => api.get(`/survey/beneficiary/${id}/`),
  update: (id, data) => api.patch(`/survey/beneficiary/${id}/`, data),
}

// ─── Marketing ────────────────────────────────────────────────────────────────
export const marketingAPI = {
  whatsapp: () => api.get('/marketing/whatsapp/'),
  sms: () => api.get('/marketing/sms/'),
  social: () => api.get('/marketing/social/'),
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasksAPI = {
  list: () => api.get('/tasks/'),
}
