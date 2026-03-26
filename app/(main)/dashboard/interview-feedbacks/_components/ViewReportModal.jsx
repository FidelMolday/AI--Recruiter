'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Check, X, MessageSquare, Brain, Zap, Target,
  ThumbsUp, AlertTriangle, Award, ChevronDown, ChevronUp
} from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/services/supabaseClient"
import { toast } from "sonner"

function ViewReportModal({ feedback, open, onClose }) {
  const [sending,            setSending]            = useState(false)
  const [status,             setStatus]             = useState('pending')
  const [transcripts,        setTranscripts]        = useState([])
  const [loadingTranscripts, setLoadingTranscripts] = useState(false)
  const [showTranscript,     setShowTranscript]     = useState(false)

  useEffect(() => {
    if (!feedback) return
    setStatus(feedback.qualification_status || 'pending')
    setShowTranscript(false)
    if (feedback.transcript_id) fetchTranscript(feedback.transcript_id)
  }, [feedback])

  const fetchTranscript = async (transcriptId) => {
    setLoadingTranscripts(true)
    try {
      const { data } = await supabase
        .from('interview_transcripts')
        .select('transcript')
        .eq('id', transcriptId)
        .single()
      if (data?.transcript) setTranscripts(data.transcript)
    } catch (err) {
      console.error('Error fetching transcript:', err)
    } finally {
      setLoadingTranscripts(false)
    }
  }

  if (!feedback) return null

  // ── Helpers ──────────────────────────────────────────────────────────────
  const scoreColor = (score) => {
    if (score >= 80) return 'bg-emerald-500'
    if (score >= 60) return 'bg-amber-400'
    if (score >= 40) return 'bg-orange-400'
    return 'bg-red-500'
  }

  const scoreTextColor = (score) => {
    if (score >= 80) return 'text-emerald-600'
    if (score >= 60) return 'text-amber-500'
    if (score >= 40) return 'text-orange-500'
    return 'text-red-500'
  }

  const scoreLabel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Work'
  }

  const recommendationStyle = (rec) => {
    if (rec === 'Hire')      return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    if (rec === 'Consider')  return 'bg-amber-100  text-amber-700  border-amber-200'
    return                          'bg-red-100    text-red-700    border-red-200'
  }

  const recommendationIcon = (rec) => {
    if (rec === 'Hire')      return <Check   className="h-5 w-5" />
    if (rec === 'Consider')  return <AlertTriangle className="h-5 w-5" />
    return                          <X       className="h-5 w-5" />
  }

  const overallScore    = feedback.overall_score ?? 0
  const questionScores  = feedback.question_scores ?? []

  // ── Update qualification status ─────────────────────────────────────────
  const handleDecision = async (qualified) => {
    setSending(true)
    try {
      const newStatus = qualified ? 'qualified' : 'not_qualified'
      const { error } = await supabase
        .from('interview_evaluations')
        .update({ qualification_status: newStatus })
        .eq('id', feedback.id)

      if (error) throw error
      setStatus(newStatus)
      toast.success(qualified ? 'Candidate approved!' : 'Candidate rejected.')
    } catch (err) {
      console.error('Decision error:', err)
      toast.error('Failed to update decision')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Candidate Interview Report
          </DialogTitle>
          <DialogDescription>
            {feedback.candidate_name} — {feedback.job_position}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">

          {/* ── Overall Score + Recommendation ─────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            {/* Score Ring */}
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="9" />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke={overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={`${(overallScore / 100) * 264} 264`}
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="46" textAnchor="middle"
                  style={{ fontSize: 22, fontWeight: 700, fill: overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#f59e0b' : '#ef4444' }}>
                  {overallScore}
                </text>
                <text x="50" y="60" textAnchor="middle"
                  style={{ fontSize: 10, fill: '#9ca3af' }}>
                  / 100
                </text>
              </svg>
              <p className={`font-bold text-sm mt-1 ${scoreTextColor(overallScore)}`}>
                {scoreLabel(overallScore)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Overall Score</p>
            </div>

            {/* Recommendation */}
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border gap-2">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-bold text-sm ${recommendationStyle(feedback.recommendation)}`}>
                {recommendationIcon(feedback.recommendation)}
                {feedback.recommendation ?? 'Pending'}
              </div>
              <p className="text-xs text-gray-400">AI Recommendation</p>
              {feedback.recommendation_reason && (
                <p className="text-xs text-gray-600 text-center leading-relaxed">
                  {feedback.recommendation_reason}
                </p>
              )}
            </div>
          </div>

          {/* ── Skills Assessment ────────────────────────────────────────── */}
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-3">Skills Assessment</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Communication',     score: feedback.communication_score,       icon: <MessageSquare className="h-4 w-4 text-blue-500" /> },
                { label: 'Technical Knowledge', score: feedback.technical_knowledge_score, icon: <Brain className="h-4 w-4 text-purple-500" /> },
                { label: 'Confidence',         score: feedback.confidence_score,          icon: <Zap    className="h-4 w-4 text-yellow-500" /> },
                { label: 'Problem Solving',    score: feedback.problem_solving_score,     icon: <Target className="h-4 w-4 text-red-500" /> },
              ].map(({ label, score, icon }) => (
                <div key={label} className="p-3 bg-white border rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    {icon}
                    <span className="text-xs font-semibold text-gray-700">{label}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${scoreColor(score ?? 0)}`}
                      style={{ width: `${score ?? 0}%` }}
                    />
                  </div>
                  <p className={`text-right text-xs font-bold mt-1 ${scoreTextColor(score ?? 0)}`}>
                    {score ?? 0}/100
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Per-Question Breakdown ───────────────────────────────────── */}
          {questionScores.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-3">Question-by-Question Breakdown</h4>
              <div className="space-y-2">
                {questionScores.map((q, i) => (
                  <div key={i} className="p-3 border rounded-xl bg-gray-50">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800 flex-1">
                        Q{i + 1}. {q.question}
                      </p>
                      <span className={`text-sm font-bold shrink-0 ${scoreTextColor(q.score)}`}>
                        {q.score}/100
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${scoreColor(q.score)}`}
                        style={{ width: `${q.score}%` }}
                      />
                    </div>
                    {q.feedback && (
                      <p className="text-xs text-gray-500 mt-1.5">{q.feedback}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Strengths & Improvements ─────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Strengths */}
            {(feedback.strengths ?? []).length > 0 && (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <h4 className="font-semibold text-sm text-emerald-800 flex items-center gap-2 mb-2">
                  <ThumbsUp className="h-4 w-4" /> Strengths
                </h4>
                <ul className="space-y-1">
                  {feedback.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-emerald-700 flex items-start gap-1.5">
                      <span className="mt-0.5">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas to Improve */}
            {(feedback.improvements ?? []).length > 0 && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <h4 className="font-semibold text-sm text-amber-800 flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4" /> Areas to Improve
                </h4>
                <ul className="space-y-1">
                  {feedback.improvements.map((imp, i) => (
                    <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                      <span className="mt-0.5">→</span> {imp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ── Detailed Feedback ────────────────────────────────────────── */}
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Detailed AI Feedback</h4>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {feedback.detailed_feedback || feedback.overall_feedback || 'No feedback available.'}
            </div>
          </div>

          {/* ── Transcript (collapsible) ──────────────────────────────────── */}
          <div>
            <button
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 w-full text-left"
              onClick={() => setShowTranscript(v => !v)}
            >
              {showTranscript ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Interview Transcript
            </button>

            {showTranscript && (
              <div className="mt-2 p-4 bg-gray-50 rounded-xl max-h-56 overflow-y-auto space-y-2 border">
                {loadingTranscripts ? (
                  <p className="text-gray-400 text-sm">Loading transcript…</p>
                ) : transcripts.length > 0 ? (
                  transcripts.map((t, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg text-sm ${
                        t.speaker === 'agent'
                          ? 'bg-blue-100 ml-6'
                          : 'bg-white border mr-6'
                      }`}
                    >
                      <p className="text-xs font-semibold text-gray-500 mb-0.5">
                        {t.speaker === 'agent' ? 'AI Recruiter' : feedback.candidate_name}
                      </p>
                      <p>{t.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No transcript available.</p>
                )}
              </div>
            )}
          </div>

          {/* ── Decision Status ──────────────────────────────────────────── */}
          <div className="flex items-center justify-between p-3 border rounded-xl bg-gray-50">
            <span className="text-sm font-medium text-gray-700">Recruiter Decision</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold border ${
              status === 'qualified'     ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
              status === 'not_qualified' ? 'bg-red-100    text-red-700    border-red-200'     :
                                          'bg-gray-100   text-gray-600   border-gray-200'
            }`}>
              {status === 'qualified'     ? '✓ Approved' :
               status === 'not_qualified' ? '✗ Rejected' : '⏳ Pending'}
            </span>
          </div>

        </div>

        {/* ── Footer Buttons ────────────────────────────────────────────── */}
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          {status === 'pending' ? (
            <>
              <Button
                variant="destructive"
                onClick={() => handleDecision(false)}
                disabled={sending}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" /> Reject Candidate
              </Button>
              <Button
                onClick={() => handleDecision(true)}
                disabled={sending}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <Check className="h-4 w-4 mr-2" /> Approve Candidate
              </Button>
            </>
          ) : (
            <Button onClick={onClose} variant="outline" className="w-full">
              Close Report
            </Button>
          )}
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}

export default ViewReportModal