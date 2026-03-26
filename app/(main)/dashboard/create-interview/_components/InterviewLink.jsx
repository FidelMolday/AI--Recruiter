import React, { useState } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Mail, Plus, List, Clock, Check } from 'lucide-react'
import Link from "next/link";
import toast from 'react-hot-toast';

function InterviewLink({ interview_id, formData }) {
  const [copied, setCopied] = useState(false)
  const url = `${process.env.NEXT_PUBLIC_HOST_URL}/${interview_id}`
  
  const questionCount = formData?.QuestionList?.length || 
                        formData?.questionList?.length || 0

  const GetInterviewUrl = () => url

  const onCopyLink = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success("Link copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Interview for ${formData?.jobPosition}`)
    const body = encodeURIComponent(`You have been invited to an AI-powered interview.\n\nInterview Position: ${formData?.jobPosition}\nDuration: ${formData?.duration}\n\nJoin here: ${url}`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  return (
    <div className='flex flex-col items-center justify-center mt-4'>
      <Image
        src="/check.jpg"
        width={90}
        height={90}
        className="w-40 h-auto"
        alt="Interview created successfully"
      />
      <h2 className='font-bold text-lg mt-2'>Your AI Interview is Ready!</h2>
      <p className='mt-1 text-gray-600'>Share this link with your candidates to start interview process</p>
      
      <div className='w-full p-7 mt-6 rounded-xl bg-white flex flex-col shadow-sm'>
        <div className='flex justify-between items-center'>
          <h2 className='font-bold'>Interview Link</h2>
          <h2 className='p-1 px-2 text-primary bg-blue-50 rounded-4xl text-sm'>Valid for 30 Days</h2>
        </div>
        
        <div className='mt-3 flex gap-3 items-center'>
          <Input 
            value={GetInterviewUrl()} 
            readOnly 
            className="bg-gray-50"
          />
          <Button 
            onClick={onCopyLink}
            variant={copied ? "default" : "outline"}
            className="min-w-[100px]"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        
        <hr className='my-5'/>
        
        <div className='flex gap-5'>
          <h2 className='text-sm text-gray-500 flex gap-2 items-center'>
            <Clock className='h-4 w-4' />
            {formData?.duration || '30 Min'}
          </h2>
          <h2 className='text-sm text-gray-500 flex gap-2 items-center'>
            <List className='h-4 w-4' />
            {questionCount} Questions
          </h2>
        </div>
      </div>
      
      <div className='mt-7 bg-white p-5 rounded-lg w-full shadow-sm'>
        <h2 className='font-bold'>Share Via</h2>
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3'>
          <Button 
            variant={'outline'} 
            className='w-full flex gap-2 items-center justify-center'
            onClick={shareViaEmail}
          >
            <Mail className="h-4 w-4" /> 
            <span className="hidden sm:inline">Email</span>
          </Button>
          <Button variant={'outline'} className='w-full flex gap-2 items-center justify-center' disabled>
            <Mail className="h-4 w-4" /> 
            <span className="hidden sm:inline">Slack</span>
          </Button>
          <Button variant={'outline'} className='w-full flex gap-2 items-center justify-center' disabled>
            <Mail className="h-4 w-4" /> 
            <span className="hidden sm:inline">WhatsApp</span>
          </Button>
        </div>
      </div>
      
      <div className='flex w-full gap-5 justify-between mt-6 flex-wrap'>
        <Link href={'/dashboard'}>
          <Button variant={'outline'}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <Link href={'/dashboard/create-interview'}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New Interview
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default InterviewLink
