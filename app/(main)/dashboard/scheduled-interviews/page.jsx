'use client'

import React, { useEffect, useState } from 'react'
import { Calendar, Clock, Users, Copy, ExternalLink, Video, Mail, MoreHorizontal, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUser } from '@/app/provider'
import { supabase } from '@/services/supabaseClient'
import Link from 'next/link'
import { toast } from 'sonner'
import ViewInterviewModal from './_components/ViewInterviewModal'

function ScheduledInterviews() {
  const { user } = useUser()
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [selectedInterview, setSelectedInterview] = useState(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)

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

  const filteredInterviews = interviews.filter(interview => {
    const matchesSearch = interview.jobPosition?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === 'all' || interview.duration === filterType
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: interviews.length,
    thisWeek: interviews.filter(i => {
      const created = new Date(i.created_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return created > weekAgo
    }).length,
    thisMonth: interviews.filter(i => {
      const created = new Date(i.created_at)
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return created > monthAgo
    }).length,
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
          <h2 className="text-2xl font-bold">Scheduled Interviews</h2>
          <p className="text-gray-500">Manage your created interview sessions</p>
        </div>
        <Link href="/dashboard/create-interview">
          <Button>
            <Video className="h-4 w-4 mr-2" />
            Create New Interview
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Scheduled</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Week</p>
              <p className="text-2xl font-bold">{stats.thisWeek}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold">{stats.thisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by job position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white"
        >
          <option value="all">All Durations</option>
          <option value="5 Min">5 Min</option>
          <option value="15 Min">15 Min</option>
          <option value="30 Min">30 Min</option>
          <option value="45 Min">45 Min</option>
          <option value="60 Min">60 Min</option>
        </select>
      </div>

      {/* Interviews List */}
      {filteredInterviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No interviews found</h3>
          <p className="text-gray-500 mt-1">
            {searchQuery ? 'Try adjusting your search' : 'Create your first interview to get started'}
          </p>
          {!searchQuery && (
            <Link href="/dashboard/create-interview">
              <Button className="mt-4">Create Interview</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Job Position</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Duration</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Questions</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Created</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredInterviews.map((interview) => (
                  <tr key={interview.interview_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{interview.jobPosition}</p>
                      <p className="text-sm text-gray-500">{interview.type?.join(', ')}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {interview.duration}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">{interview.QuestionList?.length || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">
                        {new Date(interview.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(interview)}
                          title="View Details"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyLink(interview.interview_id)}
                          title="Copy link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Interview Modal */}
      <ViewInterviewModal
        interview={selectedInterview}
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
      />
    </div>
  )
}

export default ScheduledInterviews
