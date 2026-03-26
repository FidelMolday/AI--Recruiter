'use client'

import React, { useEffect, useState } from 'react'
import { MessageSquare, Search, Calendar, User, Star, TrendingUp, Clock, ChevronDown, ChevronUp, Users, Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUser } from '@/app/provider'
import { supabase } from '@/services/supabaseClient'
import { toast } from 'sonner'
import ViewParticipantsModal from './_components/ViewParticipantsModal'
import ViewReportModal from './_components/ViewReportModal'

function InterviewFeedbacks() {
  const { user } = useUser()
  const [feedbacks, setFeedbacks] = useState([])
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [selectedInterview, setSelectedInterview] = useState(null)
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [reportModalOpen, setReportModalOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch evaluations from new table
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('interview_evaluations')
        .select('*')
        .order('created_at', { ascending: false })

      if (feedbackError) {
        console.error('Error fetching evaluations:', feedbackError)
        throw feedbackError
      }
      setFeedbacks(feedbackData || [])

      const { data: interviewData, error: interviewError } = await supabase
        .from('interviews')
        .select('*')
        .order('created_at', { ascending: false })

      if (interviewError) {
        console.error('Error fetching interviews:', interviewError)
        throw interviewError
      }
      setInterviews(interviewData || [])
    } catch (err) {
      console.error('Error fetching data:', err)
      // Don't show error toast - just log it
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getOverallScore = (feedback) => {
    // Use new overall_score field first, fallback to old calculation
    if (feedback.overall_score) return feedback.overall_score
    const scores = feedback.category_scores || {}
    const values = Object.values(scores)
    if (values.length === 0) return 0
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleViewParticipants = (interview) => {
    setSelectedInterview(interview)
    setParticipantsModalOpen(true)
  }

  const handleViewReport = (feedback) => {
    setSelectedFeedback(feedback)
    setReportModalOpen(true)
    setParticipantsModalOpen(false)
  }

  const interviewsWithFeedback = interviews.map(interview => {
    const interviewFeedbacks = feedbacks.filter(fb => fb.interview_id === interview.interview_id)
    const avgScore = interviewFeedbacks.length > 0 
      ? Math.round(interviewFeedbacks.reduce((acc, fb) => acc + getOverallScore(fb), 0) / interviewFeedbacks.length)
      : 0
    
    return {
      ...interview,
      participantCount: interviewFeedbacks.length,
      avgScore,
      qualified: interviewFeedbacks.filter(fb => fb.qualification_status === 'qualified').length,
      notQualified: interviewFeedbacks.filter(fb => fb.qualification_status === 'not_qualified').length,
      pending: interviewFeedbacks.filter(fb => fb.qualification_status === 'pending').length
    }
  }).filter(i => i.participantCount > 0)

  const filteredInterviews = interviewsWithFeedback.filter(i => 
    i.jobPosition?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Interview Feedbacks</h2>
          <p className="text-gray-500">View candidate performance and generate reports</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold">{feedbacks.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Score</p>
              <p className="text-2xl font-bold">
                {feedbacks.length > 0 
                  ? Math.round(feedbacks.reduce((acc, fb) => acc + getOverallScore(fb), 0) / feedbacks.length)
                  : 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold">
                {feedbacks.filter(fb => fb.recommendation === 'Hire' || fb.qualification_status === 'qualified').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-2xl font-bold">
                {feedbacks.filter(fb => fb.recommendation === 'Reject' || fb.qualification_status === 'not_qualified').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold">
                {feedbacks.filter(fb => fb.recommendation === 'Consider' || fb.qualification_status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by job position..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredInterviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No feedback yet</h3>
          <p className="text-gray-500 mt-1">Feedbacks will appear after candidates complete interviews</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInterviews.map((interview) => (
            <div key={interview.interview_id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpand(interview.interview_id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{interview.jobPosition}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {interview.participantCount} participant(s)
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(interview.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {interview.duration}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-center px-3 py-1 bg-gray-100 rounded-lg">
                      <p className="text-xs text-gray-500">Avg Score</p>
                      <p className="font-bold text-lg">{interview.avgScore}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        ✓ {interview.qualified}
                      </span>
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                        ⏳ {interview.pending}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleViewParticipants(interview) }}>
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    {expandedId === interview.interview_id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {expandedId === interview.interview_id && (
                <div className="border-t p-4 bg-gray-50">
                  <h4 className="font-medium mb-3">Recent Participants</h4>
                  <div className="grid gap-2">
                    {feedbacks
                      .filter(fb => fb.interview_id === interview.interview_id)
                      .slice(0, 5)
                      .map((fb) => (
                        <div key={fb.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getScoreColor(getOverallScore(fb))}`}>
                              {getOverallScore(fb)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{fb.candidate_name}</p>
                              <p className="text-xs text-gray-500">{new Date(fb.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              fb.qualification_status === 'qualified' ? 'bg-green-100 text-green-700' :
                              fb.qualification_status === 'not_qualified' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {fb.qualification_status === 'qualified' ? 'Qualified' :
                               fb.qualification_status === 'not_qualified' ? 'Not Qualified' :
                               'Pending'}
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => handleViewReport(fb)}>
                              Report
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ViewParticipantsModal
        interview={selectedInterview}
        feedbacks={feedbacks}
        open={participantsModalOpen}
        onClose={() => setParticipantsModalOpen(false)}
        onViewReport={handleViewReport}
      />

      <ViewReportModal
        feedback={selectedFeedback}
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </div>
  )
}

export default InterviewFeedbacks
