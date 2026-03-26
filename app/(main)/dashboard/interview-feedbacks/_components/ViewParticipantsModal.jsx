'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, FileText, Mail, ExternalLink } from "lucide-react"

function ViewParticipantsModal({ interview, feedbacks, open, onClose, onViewReport }) {
  if (!interview) return null

  const participants = feedbacks.filter(fb => fb.interview_id === interview.interview_id)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Interview Participants
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Interview Info */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-sm font-medium">{interview.duration}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm font-medium">
                  {new Date(interview.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium">{interview.jobPosition}</p>
            <p className="text-sm text-gray-500">{participants.length} participant(s)</p>
          </div>

          {/* Participants List */}
          <div>
            <h3 className="font-medium text-gray-700 mb-2 text-sm">Participants</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {participants.length > 0 ? (
                participants.map((participant) => (
                  <div 
                    key={participant.id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{participant.candidate_name}</p>
                      <p className="text-xs text-gray-500">
                        {participant.candidate_email || 'No email'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(participant.created_at).toLocaleDateString()} • {participant.duration}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        participant.recommendation === 'Hire' ? 'bg-green-100 text-green-700' :
                        participant.recommendation === 'Reject' ? 'bg-red-100 text-red-700' :
                        participant.qualification_status === 'qualified' ? 'bg-green-100 text-green-700' :
                        participant.qualification_status === 'not_qualified' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {participant.recommendation || 
                         (participant.qualification_status === 'qualified' ? 'Approved' :
                          participant.qualification_status === 'not_qualified' ? 'Rejected' : 'Pending')}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onViewReport(participant)}
                      >
                        View Report
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No participants yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ViewParticipantsModal
