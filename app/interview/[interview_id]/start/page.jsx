'use client'
import React, { useContext, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { InterviewDataContext } from '@/context/InterviewDataContext'
import { Phone, Mic, MicOff, Timer, FileText } from 'lucide-react'
import AlertConfirmation from './_components/AlertConfirmation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function StartInterview() {
  const { interviewInfo } = useContext(InterviewDataContext)
  const router = useRouter()

  // ── Refs ─────────────────────────────────────────────────────────────────
  const callActiveRef = useRef(false)
  const isProcessingRef = useRef(false)
  const isMutedRef = useRef(false)
  const streamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const silenceTimerRef = useRef(null)
  const audioChunksRef = useRef([])
  
  const conversationRef = useRef([])
  const transcriptsRef = useRef([])
  const systemPromptRef = useRef('')
  const startTimeRef = useRef(null)
  const elapsedRef = useRef(0)
  const interviewInfoRef = useRef(null)

  // ── UI State ──────────────────────────────────────────────────────────────
  const [callStatus, setCallStatus] = useState('idle')
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState(null)
  const [statusMsg, setStatusMsg] = useState('Click "Start Interview" to begin')
  const [savingReport, setSavingReport] = useState(false)
  const [reportReady, setReportReady] = useState(false)
  const [currentMessage, setCurrentMessage] = useState('')
  const [transcript, setTranscript] = useState([])

  // Keep interviewInfo ref updated
  useEffect(() => {
    interviewInfoRef.current = interviewInfo
  }, [interviewInfo])

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (callStatus !== 'active') return
    const id = setInterval(() => {
      setElapsed(s => { elapsedRef.current = s + 1; return s + 1 })
    }, 1000)
    return () => clearInterval(id)
  }, [callStatus])

  const formatTime = s =>
    [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
      .map(n => String(n).padStart(2, '0')).join(':')

  // ── Build system prompt ───────────────────────────────────────────────────
  const buildSystemPrompt = () => {
    const info = interviewInfoRef.current
    const userName = info?.userName || 'Candidate'
    const jobPosition = info?.interviewData?.jobPosition || 'the position'
    const questions = Array.isArray(info?.interviewData?.QuestionList)
      ? info.interviewData.QuestionList.map((q, i) => 
          `${i + 1}. ${typeof q === 'string' ? q : q?.question}`
        ).join('\n')
      : 'No questions provided'

    return `You are a professional AI recruiter conducting a job interview.

Job Position: ${jobPosition}
Candidate: ${userName}

RULES:
1. Ask ONE question at a time from the list below
2. Keep responses SHORT (2-3 sentences)
3. After each answer, briefly acknowledge then ask next question
4. After all questions: ask if they have questions
5. End with: "Thank you so much ${userName}! We'll be in touch soon. Have a great day!"

QUESTIONS (ask in order):
${questions}`
  }

  // ── Speak using Browser Speech Synthesis ─────────────────────────────────
  const speak = (text) => {
    return new Promise((resolve) => {
      if (!text || isMutedRef.current) {
        resolve()
        return
      }

      setIsSpeaking(true)
      setCurrentMessage(text)
      setStatusMsg('AI is speaking...')

      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.95
      utterance.pitch = 1
      utterance.volume = 1

      const voices = window.speechSynthesis.getVoices()
      const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
                          voices.find(v => v.lang.startsWith('en')) ||
                          voices[0]
      if (englishVoice) utterance.voice = englishVoice

      utterance.onend = () => {
        setIsSpeaking(false)
        setStatusMsg('Waiting...')
        resolve()
      }

      utterance.onerror = () => {
        setIsSpeaking(false)
        resolve()
      }

      window.speechSynthesis.speak(utterance)
    })
  }

  // ── Initialize Audio Recording with Silence Detection ─────────────────────
  const startRecording = async () => {
    if (!streamRef.current || isMutedRef.current) return

    audioChunksRef.current = []
    setIsRecording(true)
    setStatusMsg('🎤 Speak now... (click "Done" or wait 5s silence)')

    // Create audio context for silence detection
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    audioContextRef.current = audioContext
    
    const source = audioContext.createMediaStreamSource(streamRef.current)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    analyserRef.current = analyser

    // Create MediaRecorder
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'
    
    const recorder = new MediaRecorder(streamRef.current, { mimeType })
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      setIsRecording(false)
      await processRecording()
    }

    recorder.start()

    // Silence detection - check audio levels every 200ms
    const checkSilence = () => {
      if (!recorder || recorder.state !== 'recording' || !callActiveRef.current) return

      const dataArray = new Uint8Array(analyserRef.current?.frequencyBinCount || 128)
      analyserRef.current?.getByteFrequencyData(dataArray)
      
      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
      
      // If very quiet for 3 seconds, stop recording
      if (average < 10) {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
        }
        silenceTimerRef.current = setTimeout(() => {
          if (recorder.state === 'recording') {
            console.log('[Audio] Silence detected - stopping')
            recorder.stop()
          }
        }, 3000)
      } else {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = setTimeout(() => {
            if (recorder.state === 'recording') {
              recorder.stop()
            }
          }, 5000) // Max 5 seconds of speech
        }
      }

      if (callActiveRef.current && recorder.state === 'recording') {
        requestAnimationFrame(checkSilence)
      }
    }

    requestAnimationFrame(checkSilence)
  }

  // ── Stop recording manually ───────────────────────────────────────────────
  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
    }
  }

  // ── Process recording ────────────────────────────────────────────────────
  const processRecording = async () => {
    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
    
    if (blob.size < 5000) {
      console.log('[Audio] Too short, ignoring')
      setStatusMsg('No speech detected. Speak again...')
      if (callActiveRef.current) {
        setTimeout(() => startRecording(), 1000)
      }
      return
    }

    setStatusMsg('Processing your answer...')

    try {
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')

      const res = await fetch('/api/deepgram-stt', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Transcription failed')
      
      const data = await res.json()
      const text = data.text?.trim()

      if (!text || text.length < 2) {
        setStatusMsg("Couldn't understand. Try again...")
        if (callActiveRef.current) {
          setTimeout(() => startRecording(), 1000)
        }
        return
      }

      console.log('[STT] Got text:', text)
      await handleUserResponse(text)

    } catch (err) {
      console.error('[STT] Error:', err)
      setStatusMsg('Error processing. Try again...')
      if (callActiveRef.current) {
        setTimeout(() => startRecording(), 1000)
      }
    }
  }

  // ── Handle user response ─────────────────────────────────────────────────
  const handleUserResponse = async (text) => {
    if (!text || isProcessingRef.current || !callActiveRef.current) return

    isProcessingRef.current = true

    // Save to transcript
    const entry = { speaker: 'user', text: text, timestamp: new Date().toISOString() }
    transcriptsRef.current = [...transcriptsRef.current, entry]
    setTranscript([...transcriptsRef.current])

    setStatusMsg('AI is thinking...')

    conversationRef.current.push({ role: 'user', content: text })

    try {
      const res = await fetch('/api/ai-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationRef.current.slice(-10),
          systemPrompt: systemPromptRef.current,
        }),
      })

      const data = await res.json()
      const aiMessage = data.message || 'Thank you. Next question please.'

      conversationRef.current.push({ role: 'assistant', content: aiMessage })
      transcriptsRef.current.push({
        speaker: 'agent',
        text: aiMessage,
        timestamp: new Date().toISOString(),
      })
      setTranscript([...transcriptsRef.current])

      // Check for end
      const endPhrases = ['thank you so much', 'we will be in touch', 'have a great day', 'goodbye']
      const shouldEnd = endPhrases.some(p => aiMessage.toLowerCase().includes(p))

      await speak(aiMessage)

      if (!callActiveRef.current) return

      if (shouldEnd) {
        setTimeout(() => endInterview(), 2000)
        return
      }

      // Continue with next question
      isProcessingRef.current = false
      setTimeout(() => {
        if (callActiveRef.current) {
          startRecording()
        }
      }, 1000)

    } catch (err) {
      console.error('[AI] Error:', err)
      isProcessingRef.current = false
      setStatusMsg('Error. Try again...')
      if (callActiveRef.current) {
        setTimeout(() => startRecording(), 1000)
      }
    }
  }

  // ── Start Interview ───────────────────────────────────────────────────────
  const startInterview = async () => {
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
    } catch {
      setError('Microphone access denied')
      return
    }

    callActiveRef.current = true
    isProcessingRef.current = false
    conversationRef.current = []
    transcriptsRef.current = []
    setTranscript([])
    startTimeRef.current = new Date().toISOString()
    systemPromptRef.current = buildSystemPrompt()

    setCallStatus('active')
    setStatusMsg('Starting...')

    const info = interviewInfoRef.current
    const userName = info?.userName || 'there'
    const jobPosition = info?.interviewData?.jobPosition || 'the position'

    // Opening
    const opening = `Hi ${userName}! Welcome to your ${jobPosition} interview. I'm your AI Recruiter today. Are you ready to begin?`
    transcriptsRef.current.push({ speaker: 'agent', text: opening, timestamp: new Date().toISOString() })
    conversationRef.current.push({ role: 'assistant', content: opening })

    await speak(opening)

    if (!callActiveRef.current) return

    // First question
    const questions = Array.isArray(info?.interviewData?.QuestionList) ? info.interviewData.QuestionList : []
    if (questions.length > 0) {
      const firstQ = typeof questions[0] === 'string' ? questions[0] : questions[0]?.question
      const firstMsg = `Here's your first question: ${firstQ}`
      
      transcriptsRef.current.push({ speaker: 'agent', text: firstMsg, timestamp: new Date().toISOString() })
      conversationRef.current.push({ role: 'assistant', content: firstMsg })
      
      await speak(firstMsg)
    }

    if (!callActiveRef.current) return

    // Start recording
    setTimeout(() => {
      if (callActiveRef.current) {
        startRecording()
      }
    }, 500)
  }

  // ── End Interview ─────────────────────────────────────────────────────────
  const endInterview = async () => {
    if (!callActiveRef.current) return
    callActiveRef.current = false
    
    stopRecording()
    window.speechSynthesis.cancel()
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    setCallStatus('ended')
    setIsSpeaking(false)
    setIsRecording(false)

    await saveReport()
  }

  // ── Save Report ───────────────────────────────────────────────────────────
  const saveReport = async () => {
    setSavingReport(true)
    const info = interviewInfoRef.current

    try {
      toast.loading('Generating report...', { id: 'report' })

      const transcriptRes = await fetch('/api/save-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: info?.interviewData?.interview_id,
          candidateName: info?.userName,
          candidateEmail: info?.userEmail ?? null,
          jobPosition: info?.interviewData?.jobPosition,
          transcript: transcriptsRef.current,
          duration: formatTime(elapsedRef.current),
          startedAt: startTimeRef.current,
          endedAt: new Date().toISOString(),
        }),
      })

      let transcriptId = null
      if (transcriptRes.ok) {
        const td = await transcriptRes.json()
        transcriptId = td.transcriptId
      }

      const evalRes = await fetch('/api/evaluate-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptId,
          transcript: transcriptsRef.current,
          candidateName: info?.userName,
          candidateEmail: info?.userEmail ?? null,
          jobPosition: info?.interviewData?.jobPosition,
          jobDescription: info?.interviewData?.jobDescription,
          questionList: info?.interviewData?.QuestionList ?? [],
          interviewId: info?.interviewData?.interview_id,
        }),
      })

      if (evalRes.ok) {
        toast.success('Report generated!', { id: 'report' })
        setReportReady(true)
      }
    } catch (err) {
      console.error('[Report] Error:', err)
    } finally {
      setSavingReport(false)
    }
  }

  // ── Toggle Mute ────────────────────────────────────────────────────────────
  const toggleMute = () => {
    isMutedRef.current = !isMutedRef.current
    setIsMuted(isMutedRef.current)
    if (isMutedRef.current) {
      window.speechSynthesis.cancel()
      stopRecording()
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      callActiveRef.current = false
      window.speechSynthesis.cancel()
      stopRecording()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return (
    <div className='p-6 lg:px-40 xl:px-50'>

      <h2 className='font-bold text-xl flex justify-between items-center'>
        AI Interview Session
        <span className='flex gap-2 items-center text-gray-600'>
          <Timer className='h-5 w-5' />
          {formatTime(elapsed)}
        </span>
      </h2>

      {/* Current Message */}
      {currentMessage && (
        <div className='mt-4 p-4 bg-blue-50 rounded-lg'>
          <p className='text-sm text-gray-600'>{isSpeaking ? '🤖 AI:' : '💬'}</p>
          <p className='text-gray-800 mt-1'>{currentMessage}</p>
        </div>
      )}

      {/* Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-5 mt-5'>

        {/* AI Recruiter */}
        <div className={`bg-white h-[280px] rounded-xl border-2 flex flex-col gap-3 items-center justify-center
          ${isSpeaking ? 'border-primary shadow-lg' : 'border-gray-200'}`}>
          <div className='relative'>
            <Image src='/interview.png' alt='AI' width={80} height={80}
              className='w-[80px] h-[80px] rounded-full object-cover' />
            {isSpeaking && (
              <span className='absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white animate-ping' />
            )}
          </div>
          <h2 className='font-semibold text-gray-800'>AI Recruiter</h2>
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${
            isSpeaking ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
          }`}>
            {isSpeaking ? '🔊 Speaking' : '👂 Ready'}
          </span>
        </div>

        {/* Candidate */}
        <div className={`bg-white h-[280px] rounded-xl border-2 flex flex-col gap-3 items-center justify-center
          ${isRecording ? 'border-green-400 shadow-lg' : 'border-gray-200'}`}>
          <div className='w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-3xl font-bold'>
            {interviewInfo?.userName?.[0]?.toUpperCase() ?? '?'}
          </div>
          <h2 className='font-semibold text-gray-800'>{interviewInfo?.userName || 'Candidate'}</h2>
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${
            isRecording ? 'bg-green-100 text-green-600 animate-pulse' : 
            callStatus === 'active' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
          }`}>
            {isRecording ? '🎤 Speak now!' : callStatus === 'active' ? '👂 Your turn' : '○ Waiting'}
          </span>
        </div>
      </div>

      {/* Status */}
      <p className='text-sm text-gray-500 text-center mt-4 font-medium'>{statusMsg}</p>

      {/* Start */}
      {callStatus === 'idle' && (
        <div className='flex justify-center mt-6'>
          <Button onClick={startInterview} size='lg' className='px-10 py-6 text-base font-bold rounded-xl'>
            <Phone className='h-5 w-5 mr-2' />
            Start Interview
          </Button>
        </div>
      )}

      {/* Controls */}
      {callStatus === 'active' && (
        <div className='flex items-center gap-4 justify-center mt-6'>
          {isRecording && (
            <Button onClick={stopRecording} className='bg-green-500 hover:bg-green-600 text-white font-bold'>
              ✓ Done Speaking
            </Button>
          )}
          <button onClick={toggleMute}>
            {isMuted
              ? <MicOff className='h-12 w-12 p-3 bg-yellow-500 text-white rounded-full' />
              : <Mic className='h-12 w-12 p-3 bg-gray-500 text-white rounded-full' />
            }
          </button>
          <AlertConfirmation onConfirm={endInterview}>
            <Phone className='h-12 w-12 p-3 bg-red-500 text-white rounded-full' />
          </AlertConfirmation>
        </div>
      )}

      {/* Ended */}
      {callStatus === 'ended' && (
        <div className='flex flex-col items-center gap-3 mt-6'>
          {savingReport ? (
            <div className='flex items-center gap-2'>
              <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-primary' />
              <span>Generating report...</span>
            </div>
          ) : (
            <>
              {reportReady && <p className='text-green-600'>✓ Report saved</p>}
              <Button onClick={() => router.push('/dashboard/interview-feedbacks')}>
                <FileText className='h-4 w-4 mr-2' />
                View Reports
              </Button>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className='mt-4 p-4 bg-red-50 rounded-xl text-center'>
          <p className='text-red-600'>{error}</p>
          <Button onClick={startInterview} size='sm' variant='outline' className='mt-3'>Try Again</Button>
        </div>
      )}

    </div>
  )
}
