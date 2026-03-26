"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { InterviewType } from "@/services/Constants";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, AlertCircle } from "lucide-react";
import { toast } from 'sonner'

function FormContainer({ onHandleInputChange, GoToNext }) {
  const [interviewType, setInterviewType] = useState([])
  const [formData, setFormData] = useState({
    jobPosition: '',
    jobDescription: '',
    duration: '',
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  useEffect(() => {
    onHandleInputChange("type", interviewType);
  }, [interviewType]);

  const validateField = (name, value) => {
    switch (name) {
      case 'jobPosition':
        if (!value || value.trim().length < 2) {
          return 'Job position is required (min 2 characters)'
        }
        if (value.length > 100) {
          return 'Job position is too long (max 100 characters)'
        }
        return null
      case 'jobDescription':
        if (!value || value.trim().length < 10) {
          return 'Job description is required (min 10 characters)'
        }
        if (value.length > 5000) {
          return 'Job description is too long (max 5000 characters)'
        }
        return null
      case 'duration':
        if (!value) {
          return 'Please select an interview duration'
        }
        return null
      case 'type':
        if (!value || value.length === 0) {
          return 'Please select at least one interview type'
        }
        return null
      default:
        return null
    }
  }

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (touched[name]) {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
    
    onHandleInputChange(name, value)
  }

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    const error = validateField(name, formData[name])
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const handleSubmit = () => {
    // Mark all fields as touched
    setTouched({
      jobPosition: true,
      jobDescription: true,
      duration: true,
      type: true
    })

    // Validate all fields
    const newErrors = {
      jobPosition: validateField('jobPosition', formData.jobPosition),
      jobDescription: validateField('jobDescription', formData.jobDescription),
      duration: validateField('duration', formData.duration),
      type: validateField('type', interviewType),
    }

    setErrors(newErrors)

    // Check if there are any errors
    if (Object.values(newErrors).some(error => error)) {
      toast.error('Please fix the errors before continuing')
      return
    }

    GoToNext()
  }

  const AddInterviewType = (title) => {
    setInterviewType((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    )
    // Clear type error when user interacts
    if (interviewType.length === 0 && !touched.type) {
      setTouched(prev => ({ ...prev, type: true }))
    }
  }

  return (
    <div className="p-5 bg-white rounded-xl space-y-5">
      {/* Job Position */}
      <div>
        <label className="text-sm font-medium">
          Job Position <span className="text-red-500">*</span>
        </label>
        <Input
          placeholder="e.g. Full Stack Developer"
          className={`mt-2 ${errors.jobPosition && touched.jobPosition ? 'border-red-500 focus:ring-red-500' : ''}`}
          value={formData.jobPosition}
          onChange={(e) => handleChange('jobPosition', e.target.value)}
          onBlur={() => handleBlur('jobPosition')}
        />
        {errors.jobPosition && touched.jobPosition && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.jobPosition}
          </p>
        )}
      </div>

      {/* Job Description */}
      <div>
        <label className="text-sm font-medium">
          Job Description <span className="text-red-500">*</span>
        </label>
        <Textarea
          placeholder="Enter detailed job description including requirements, responsibilities, and qualifications..."
          className={`h-[200px] mt-2 ${errors.jobDescription && touched.jobDescription ? 'border-red-500 focus:ring-red-500' : ''}`}
          value={formData.jobDescription}
          onChange={(e) => handleChange('jobDescription', e.target.value)}
          onBlur={() => handleBlur('jobDescription')}
        />
        <div className="flex justify-between mt-1">
          {errors.jobDescription && touched.jobDescription && (
            <p className="text-red-500 text-xs flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.jobDescription}
            </p>
          )}
          <p className="text-gray-400 text-xs ml-auto">
            {formData.jobDescription.length}/5000
          </p>
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="text-sm font-medium">
          Interview Duration <span className="text-red-500">*</span>
        </label>
        <Select
          value={formData.duration}
          onValueChange={(value) => handleChange('duration', value)}
        >
          <SelectTrigger className={`w-full mt-2 ${errors.duration && touched.duration ? 'border-red-500' : ''}`}>
            <SelectValue placeholder="Select Duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="5 Min">5 Min - Quick Screening</SelectItem>
              <SelectItem value="15 Min">15 Min - Brief Interview</SelectItem>
              <SelectItem value="30 Min">30 Min - Standard Interview</SelectItem>
              <SelectItem value="45 Min">45 Min - Detailed Interview</SelectItem>
              <SelectItem value="60 Min">60 Min - Comprehensive</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        {errors.duration && touched.duration && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.duration}
          </p>
        )}
      </div>

      {/* Interview Type */}
      <div>
        <label className="text-sm font-medium">
          Interview Type <span className="text-red-500">*</span>
        </label>

        <div className="flex gap-3 flex-wrap mt-2">
          {InterviewType.map((type, index) => (
            <div
              key={index}
              onClick={() => AddInterviewType(type.title)}
              className={`flex items-center cursor-pointer
                gap-2 p-2 px-4 border rounded-2xl
                transition-all duration-200 select-none
                ${
                  interviewType.includes(type.title)
                    ? "bg-primary/10 text-primary border-primary"
                    : "bg-white border-gray-300 hover:bg-secondary hover:border-gray-400"
                }`}
            >
              <type.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{type.title}</span>
            </div>
          ))}
        </div>
        {errors.type && touched.type && (
          <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.type}
          </p>
        )}
      </div>

      {/* Button */}
      <div className="mt-7 flex justify-end">
        <Button 
          onClick={handleSubmit}
          className="min-w-[180px]"
        >
          Generate Questions <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default FormContainer;
