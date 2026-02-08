import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      business: null,
      token: null,
      isAuthenticated: false,

      setAuth: (token, user, business) => {
        localStorage.setItem('auth_token', token)
        set({ token, user, business, isAuthenticated: true })
      },

      clearAuth: () => {
        localStorage.removeItem('auth_token')
        set({ token: null, user: null, business: null, isAuthenticated: false })
      },

      logout: () => {
        localStorage.clear()
        sessionStorage.clear()
        set({ token: null, user: null, business: null, isAuthenticated: false })
      },

      updateUser: (user) => set({ user }),
      updateBusiness: (business) => set({ business })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        business: state.business,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
