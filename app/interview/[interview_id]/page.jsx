'use client'
import React, { useEffect, useContext, useState } from 'react'
import InterviewHeader from '../_components/InterviewHeader'
import Image from 'next/image'
import { toast } from 'sonner'
import { Clock, Info, Loader2Icon, Video, AlertCircle, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/services/supabaseClient'
import { InterviewDataContext } from '@/context/InterviewDataContext'

function Interview() {
  const { interview_id } = useParams()
  const [interviewData, setInterviewData] = useState(null)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState(null)
  const { interviewInfo, setInterviewInfo } = useContext(InterviewDataContext)
  const router = useRouter()

  useEffect(() => {
    if (interview_id) {
      GetInterviewDetails()
    }
  }, [interview_id])

  const GetInterviewDetails = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: interviews, error: fetchError } = await supabase 
        .from('interviews')
        .select("interview_id, jobPosition, jobDescription, duration, type, QuestionList, created_at")
        .eq('interview_id', interview_id)
        .single()

      if (fetchError || !interviews) {
        setError('Interview not found. The link may be invalid or expired.')
        toast.error('Interview not found')
        return
      }

      setInterviewData(interviews)
    } catch (e) {
      console.error('Error fetching interview:', e)
      setError('Failed to load interview details. Please try again.')
      toast.error('Failed to load interview')
    } finally {
      setLoading(false)
    }
  }

  const validateName = (name) => {
    if (!name || name.trim().length < 2) {
      return 'Please enter at least 2 characters'
    }
    if (name.length > 50) {
      return 'Name is too long (max 50 characters)'
    }
    if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      return 'Name can only contain letters, spaces, hyphens, and apostrophes'
    }
    return null
  }

  const validateEmail = (email) => {
    if (!email || email.trim().length < 3) {
      return 'Please enter your email'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address'
    }
    return null
  }

  const onJoinInterview = async () => {
    // Validate name
    const nameError = validateName(userName)
    if (nameError) {
      toast.error(nameError)
      return
    }

    // Validate email
    const emailError = validateEmail(userEmail)
    if (emailError) {
      toast.error(emailError)
      return
    }

    setJoining(true)
    
    try {
      const { data: Interviews, error: fetchError } = await supabase
        .from('interviews')
        .select('*')
        .eq('interview_id', interview_id)
        .single()

      if (fetchError || !Interviews) {
        toast.error('Interview not found')
        return
      }

      setInterviewInfo({
        userName: userName.trim(),
        userEmail: userEmail.trim(),
        interviewData: Interviews,  // Fixed: .single() returns object, not array
        startTime: new Date().toISOString()
      })
      
      toast.success('Starting interview...')
      
      setTimeout(() => {
        router.push('/interview/' + interview_id + '/start')
      }, 500)
    } catch (err) {
      console.error('Error joining interview:', err)
      toast.error('Failed to join interview')
    } finally {
      setJoining(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && userName && !joining) {
      onJoinInterview()
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className='min-h-screen bg-secondary flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <Loader2Icon className='h-10 w-10 animate-spin text-primary' />
          <p className='text-gray-500'>Loading interview...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className='min-h-screen bg-secondary flex items-center justify-center p-4'>
        <div className='max-w-md w-full bg-white rounded-xl p-8 text-center shadow-lg'>
          <AlertCircle className='h-16 w-16 text-red-500 mx-auto mb-4' />
          <h2 className='text-xl font-bold text-gray-900 mb-2'>Interview Not Found</h2>
          <p className='text-gray-600 mb-6'>{error}</p>
          <Button onClick={() => router.push('/')}>
            Go to Homepage
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className='px-6 md:px-16 lg:px-28 xl:px-36 mt-6 pb-10'>
      <div className='flex flex-col items-center justify-center border rounded-xl bg-white 
      p-4 lg:px-14 xl:px-16 mb-8 pb-6 max-w-md mx-auto shadow-md'>
        
        <Image 
          src='/logo.svg' 
          alt='AI Recruiter Logo' 
          width={80} 
          height={80}
          className='mb-1'
        />

        <h2 className='mt-1 text-gray-700 text-sm font-semibold tracking-wide'>
          AI Recruiter
        </h2> 

        <Image
          src='/interview.png'
          alt='Interview'
          width={210}
          height={170}
          className='w-[210px] h-auto my-4 rounded-lg shadow-sm'
        />

        <h2 className='font-bold text-xl text-gray-900 text-center'>
          {interviewData?.jobPosition}
        </h2>

        <h2 className='flex gap-2 items-center text-gray-700 mt-2 text-base font-semibold'>
          <Clock className='h-4 w-4'/>
          {interviewData?.duration}
        </h2>

        <div className='w-full mt-5'>
          <label className='text-sm font-semibold text-gray-800 mb-2 block'>
            Enter your full name <span className='text-red-500'>*</span>
          </label>
          <Input 
            placeholder='e.g. John Doe' 
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyPress={handleKeyPress}
            className='text-lg py-6'
            autoFocus
          />
        </div>

        <div className='w-full mt-4'>
          <label className='text-sm font-semibold text-gray-800 mb-2 block'>
            Enter your email <span className='text-red-500'>*</span>
          </label>
          <Input 
            placeholder='e.g. john@example.com' 
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            className='text-lg py-6'
          />
        </div>

        <div className='p-3 bg-blue-50 flex gap-3 rounded-lg mt-4 border border-blue-100 w-full'>
          <Info className='text-primary mt-1 flex-shrink-0'/>
          <div>
            <h2 className='font-bold text-sm text-gray-800'>
              Before you begin
            </h2>
            <ul className='mt-1 space-y-1'>
              <li className='text-sm font-medium text-gray-700 flex items-center gap-2'>
                <Check className='h-3 w-3 text-green-500' /> Test your microphone
              </li>
              <li className='text-sm font-medium text-gray-700 flex items-center gap-2'>
                <Check className='h-3 w-3 text-green-500' /> Ensure stable internet
              </li>
              <li className='text-sm font-medium text-gray-700 flex items-center gap-2'>
                <Check className='h-3 w-3 text-green-500' /> Find a quiet place
              </li>
            </ul>    
          </div>  
        </div>

        <Button 
          className={'mt-5 w-full font-bold text-base flex items-center justify-center gap-2 h-12'}
          disabled={!userName.trim() || !userEmail.trim() || joining}
          onClick={onJoinInterview}
        >
          {joining ? (
            <>
              <Loader2Icon className='h-4 w-4 animate-spin' />
              Starting...
            </>
          ) : (
            <>
              <Video className='h-4 w-4' /> 
              Join Interview
            </>
          )}
        </Button>

      </div>
    </div>
  )
}

export default Interview
