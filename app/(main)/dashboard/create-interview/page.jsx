"use client"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation';
import FormContainer from "./_components/FormContainer";
import QuestionList from "./_components/QuestionList";
import { toast } from 'sonner'
import InterviewLink from "./_components/InterviewLink";

function CreateInterview() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [interviewId, setInterviewId] = useState()
    const [formData, setFormData] = useState()
    const [completedSteps, setCompletedSteps] = useState([])

    const onHandleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const onGoToNext = () => {
        setCompletedSteps(prev => [...new Set([...prev, step])])
        setStep(prev => prev + 1)
    }

    const onGoBack = () => {
        if (step > 1) {
            setStep(prev => prev - 1)
        } else {
            router.back()
        }
    }

    const onCreateLink = (interview_id) => {
        setInterviewId(interview_id)
        setCompletedSteps(prev => [...new Set([...prev, 2])])
        setStep(3)
    }

    const stepTitles = ['Job Details', 'Generate Questions', 'Share Link']
    const stepDescriptions = [
        'Fill in job position and description',
        'AI generates personalized questions',
        'Share interview with candidates'
    ]

    return (
        <div className='mt-2 px-4 md:px-10 lg:px-20 xl:px-32'>
            {/* Header */}
            <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4'>
                <div className='flex items-center gap-3'>
                    <button 
                        onClick={onGoBack}
                        className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                    >
                        <ArrowLeft className='h-5 w-5' />
                    </button>
                    <div>
                        <h2 className='font-bold text-2xl'>Create New Interview</h2>
                        <p className='text-gray-500 text-sm'>
                            Step {step} of 3: {stepTitles[step - 1]}
                        </p>
                    </div>
                </div>
            </div>

            {/* Progress */}
            <div className='mb-6'>
                <div className='flex justify-between mb-2'>
                    {stepTitles.map((title, index) => (
                        <div 
                            key={index}
                            className={`flex items-center gap-2 ${
                                index + 1 <= step ? 'text-primary' : 'text-gray-400'
                            }`}
                        >
                            <div className={`
                                w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                                ${index + 1 < step ? 'bg-primary text-white' : 
                                  index + 1 === step ? 'bg-primary text-white' : 'bg-gray-200'}
                            `}>
                                {index + 1 < step ? <CheckCircle className='h-4 w-4' /> : index + 1}
                            </div>
                            <span className='hidden sm:inline text-sm font-medium'>{title}</span>
                        </div>
                    ))}
                </div>
                <Progress value={step * 33.33} className='h-2' />
            </div>

            {/* Step Content */}
            <div className='bg-white rounded-xl p-6 shadow-sm'>
                {step === 1 && (
                    <FormContainer 
                        onHandleInputChange={onHandleInputChange}
                        GoToNext={onGoToNext}
                    />
                )}
                
                {step === 2 && (
                    <QuestionList 
                        formData={formData} 
                        onCreateLink={onCreateLink} 
                    />
                )}
                
                {step === 3 && (
                    <InterviewLink 
                        interview_id={interviewId}
                        formData={formData}
                    />
                )}
            </div>

            {/* Navigation */}
            {step < 3 && (
                <div className='flex justify-between mt-6'>
                    <button
                        onClick={onGoBack}
                        className='flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors'
                    >
                        <ArrowLeft className='h-4 w-4' />
                        Back
                    </button>
                </div>
            )}
        </div>
    )
}

export default CreateInterview
