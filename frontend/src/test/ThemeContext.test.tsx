import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../contexts/ThemeContext'
import React from 'react'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

describe('ThemeContext - 主题切换功能', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('初始主题为浅色模式', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.darkMode).toBe(false)
  })

  it('toggleDarkMode 可以切换主题', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.darkMode).toBe(false)

    act(() => {
      result.current.toggleDarkMode()
    })

    expect(result.current.darkMode).toBe(true)

    act(() => {
      result.current.toggleDarkMode()
    })

    expect(result.current.darkMode).toBe(false)
  })

  it('主题设置持久化到 localStorage', () => {
    const { result, unmount } = renderHook(() => useTheme(), { wrapper })

    act(() => {
      result.current.toggleDarkMode()
    })

    unmount()

    const saved = localStorage.getItem('darkMode')
    expect(saved).not.toBeNull()
    expect(JSON.parse(saved!)).toBe(true)
  })

  it('从 localStorage 恢复主题设置', () => {
    localStorage.setItem('darkMode', 'true')

    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.darkMode).toBe(true)
  })

  it('localStorage 中无效值时使用默认主题', () => {
    localStorage.setItem('darkMode', 'invalid-json')

    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.darkMode).toBe(false)
  })

  it('切换主题时更新 document 的 class', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(document.documentElement.classList.contains('dark')).toBe(false)

    act(() => {
      result.current.toggleDarkMode()
    })

    expect(document.documentElement.classList.contains('dark')).toBe(true)

    act(() => {
      result.current.toggleDarkMode()
    })

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('useTheme 在 Provider 外使用抛出错误', () => {
    const { result } = renderHook(() => {
      try {
        return useTheme()
      } catch (e) {
        return e
      }
    })

    expect(result.current).toBeInstanceOf(Error)
    expect((result.current as Error).message).toContain('ThemeProvider')
  })
})
