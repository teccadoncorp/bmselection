// ─── Opinion Analysis API ─────────────────────────────────────────────────────
// Add this block to your existing src/api/index.js

export const opinionAPI = {
  // Booths
  booths: {
    list:   (params) => api.get('/opinion/booths/', { params }),
    create: (data)   => api.post('/opinion/booths/', data),
    update: (id, d)  => api.patch(`/opinion/booths/${id}/`, d),
    delete: (id)     => api.delete(`/opinion/booths/${id}/`),
  },

  // Election Results
  results: {
    list:      (params) => api.get('/opinion/election-results/', { params }),
    create:    (data)   => api.post('/opinion/election-results/', data),
    update:    (id, d)  => api.patch(`/opinion/election-results/${id}/`, d),
    delete:    (id)     => api.delete(`/opinion/election-results/${id}/`),
    uploadCSV: (file)   => {
      const form = new FormData()
      form.append('file', file)
      return api.post('/opinion/election-results/upload-csv/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
  },

  // Admin: Opinion tasks
  tasks: {
    list:   (params) => api.get('/opinion/tasks/', { params }),
    create: (data)   => api.post('/opinion/tasks/', data),
    update: (id, d)  => api.patch(`/opinion/tasks/${id}/`, d),
    delete: (id)     => api.delete(`/opinion/tasks/${id}/`),
  },

  // Operator: own tasks
  myTasks: () => api.get('/opinion/my-tasks/'),

  // Opinion entries (operator submits)
  entries: {
    list:   (params) => api.get('/opinion/entries/', { params }),
    create: (data)   => api.post('/opinion/entries/', data),
    update: (id, d)  => api.patch(`/opinion/entries/${id}/`, d),
    delete: (id)     => api.delete(`/opinion/entries/${id}/`),
  },

  // External sources (admin)
  external: {
    list:   (params) => api.get('/opinion/external-sources/', { params }),
    create: (data)   => api.post('/opinion/external-sources/', data),
    update: (id, d)  => api.patch(`/opinion/external-sources/${id}/`, d),
    delete: (id)     => api.delete(`/opinion/external-sources/${id}/`),
  },

  // Analytics
  analytics: (params) => api.get('/opinion/analytics/', { params }),
}
