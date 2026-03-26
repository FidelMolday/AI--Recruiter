'use client'

import React, { useEffect, useState } from 'react'
import { List, Calendar, Clock, Users, Copy, ExternalLink, Video, Mail, Search, TrendingUp, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUser } from '@/app/provider'
import { supabase } from '@/services/supabaseClient'
import Link from 'next/link'
import { toast } from 'sonner'
import ViewInterviewModal from '../scheduled-interviews/_components/ViewInterviewModal'

function AllInterviews() {
  const { user } = useUser()
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDuration, setFilterDuration] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedInterview, setSelectedInterview] = useState(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)

  useEffect(() => {
    fetchAllInterviews()
  }, [])

  const fetchAllInterviews = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('interviews')
        .select('*')
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      setInterviews(data || [])
    } catch (err) {
      console.error('Error fetching interviews:', err)
      toast.error('Failed to load interviews')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = (interviewId) => {
    const url = `${process.env.NEXT_PUBLIC_HOST_URL}/${interviewId}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard')
  }

  const handleView = (interview) => {
    setSelectedInterview(interview)
    setViewModalOpen(true)
  }

  const filteredInterviews = interviews
    .filter(interview => {
      const matchesSearch = 
        interview.jobPosition?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        interview.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = filterDuration === 'all' || interview.duration === filterDuration
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at)
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at) - new Date(b.created_at)
      } else if (sortBy === 'position') {
        return (a.jobPosition || '').localeCompare(b.jobPosition || '')
      }
      return 0
    })

  const stats = {
    total: interviews.length,
    byDuration: {
      '5 Min': interviews.filter(i => i.duration === '5 Min').length,
      '15 Min': interviews.filter(i => i.duration === '15 Min').length,
      '30 Min': interviews.filter(i => i.duration === '30 Min').length,
      '45 Min': interviews.filter(i => i.duration === '45 Min').length,
      '60 Min': interviews.filter(i => i.duration === '60 Min').length,
    },
    uniquePositions: new Set(interviews.map(i => i.jobPosition)).size,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">All Interviews</h2>
          <p className="text-gray-500">View and manage all interview sessions</p>
        </div>
        <Link href="/dashboard/create-interview">
          <Button>
            <Video className="h-4 w-4 mr-2" />
            Create New Interview
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <List className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Positions</p>
              <p className="text-2xl font-bold">{stats.uniquePositions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">30 Min</p>
              <p className="text-2xl font-bold">{stats.byDuration['30 Min']}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">15 Min</p>
              <p className="text-2xl font-bold">{stats.byDuration['15 Min']}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by position or creator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterDuration}
          onChange={(e) => setFilterDuration(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="all">All Durations</option>
          <option value="5 Min">5 Min</option>
          <option value="15 Min">15 Min</option>
          <option value="30 Min">30 Min</option>
          <option value="45 Min">45 Min</option>
          <option value="60 Min">60 Min</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="position">By Position</option>
        </select>
      </div>

      {/* Interviews List - Card View */}
      {filteredInterviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <List className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No interviews found</h3>
          <p className="text-gray-500 mt-1">
            {searchQuery ? 'Try adjusting your search' : 'No interviews have been created yet'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredInterviews.map((interview) => (
            <div 
              key={interview.interview_id} 
              className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{interview.jobPosition}</h3>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                      {interview.duration}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {interview.QuestionList?.length || 0} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(interview.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {interview.userEmail || 'Unknown'}
                    </span>
                  </div>
                  {interview.type && interview.type.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {interview.type.map((t, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(interview)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyLink(interview.interview_id)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Link
                  </Button>
                  <Link href={`/interview/${interview.interview_id}`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Info */}
      {filteredInterviews.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Showing {filteredInterviews.length} of {interviews.length} interviews
        </div>
      )}

      <ViewInterviewModal
        interview={selectedInterview}
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
      />
    </div>
  )
}

export default AllInterviews
