'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock, Calendar, Users, FileText, X } from "lucide-react"

function ViewInterviewModal({ interview, open, onClose }) {
  if (!interview) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {interview.jobPosition}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Interview Details */}
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

          {/* Interview Types */}
          {interview.type && interview.type.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Interview Types</h3>
              <div className="flex flex-wrap gap-2">
                {interview.type.map((t, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Job Description */}
          <div>
            <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              Job Description
            </h3>
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 max-h-32 overflow-y-auto">
              {interview.jobDescription || 'No job description provided.'}
            </div>
          </div>

          {/* Questions */}
          <div>
            <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              Questions ({interview.QuestionList?.length || 0})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {interview.QuestionList && interview.QuestionList.length > 0 ? (
                interview.QuestionList.map((q, i) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <div className="flex gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{q.question}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                          {q.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No questions generated</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ViewInterviewModal
