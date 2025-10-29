import { create } from 'zustand'

type Role = 'customer' | 'cm_team' | 'expert' | 'admin'

interface AuthState {
  user: { id: string; name: string; role: Role } | null
  setUser: (user: AuthState['user']) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null })
}))


