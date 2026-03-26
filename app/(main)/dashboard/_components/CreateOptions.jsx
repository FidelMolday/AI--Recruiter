import React from 'react'
import { Video, Phone, Clock } from "lucide-react";
import Link from 'next/link';

function CreateOptions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
      <Link 
        href='/dashboard/create-interview' 
        className="bg-white border-2 border-primary/20 rounded-xl p-6 flex flex-col gap-3 cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all group"
      >
        <div className="flex items-start justify-between">
          <Video className="p-3 text-primary bg-blue-50 rounded-lg h-14 w-14 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">
            Popular
          </span>
        </div>
        <div>
          <h2 className='font-bold text-lg text-gray-900'>AI Voice Interview</h2>
          <p className='text-gray-600 mt-1'>
            Create AI-powered voice interviews with smart questioning
          </p>
        </div>
        <div className='flex items-center gap-2 text-sm text-gray-500 mt-2'>
          <Clock className="h-4 w-4" />
          <span>5-60 minutes</span>
        </div>
      </Link>

      <div className="bg-white border-2 border-gray-100 rounded-xl p-6 flex flex-col gap-3 opacity-70">
        <div className="flex items-start justify-between">
          <Phone className="p-3 text-gray-400 bg-gray-50 rounded-lg h-14 w-14" />
          <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
            Coming Soon
          </span>
        </div>
        <div>
          <h2 className='font-bold text-lg text-gray-700'>Phone Screening</h2>
          <p className='text-gray-500 mt-1'>
            Automated phone screening calls with AI
          </p>
        </div>
        <div className='flex items-center gap-2 text-sm text-gray-400 mt-2'>
          <Clock className="h-4 w-4" />
          <span>Coming soon</span>
        </div>
      </div>
    </div>
  )
}

export default CreateOptions
