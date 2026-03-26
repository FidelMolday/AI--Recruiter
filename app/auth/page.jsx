"use client"
import React, { useState } from 'react'
import { supabase } from '@/services/supabaseClient';
import Image from 'next/image'
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function Login() {
  const [loading, setLoading] = useState(false)

  const signInWithGoogle = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      })
      
      if (error) {
        console.error('Google Sign-In Error:', error)
        toast.error('Failed to sign in with Google')
      }
    } catch (err) {
      console.error('Sign-In Error:', err)
      toast.error('An error occurred during sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-secondary p-4'>
      <div className='bg-white rounded-2xl p-8 shadow-lg max-w-md w-full'>
        <div className='flex flex-col items-center gap-6'>
          <Image 
            src="/logo.svg" 
            alt="AI Recruiter Logo" 
            width={100} 
            height={100}
            className='w-[100px] h-[100px]'
          />
          
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-gray-900'>AI Recruiter</h2>
            <p className='text-gray-500 mt-2'>
              AI-Powered Voice Interview Platform
            </p>
          </div>

          <Image 
            src='/interview.png' 
            alt='Interview'
            width={400}
            height={250}
            className='w-full h-auto rounded-lg'
          />

          <div className='w-full space-y-4'>
            <Button 
              className='w-full h-12 text-base' 
              onClick={signInWithGoogle}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                  Signing in...
                </>
              ) : (
                'Continue with Google'
              )}
            </Button>
          </div>

          <p className='text-xs text-gray-400 text-center'>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
