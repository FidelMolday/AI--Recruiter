'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/services/supabaseClient'
import { Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const router = useRouter()
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          setError(error.message)
          return
        }

        // Successful auth - redirect to dashboard
        router.push('/dashboard')
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('Authentication failed')
      }
    }

    handleAuthCallback()
  }, [router])

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-secondary'>
        <div className='bg-white p-8 rounded-xl shadow-lg text-center max-w-md'>
          <h2 className='text-xl font-bold text-red-600 mb-2'>Authentication Error</h2>
          <p className='text-gray-600 mb-4'>{error}</p>
          <button
            onClick={() => router.push('/auth')}
            className='px-4 py-2 bg-primary text-white rounded-lg'
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-secondary'>
      <div className='flex flex-col items-center gap-4'>
        <Loader2 className='h-10 w-10 animate-spin text-primary' />
        <p className='text-gray-600'>Completing sign in...</p>
      </div>
    </div>
  )
}
