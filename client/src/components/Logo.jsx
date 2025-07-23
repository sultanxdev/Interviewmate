import React from 'react'
import logoSvg from '../assets/logo.svg'

const Logo = ({ className = "h-8 w-8", showText = true }) => {
  return (
    <div className="flex items-center space-x-2">
      <img 
        src={logoSvg} 
        alt="InterviewMate Logo" 
        className={className}
      />
      {showText && (
        <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          InterviewMate
        </span>
      )}
    </div>
  )
}

export default Logo