import React, { createContext, useContext } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}

/**
 * Aurora Silk theme — always light, no dark mode toggle.
 * The gradient is handled by Background.jsx.
 */
export const ThemeProvider = ({ children }) => {
  // Ensure the html element never gets the 'dark' class
  if (typeof window !== 'undefined') {
    const root = window.document.documentElement
    root.classList.remove('dark')
    root.classList.add('light')
    localStorage.setItem('theme', 'light')
  }

  const value = {
    theme: 'light',
    toggleTheme: () => { }, // no-op — Aurora is always light
    setTheme: () => { },
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}