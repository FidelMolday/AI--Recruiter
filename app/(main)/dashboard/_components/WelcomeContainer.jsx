"use client"
import React from 'react'
import { useUser as useAuthUser } from '@/app/provider'
import Image from 'next/image'

function WelcomeContainer() {
  const { user, loading } = useAuthUser()

  if (loading) {
    return (
      <div className='bg-white p-3 rounded-xl flex justify-between items-center mt-4 animate-pulse'>
        <div className='bg-gray-200 h-12 w-64 rounded-lg'></div>
        <div className='bg-gray-200 h-10 w-10 rounded-full'></div>
      </div>
    )
  }

  const userName = user?.name || user?.email?.split('@')[0] || 'User'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <div className='bg-white p-4 rounded-xl flex justify-between items-center mt-4 shadow-sm'>
      <div className='p-2 rounded-lg'>
        <h2 className='text-lg font-bold text-gray-900'>
          Welcome back, {userName} 👋
        </h2>
        <h2 className='text-gray-500 text-sm mt-1'>
          AI-Powered Interviews for Hassle-Free Hiring
        </h2>
      </div>
      
      {user?.picture ? (
        <Image 
          src={user.picture} 
          alt={userName}
          width={44}
          height={44}
          className='rounded-full object-cover border-2 border-gray-100'
        />
      ) : (
        <div className='h-11 w-11 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg'>
          {userInitial}
        </div>
      )}
    </div>
  )
}

export default WelcomeContainer
