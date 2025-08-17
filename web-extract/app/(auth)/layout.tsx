import Logo from '@/components/Logo'
import React from 'react'

function layout({children}:{children:React.ReactNode}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-12 gradient-bg p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating-animation"></div>
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating-animation" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="floating-animation">
        <Logo />
      </div>
      
      <div className="w-full max-w-md modern-card p-8 neon-glow z-10">
        {children}
      </div>
    </div>
  )
}

export default layout
