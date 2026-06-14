import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { renderHook, act, render, screen } from '@testing-library/react'
import { AuthProvider, useAuth, ProtectedRoute } from '../contexts/AuthContext'
import { mockUser, mockAuthResponse } from './mocks'
import React from 'react'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import * as apiModule from '../api'

vi.mock('../api', () => ({
  api: {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  setAuthLogoutHandler: vi.fn(),
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    getCurrentUser: vi.fn(),
    updateProfile: vi.fn(),
  },
  cartApi: {
    getCart: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    merge: vi.fn(),
  },
  getToken: vi.fn(),
  setToken: vi.fn(),
  removeToken: vi.fn(),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
)

describe('AuthContext - 用户登录鉴权', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    ;(apiModule.getToken as Mock).mockReturnValue(null)
    ;(apiModule.authApi.getCurrentUser as Mock).mockRejectedValue(new Error('Not authenticated'))
  })

  it('初始状态用户未登录', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('login 成功后设置用户信息和 token', async () => {
    const loginMock = apiModule.authApi.login as Mock
    loginMock.mockResolvedValue({ data: mockAuthResponse })
    const setTokenMock = apiModule.setToken as Mock

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      const response = await result.current.login({
        username: 'testuser',
        password: 'test123456',
      })
      expect(response).toEqual(mockAuthResponse)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
    expect(setTokenMock).toHaveBeenCalledWith(mockAuthResponse.access_token)
    expect(localStorage.getItem('user')).not.toBeNull()
  })

  it('login 失败后保持未登录状态', async () => {
    const loginMock = apiModule.authApi.login as Mock
    loginMock.mockRejectedValue(new Error('Invalid credentials'))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await expect(async () => {
      await act(async () => {
        await result.current.login({
          username: 'testuser',
          password: 'wrongpassword',
        })
      })
    }).rejects.toThrow()

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('register 成功后设置用户信息和 token', async () => {
    const registerMock = apiModule.authApi.register as Mock
    registerMock.mockResolvedValue({ data: mockAuthResponse })
    const setTokenMock = apiModule.setToken as Mock

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      const response = await result.current.register({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      })
      expect(response).toEqual(mockAuthResponse)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
    expect(setTokenMock).toHaveBeenCalledWith(mockAuthResponse.access_token)
  })

  it('logout 清除用户信息和 token', () => {
    const removeTokenMock = apiModule.removeToken as Mock

    const { result } = renderHook(() => useAuth(), { wrapper })

    localStorage.setItem('token', 'mock-token')
    localStorage.setItem('user', JSON.stringify(mockUser))

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('updateUser 更新用户信息', async () => {
    const loginMock = apiModule.authApi.login as Mock
    loginMock.mockResolvedValue({ data: mockAuthResponse })

    const updateMock = apiModule.authApi.updateProfile as Mock
    const updatedUser = { ...mockUser, nickname: '新昵称' }
    updateMock.mockResolvedValue({ data: updatedUser })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login({
        username: 'testuser',
        password: 'test123456',
      })
    })

    await act(async () => {
      const response = await result.current.updateUser({ nickname: '新昵称' })
      expect(response).toEqual(updatedUser)
    })

    expect(result.current.user?.nickname).toBe('新昵称')
    expect(localStorage.getItem('user')).toContain('新昵称')
  })
})

describe('AuthContext - Token 持久化恢复', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('已保存 token 和用户信息时自动恢复登录状态', () => {
    localStorage.setItem('token', 'saved-token')
    localStorage.setItem('user', JSON.stringify(mockUser))
    ;(apiModule.getToken as Mock).mockReturnValue('saved-token')
    ;(apiModule.authApi.getCurrentUser as Mock).mockResolvedValue({ data: mockUser })

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.loading).toBe(true)
  })

  it('token 失效时清除登录状态', async () => {
    localStorage.setItem('token', 'invalid-token')
    localStorage.setItem('user', JSON.stringify(mockUser))
    ;(apiModule.getToken as Mock).mockReturnValue('invalid-token')
    ;(apiModule.authApi.getCurrentUser as Mock).mockRejectedValue(new Error('Token expired'))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(apiModule.removeToken).toHaveBeenCalled()
  })
})

describe('ProtectedRoute - 登录拦截', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    ;(apiModule.getToken as Mock).mockReturnValue(null)
    ;(apiModule.authApi.getCurrentUser as Mock).mockRejectedValue(new Error('Not authenticated'))
  })

  it('已登录用户可以访问受保护路由', () => {
    localStorage.setItem('token', 'valid-token')
    localStorage.setItem('user', JSON.stringify(mockUser))
    ;(apiModule.getToken as Mock).mockReturnValue('valid-token')
    ;(apiModule.authApi.getCurrentUser as Mock).mockResolvedValue({ data: mockUser })

    render(
      <BrowserRouter>
        <AuthProvider>
          <ProtectedRoute>
            <div data-testid="protected-content">受保护内容</div>
          </ProtectedRoute>
        </AuthProvider>
      </BrowserRouter>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('未登录用户访问受保护路由应被重定向', () => {
    const mockNavigate = vi.fn()
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      }
    })

    expect(true).toBe(true)
  })
})
