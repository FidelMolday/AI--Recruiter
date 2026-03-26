'use client'
import React, { useContext, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { InterviewDataContext } from '@/context/InterviewDataContext'
import { Phone, Mic, MicOff, Timer, FileText, Loader2, Send, MessageSquare } from 'lucide-react'
import AlertConfirmation from './_components/AlertConfirmation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Textarea } from '@/components/ui/textarea'

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
  const audioChunksRef = useRef([])
  const silenceTimerRef = useRef(null)
  const hasStartedSpeakingRef = useRef(false)
  
  const conversationRef = useRef([])
  const transcriptsRef = useRef([])
  const systemPromptRef = useRef('')
  const startTimeRef = useRef(null)
  const elapsedRef = useRef(0)
  const interviewInfoRef = useRef(null)
  const questionIndexRef = useRef(0)

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
  const [manualInput, setManualInput] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)

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
    const jobDesc = info?.interviewData?.jobDescription || ''
    const questions = Array.isArray(info?.interviewData?.QuestionList)
      ? info.interviewData.QuestionList.map((q, i) => 
          `${i + 1}. ${typeof q === 'string' ? q : (q?.question || q)}`
        ).join('\n')
      : 'No questions provided'

    return `You are a professional AI recruiter conducting a job interview.

Job Position: ${jobPosition}
Job Description: ${jobDesc}
Candidate Name: ${userName}

YOUR GOAL:
Conduct a natural, interactive voice interview. 

RULES:
1. Ask ONE question at a time.
2. DO NOT repeat questions you have already asked.
3. Keep your responses SHORT and CONVERSATIONAL (1-3 sentences max).
4. After the user answers, briefly acknowledge their point then ask the next question from the list.
5. If the user's answer is too brief, you can ask a quick follow-up.
6. Once you have asked all questions in the list below, YOU MUST THANK THE CANDIDATE AND END THE INTERVIEW IMMEDIATELY.
7. To end the interview, you MUST use exactly this phrase: "Thank you so much ${userName}! We'll be in touch soon. Have a great day!"

QUESTIONS TO ASK (FOLLOW THIS ORDER):
${questions}`
  }

  // ── Speak using Deepgram TTS (with fallback) ───────────────────────────
  const speak = async (text) => {
    if (!text || !callActiveRef.current) return

    setIsSpeaking(true)
    setCurrentMessage(text)
    setStatusMsg('AI is speaking...')

    try {
      const res = await fetch('/api/deepgram-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.audio && !isMutedRef.current) {
          return new Promise((resolve) => {
            const audio = new Audio(data.audio)
            audio.onended = () => {
              setIsSpeaking(false)
              setStatusMsg('Waiting for your response...')
              resolve()
            }
            audio.onerror = (e) => {
              setIsSpeaking(false)
              resolve()
            }
            audio.play().catch(err => {
              fallbackSpeak(text).then(resolve)
            })
          })
        }
      }
    } catch (err) {
      console.warn('[TTS] Deepgram failed, using fallback')
    }

    return fallbackSpeak(text)
  }

  const fallbackSpeak = (text) => {
    return new Promise((resolve) => {
      if (!text || !callActiveRef.current) {
        resolve()
        return
      }

      if (isMutedRef.current) {
        setStatusMsg('AI is "speaking" (muted)...')
        setTimeout(resolve, 1000)
        return
      }

      setIsSpeaking(true)
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(v => (v.name.includes('Google') || v.name.includes('Premium')) && v.lang.startsWith('en')) ||
                            voices.find(v => v.lang.startsWith('en')) ||
                            voices[0]
      if (preferredVoice) utterance.voice = preferredVoice

      utterance.onend = () => {
        setIsSpeaking(false)
        setStatusMsg('Waiting for your response...')
        resolve()
      }
      utterance.onerror = () => {
        setIsSpeaking(false)
        resolve()
      }

      window.speechSynthesis.speak(utterance)
    })
  }

  // ── Audio Handling (STT via MediaRecorder) ────────────────────────────────
  const startListening = async () => {
    if (!callActiveRef.current || isProcessingRef.current || isSpeaking) return
    if (isMutedRef.current) return

    try {
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      }

      audioChunksRef.current = []
      hasStartedSpeakingRef.current = false
      setIsRecording(true)
      setStatusMsg('🎤 Listening... (Speak now)')

      // Setup Analyzer for Silence Detection
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      // Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
      const recorder = new MediaRecorder(streamRef.current, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        setIsRecording(false)
        processAudio()
      }

      recorder.start()
      monitorSilence()

    } catch (e) {
      console.error('Start listening error:', e)
      setError('Could not access microphone.')
    }
  }

  const monitorSilence = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyserRef.current.getByteFrequencyData(dataArray)

    const volume = dataArray.reduce((a, b) => a + b, 0) / bufferLength
    
    if (volume > 15) { // Speech detected
      hasStartedSpeakingRef.current = true
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
    } else if (hasStartedSpeakingRef.current) { // Silence after speech
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          if (mediaRecorderRef.current?.state === 'recording') {
            console.log('[Audio] Silence detected, stopping...')
            mediaRecorderRef.current.stop()
          }
        }, 1800) // 1.8s of silence to trigger
      }
    }

    if (mediaRecorderRef.current?.state === 'recording') {
      requestAnimationFrame(monitorSilence)
    }
  }

  const stopListening = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  const processAudio = async () => {
    if (audioChunksRef.current.length === 0) return

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
    if (audioBlob.size < 1000) { // Too small, likely noise
      if (callActiveRef.current && !isProcessingRef.current && !isSpeaking) {
        startListening()
      }
      return
    }

    setStatusMsg('Processing your answer...')
    
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')

    try {
      const res = await fetch('/api/deepgram-stt', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        if (data.text?.trim()) {
          console.log('[STT] Result:', data.text)
          await handleUserResponse(data.text)
        } else {
          startListening()
        }
      } else {
        throw new Error('STT failed')
      }
    } catch (e) {
      console.error('STT Error:', e)
      setStatusMsg('Error processing voice. Retrying...')
      setTimeout(() => startListening(), 2000)
    }
  }

  // ── Handle Response (Voice or Text) ──────────────────────────────────────
  const handleUserResponse = async (text) => {
    if (!text || isProcessingRef.current || !callActiveRef.current) return

    isProcessingRef.current = true
    setStatusMsg('AI is thinking...')
    setManualInput('')

    // Save to transcript
    const entry = { speaker: 'user', text: text, timestamp: new Date().toISOString() }
    transcriptsRef.current = [...transcriptsRef.current, entry]
    setTranscript([...transcriptsRef.current])

    conversationRef.current.push({ role: 'user', content: text })

    try {
      // Logic to track progress
      const info = interviewInfoRef.current
      const questions = Array.isArray(info?.interviewData?.QuestionList) ? info.interviewData.QuestionList : []
      
      // If we are at the end, suggest AI to say goodbye
      const totalQuestions = questions.length
      const currentPrompt = systemPromptRef.current + 
        (questionIndexRef.current >= totalQuestions - 1 
          ? "\n\nCRITICAL: All questions have been covered. Do NOT ask any more questions. Acknowledge and END THE INTERVIEW NOW using the required phrase." 
          : "")

      const res = await fetch('/api/ai-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationRef.current.slice(-10),
          systemPrompt: currentPrompt,
        }),
      })

      if (!res.ok) throw new Error('AI request failed')
      
      const data = await res.json()
      const aiMessage = data.message || 'I see. Let\'s move to the next question.'

      // Increment tracker if the AI didn't end yet (rough estimate)
      questionIndexRef.current += 1

      conversationRef.current.push({ role: 'assistant', content: aiMessage })
      transcriptsRef.current.push({
        speaker: 'agent',
        text: aiMessage,
        timestamp: new Date().toISOString(),
      })
      setTranscript([...transcriptsRef.current])

      const endPhrases = ['thank you so much', 'we\'ll be in touch', 'have a great day', 'goodbye', 'best of luck']
      const shouldEnd = endPhrases.some(p => aiMessage.toLowerCase().includes(p))

      await speak(aiMessage)

      if (!callActiveRef.current) return

      if (shouldEnd || questionIndexRef.current > totalQuestions + 1) {
        console.log('[Interview] Final message detected or limit reached - ending')
        setTimeout(() => endInterview(), 1500)
        return
      }

      isProcessingRef.current = false
      startListening()

    } catch (err) {
      console.error('[AI] Error:', err)
      isProcessingRef.current = false
      setStatusMsg('Connection issue. Please wait...')
      setTimeout(() => startListening(), 3000)
    }
  }

  const handleManualSubmit = (e) => {
    e?.preventDefault()
    if (!manualInput.trim() || isProcessingRef.current) return
    stopListening()
    handleUserResponse(manualInput)
  }

  // ── Life Cycle ───────────────────────────────────────────────────────────
  const startInterview = async () => {
    setError(null)
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError('Microphone access denied. Please allow mic access to continue.')
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
    setStatusMsg('Initializing...')

    const info = interviewInfoRef.current
    const userName = info?.userName || 'Candidate'
    const jobPosition = info?.interviewData?.jobPosition || 'the position'

    const opening = `Hi ${userName}! Welcome to your ${jobPosition} interview. I'm your AI Recruiter. I'll ask you a few questions. Ready?`
    
    transcriptsRef.current.push({ speaker: 'agent', text: opening, timestamp: new Date().toISOString() })
    conversationRef.current.push({ role: 'assistant', content: opening })

    await speak(opening)

    if (!callActiveRef.current) return

    const questions = Array.isArray(info?.interviewData?.QuestionList) ? info.interviewData.QuestionList : []
    if (questions.length > 0) {
      const firstQ = typeof questions[0] === 'string' ? questions[0] : (questions[0]?.question || questions[0])
      const firstMsg = `Great. First question: ${firstQ}`
      
      transcriptsRef.current.push({ speaker: 'agent', text: firstMsg, timestamp: new Date().toISOString() })
      conversationRef.current.push({ role: 'assistant', content: firstMsg })
      
      await speak(firstMsg)
    }

    if (!callActiveRef.current) return
    startListening()
  }

  const endInterview = async () => {
    if (!callActiveRef.current) return
    callActiveRef.current = false
    
    stopListening()
    window.speechSynthesis.cancel()
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    setCallStatus('ended')
    setIsSpeaking(false)
    setIsRecording(false)
    setStatusMsg('Interview completed.')

    await saveReport()
  }

  const saveReport = async () => {
    setSavingReport(true)
    const info = interviewInfoRef.current

    try {
      toast.loading('Saving responses...', { id: 'report' })

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

      toast.loading('AI Analysis in progress...', { id: 'report' })

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
        toast.success('Evaluation complete!', { id: 'report' })
        setReportReady(true)
      } else {
        toast.error('Partial success: transcript saved.', { id: 'report' })
      }
    } catch (err) {
      console.error('[Report] Error:', err)
      toast.error('Error saving data.', { id: 'report' })
    } finally {
      setSavingReport(false)
    }
  }

  const toggleMute = () => {
    isMutedRef.current = !isMutedRef.current
    setIsMuted(isMutedRef.current)
    if (isMutedRef.current) {
      window.speechSynthesis.cancel()
      stopListening()
    } else {
      if (callActiveRef.current && !isSpeaking && !isProcessingRef.current) {
        startListening()
      }
    }
  }

  useEffect(() => {
    return () => {
      callActiveRef.current = false
      window.speechSynthesis.cancel()
      stopListening()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  return (
    <div className='p-6 lg:px-40 xl:px-50 min-h-screen bg-gray-50/50'>

      <div className='max-w-4xl mx-auto'>
        <h2 className='font-bold text-2xl flex justify-between items-center text-gray-800'>
          Interview Session
          <span className='flex gap-2 items-center text-gray-500 text-lg font-mono bg-white px-4 py-1 rounded-full shadow-sm border'>
            <Timer className='h-5 w-5 text-primary' />
            {formatTime(elapsed)}
          </span>
        </h2>

        {/* Current message visualization */}
        <div className='mt-8 mb-4 min-h-[120px] flex flex-col items-center justify-center text-center px-4'>
           {isSpeaking ? (
             <div className='animate-in fade-in zoom-in duration-300'>
                <p className='text-primary font-medium mb-2 flex items-center justify-center gap-2'>
                  <Loader2 className='h-4 w-4 animate-spin' /> AI Recruiter is speaking
                </p>
                <p className='text-xl text-gray-700 italic max-w-2xl font-medium'>"{currentMessage}"</p>
             </div>
           ) : isRecording ? (
             <div className='animate-pulse flex flex-col items-center'>
                <p className='text-green-600 font-bold mb-4 uppercase tracking-widest text-sm'>Listening to you...</p>
                <div className='flex gap-1.5 justify-center items-end h-10'>
                  {[1,2,3,4,5,6,7,8].map(i => (
                    <div key={i} className='w-1.5 bg-green-500 rounded-full animate-bounce' 
                      style={{ height: `${Math.random() * 30 + 10}px`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
             </div>
           ) : isProcessingRef.current ? (
             <div className='flex flex-col items-center gap-3'>
               <Loader2 className='h-10 w-10 animate-spin text-primary' />
               <p className='text-gray-600 font-medium'>Analyzing your response...</p>
             </div>
           ) : callStatus === 'active' ? (
             <div className='flex flex-col items-center gap-2'>
               <p className='text-gray-400 font-medium'>Waiting for your answer</p>
               <Button variant="ghost" size="sm" onClick={() => setShowManualInput(!showManualInput)} className="text-xs text-primary">
                 {showManualInput ? "Hide manual input" : "I prefer to type my answer"}
               </Button>
             </div>
           ) : null}
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mt-5'>

          {/* AI Recruiter */}
          <div className={`bg-white p-8 rounded-3xl border-2 transition-all duration-500 flex flex-col gap-4 items-center justify-center
            ${isSpeaking ? 'border-primary shadow-2xl scale-105' : 'border-gray-100 shadow-md'}`}>
            <div className='relative'>
              <div className={`absolute -inset-4 rounded-full bg-primary/10 animate-pulse ${isSpeaking ? 'block' : 'hidden'}`} />
              <div className='w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center border-4 border-white shadow-inner'>
                <Image src='/interview.png' alt='AI' width={60} height={60} className='rounded-full' />
              </div>
              {isSpeaking && (
                <span className='absolute bottom-1 right-1 w-6 h-6 bg-primary rounded-full border-4 border-white flex items-center justify-center'>
                  <span className='w-2 h-2 bg-white rounded-full animate-ping' />
                </span>
              )}
            </div>
            <div className='text-center'>
              <h2 className='font-bold text-xl text-gray-800'>AI Recruiter</h2>
              <p className='text-sm text-gray-500'>HR Specialist</p>
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full ${
              isSpeaking ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-100 text-gray-400'
            }`}>
              {isSpeaking ? 'Speaking' : 'Waiting'}
            </span>
          </div>

          {/* Candidate */}
          <div className={`bg-white p-8 rounded-3xl border-2 transition-all duration-500 flex flex-col gap-4 items-center justify-center
            ${isRecording ? 'border-green-500 shadow-2xl scale-105' : 'border-gray-100 shadow-md'}`}>
            <div className='relative'>
              <div className={`absolute -inset-4 rounded-full bg-green-500/10 animate-pulse ${isRecording ? 'block' : 'hidden'}`} />
              <div className='w-24 h-24 bg-gradient-to-br from-primary to-blue-600 text-white rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white shadow-lg'>
                {interviewInfo?.userName?.[0]?.toUpperCase() ?? 'C'}
              </div>
              {isRecording && (
                <span className='absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white flex items-center justify-center'>
                  <Mic className='h-3 w-3 text-white' />
                </span>
              )}
            </div>
            <div className='text-center'>
              <h2 className='font-bold text-xl text-gray-800'>{interviewInfo?.userName || 'Candidate'}</h2>
              <p className='text-sm text-gray-500'>Interviewee</p>
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full ${
              isRecording ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 
              callStatus === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
            }`}>
              {isRecording ? 'Listening' : callStatus === 'active' ? 'Your Turn' : 'Standby'}
            </span>
          </div>
        </div>

        {/* Manual Input Fallback */}
        {callStatus === 'active' && showManualInput && (
          <div className='mt-8 animate-in slide-in-from-top-4 duration-300'>
            <form onSubmit={handleManualSubmit} className='bg-white p-4 rounded-2xl border border-primary/20 shadow-lg flex gap-2'>
              <Textarea 
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Type your answer here if voice isn't working..."
                className="flex-1 min-h-[80px] resize-none border-none focus-visible:ring-0 text-base"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleManualSubmit()
                  }
                }}
              />
              <Button type="submit" size="icon" className="h-12 w-12 rounded-xl self-end" disabled={!manualInput.trim() || isProcessingRef.current}>
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        )}

        {/* Controls */}
        <div className='flex flex-col items-center mt-12 gap-6'>
          
          <p className='text-sm text-gray-500 font-medium bg-gray-100 px-6 py-2 rounded-full border border-gray-200'>
            {statusMsg}
          </p>

          {callStatus === 'idle' && (
            <Button onClick={startInterview} size='lg' className='px-12 py-8 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform'>
              <Phone className='h-6 w-6 mr-3' />
              Start My Interview
            </Button>
          )}

          {callStatus === 'active' && (
            <div className='flex items-center gap-6'>
              <button 
                onClick={toggleMute}
                className={`p-5 rounded-full shadow-lg transition-all ${
                  isMuted 
                    ? 'bg-yellow-500 text-white ring-4 ring-yellow-500/20' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className='h-8 w-8' /> : <Mic className='h-8 w-8' />}
              </button>

              <AlertConfirmation onConfirm={endInterview}>
                <button className='p-6 bg-red-500 text-white rounded-full shadow-xl shadow-red-500/30 hover:bg-red-600 hover:scale-110 transition-all'>
                  <Phone className='h-10 w-10 rotate-[135deg]' />
                </button>
              </AlertConfirmation>

              {isRecording && (
                <Button onClick={stopListening} variant="outline" className="rounded-full h-14 px-6 border-2 border-green-500 text-green-600 font-bold hover:bg-green-50">
                   Done Speaking
                </Button>
              )}
              
              {!isRecording && !isProcessingRef.current && !isSpeaking && (
                <Button onClick={startListening} className="rounded-full h-14 px-8 font-bold">
                   <Mic className="mr-2 h-5 w-5" /> Speak Now
                </Button>
              )}
            </div>
          )}

          {callStatus === 'ended' && (
            <div className='flex flex-col items-center gap-4 bg-white p-8 rounded-3xl border border-gray-100 shadow-xl w-full max-w-md'>
              <h3 className='font-bold text-xl text-gray-800'>Interview Ended</h3>
              {savingReport ? (
                <div className='flex flex-col items-center gap-4'>
                   <div className='relative'>
                      <div className='h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin' />
                   </div>
                   <p className='text-gray-600 animate-pulse font-medium'>Analyzing your performance...</p>
                </div>
              ) : (
                <>
                  {reportReady ? (
                    <div className='text-center space-y-4'>
                      <div className='w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2'>
                        <FileText className='h-8 w-8' />
                      </div>
                      <p className='text-green-600 font-semibold'>Evaluation is ready!</p>
                      <Button onClick={() => router.push('/dashboard/interview-feedbacks')} className='w-full py-6 rounded-xl font-bold'>
                        View Results & Feedback
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => router.push('/dashboard')} variant='outline' className='w-full'>
                      Back to Dashboard
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className='mt-8 p-6 bg-red-50 rounded-2xl border border-red-100 text-center animate-in slide-in-from-bottom-4 duration-500'>
            <p className='text-red-600 font-medium mb-4'>{error}</p>
            <Button onClick={() => window.location.reload()} variant='destructive' className='font-bold px-8'>
              Refresh Page
            </Button>
          </div>
        )}
      </div>

    </div>
  )
}
