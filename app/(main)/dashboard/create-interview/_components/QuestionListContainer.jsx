import React from 'react'

function QuestionListContainer({ questionsList = [] }) {
  if (!questionsList || questionsList.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No questions generated yet.
      </div>
    )
  }

  return (
    <div>
      <h2 className="font-bold text-lg mb-5">Generated Questions:</h2>
      <div className="mt-4 p-5 border border-gray-300 rounded-xl bg-white">
        {questionsList.map((q, index) => (
          <div key={index} className="mt-2 p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow">
            <h3 className="font-medium text-gray-800">
              {index + 1}. {q.question || q}
            </h3>
            {q.type && (
              <p className="text-sm text-primary mt-1 font-medium">
                Type: {q.type}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default QuestionListContainer
