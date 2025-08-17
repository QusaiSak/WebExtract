import DesktopSidebar from '@/components/Sidebar'
import  BreadcrumbHeader  from '@/components/BreadCrumbHeader'
import { Separator } from '@/components/ui/separator'
import React from 'react'
import { ModeToggle } from '@/components/ThemeModeToggle'
import { SignedIn, UserButton } from '@clerk/nextjs'
import { InitializeUserBalance } from '@/actions/billings'

async function layout({children}:{children:React.ReactNode}) {
  // Initialize user balance when they access dashboard
  try {
    await InitializeUserBalance();
  } catch (error) {
    console.error("Failed to initialize user balance:", error);
  }
  return (
    <div className='flex h-screen'>
      <DesktopSidebar/>
      <div className='flex flex-col flex-1 min-h-screen '>
        <header className="flex items-center justify-between px-6 py-4 h-[50px] container">
            <BreadcrumbHeader />
            <div className='flex items-center gap-4'>

            <ModeToggle/>
            <SignedIn>
                <UserButton />
            </SignedIn>
            </div>

        </header>
        <Separator/>
        <div className='overflow-auto '>
            <div className='flex container py-4 text-accent-foreground '>
                {children}

            </div>

        </div>
      </div>
    </div>
  )
}

export default layout
