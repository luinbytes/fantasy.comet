import React, { createContext, useContext, useState, useEffect } from 'react'
import { useToast } from './ToastContext'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const config = window.electronAPI.getConfig()
      return config.theme || 'dark'
    } catch (error) {
      console.error('Failed to get theme from config:', error)
      return 'dark' // Default to dark theme if config fails
    }
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark'
      try {
        window.electronAPI.saveConfig({ theme: newTheme })
      } catch (error) {
        console.error('Failed to save theme to config:', error)
      }
      return newTheme
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
} 