export const SURVEY_OPTIONS = ['Yes', 'No', 'Not Answered']
export const CALL_OPTIONS = ['Yes', 'No']
export const STATUS_OPTIONS = ['Completed', 'Pending']
export const GENDER_OPTIONS = ['Male', 'Female', 'Other']

export function getErrorMessage(err) {
  if (!err?.response) return 'Network error. Please check your connection.'
  const data = err.response.data
  if (typeof data === 'string') return data
  const msgs = Object.values(data).flat()
  return msgs[0] || 'Something went wrong.'
}

export function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(str) {
  if (!str) return '—'
  return new Date(str).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function surveyBadge(val) {
  if (val === 'Completed') return 'badge-green'
  if (val === 'Pending') return 'badge-yellow'
  return 'badge-gray'
}

export function callBadge(val) {
  if (val === 'Yes') return 'badge-green'
  return 'badge-red'
}

export function answerBadge(val) {
  if (val === 'Yes') return 'badge-green'
  if (val === 'No') return 'badge-red'
  return 'badge-gray'
}
