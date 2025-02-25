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
      return 'dark'
    }
  })

  const [colorPalette, setColorPalette] = useState(() => {
    try {
      const config = window.electronAPI.getConfig()
      return config.colorPalette || 'default'
    } catch (error) {
      console.error('Failed to get color palette from config:', error)
      return 'default'
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

  useEffect(() => {
    const root = document.documentElement
    
    root.classList.remove('palette-default', 'palette-blue', 'palette-green', 'palette-purple', 'palette-orange')
    
    root.classList.add(`palette-${colorPalette}`)
    
  }, [colorPalette])

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

  const changeColorPalette = (palette) => {
    setColorPalette(palette)
    try {
      window.electronAPI.saveConfig({ colorPalette: palette })
    } catch (error) {
      console.error('Failed to save color palette to config:', error)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colorPalette, changeColorPalette }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
} 