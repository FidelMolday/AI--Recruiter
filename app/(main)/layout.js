import React from 'react'
import DashboardProvider from './provider'

export default function DashboardLayout({ children }) {
  return (
    <div className='bg-secondary'>
      <DashboardProvider>
        <div className='p-10'>
        {children}
        </div>
        </DashboardProvider> 
    </div>
  )
}
