import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  accessToken: localStorage.getItem('access_token') || null,
  refreshToken: localStorage.getItem('refresh_token') || null,

  setTokens: (access, refresh) => {
    localStorage.setItem('access_token', access)
    if (refresh) localStorage.setItem('refresh_token', refresh)
    set({ accessToken: access, refreshToken: refresh || localStorage.getItem('refresh_token') })
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    set({ user: null, accessToken: null, refreshToken: null })
  },
}))

export default useAuthStore
