"use client"
import React, { useEffect, useState } from 'react'
import { Video, Clock, Users, Copy, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from '@/app/provider'
import { supabase } from '@/services/supabaseClient'
import Link from 'next/link'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner'

function LatestInterviewsList() {
  const { user } = useUser()
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (user?.email) {
      fetchInterviews()
    }
  }, [user?.email])

  const fetchInterviews = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('userEmail', user.email)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setInterviews(data || [])
    } catch (err) {
      console.error('Error fetching interviews:', err)
      toast.error('Failed to load interviews')
    } finally {
      setLoading(false)
    }
  }

  const deleteInterview = async (interviewId) => {
    try {
      setDeleting(interviewId)
      const { error } = await supabase
        .from('interviews')
        .delete()
        .eq('interview_id', interviewId)

      if (error) throw error

      setInterviews(prev => prev.filter(i => i.interview_id !== interviewId))
      toast.success('Interview deleted')
    } catch (err) {
      console.error('Error deleting interview:', err)
      toast.error('Failed to delete interview')
    } finally {
      setDeleting(null)
    }
  }

  const copyLink = (interviewId) => {
    const url = `${process.env.NEXT_PUBLIC_HOST_URL}/${interviewId}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard')
  }

  if (loading) {
    return (
      <div className='my-5'>
        <h2 className='font-bold text-xl'>Previously Created Interviews</h2>
        <div className='p-5 flex flex-col gap-3 items-center mt-5'>
          <div className="animate-pulse">
            <Video className='h-10 w-10 text-primary' />
          </div>
          <p className="text-gray-500">Loading interviews...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='my-5'>
      <h2 className='font-bold text-xl'>Previously Created Interviews</h2>

      {interviews?.length === 0 && (
        <div className='p-5 flex flex-col gap-3 items-center mt-5 bg-white rounded-xl border'>
          <Video className='h-10 w-10 text-primary' />
          <h2 className="text-gray-700 font-medium">You haven't created any interviews yet!</h2>
          <Link href='/dashboard/create-interview'>
            <Button>+ Create New Interview</Button>
          </Link>
        </div>
      )}

      {interviews?.length > 0 && (
        <div className="grid gap-4 mt-4">
          {interviews.map((interview) => (
            <div 
              key={interview.interview_id} 
              className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{interview.jobPosition}</h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {interview.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {interview.QuestionList?.length || 0} questions
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyLink(interview.interview_id)}
                    title="Copy link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  
                  <Link href={`/interview/${interview.interview_id}`}>
                    <Button variant="outline" size="sm" title="Preview">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        disabled={deleting === interview.interview_id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Interview?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{interview.jobPosition}" interview.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteInterview(interview.interview_id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LatestInterviewsList
