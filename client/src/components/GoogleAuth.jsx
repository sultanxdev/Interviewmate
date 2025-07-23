import React, { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const GoogleAuth = ({ onSuccess, onError, buttonText = "Continue with Google" }) => {
  const { login } = useAuth()

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        })

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'continue_with',
            shape: 'rectangular'
          }
        )
      }
    }

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handleCredentialResponse = async (response) => {
    try {
      const result = await login({
        credential: response.credential,
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID
      }, 'google')

      if (result.success) {
        onSuccess?.(result)
      } else {
        onError?.(result.message || 'Google authentication failed')
      }
    } catch (error) {
      console.error('Google auth error:', error)
      onError?.(error.message || 'Google authentication failed')
    }
  }

  return (
    <div className="w-full">
      <div id="google-signin-button" className="w-full"></div>
    </div>
  )
}

export default GoogleAuth