import React from 'react'
import Image from 'next/image'


function InterviewHeader() {
  return (
    <div className='p-4 shadow-sm'>
      <Image src={'/logo.svg'} alt='AI Recruiter' width={100} height={100}
      className='w-[80px]'
      />
    </div>
  )
}

export default InterviewHeader
