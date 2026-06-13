import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, LoginCredentials, RegisterCredentials, AuthResponse } from '../types'
import { authApi, setAuthLogoutHandler, setToken, removeToken, getToken, UpdateProfileData } from '../api'

interface AuthContextType {
    user: User | null
    login: (credentials: LoginCredentials) => Promise<AuthResponse>
    register: (credentials: RegisterCredentials) => Promise<AuthResponse>
    logout: () => void
    updateUser: (data: UpdateProfileData) => Promise<User>
    isAuthenticated: boolean
    loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const isInitializing = useRef(true)

    const logout = useCallback(() => {
        if (isInitializing.current) return
        setUser(null)
        removeToken()
        localStorage.removeItem('user')
        navigate('/login')
    }, [navigate])

    useEffect(() => {
        setAuthLogoutHandler(logout)
        return () => setAuthLogoutHandler(null)
    }, [logout])

    useEffect(() => {
        const initAuth = async () => {
            isInitializing.current = true
            const token = getToken()
            const savedUser = localStorage.getItem('user')

            if (token) {
                try {
                    const { data } = await authApi.getCurrentUser()
                    setUser(data)
                    localStorage.setItem('user', JSON.stringify(data))
                } catch {
                    removeToken()
                    localStorage.removeItem('user')
                    setUser(null)
                }
            } else if (savedUser) {
                try {
                    const parsedUser = JSON.parse(savedUser) as User
                    setUser(parsedUser)
                } catch {
                    localStorage.removeItem('user')
                }
            }
            setLoading(false)
            isInitializing.current = false
        }

        initAuth()
    }, [])

    const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const { data } = await authApi.login(credentials)
        setToken(data.access_token)
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
        return data
    }

    const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
        const { data } = await authApi.register(credentials)
        setToken(data.access_token)
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
        return data
    }

    const updateUser = async (data: UpdateProfileData): Promise<User> => {
        const { data: updatedUser } = await authApi.updateProfile(data)
        setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
        return updatedUser
    }

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateUser, isAuthenticated: !!user, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within an AuthProvider')
    return context
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, loading } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate('/login')
        }
    }, [isAuthenticated, loading, navigate])

    if (loading) {
        return (
            <div className="min-h-screen bg-secondary-900 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return isAuthenticated ? <>{children}</> : null
}
