"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from 'sonner'
import { Button } from "@/components/ui/button";
import { Loader2Icon, AlertCircle, CheckCircle } from "lucide-react";
import QuestionListContainer from "./QuestionListContainer";
import { useUser } from "@/app/provider";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/services/supabaseClient";

function QuestionList({ formData, onCreateLink }) {
  const [loading, setLoading] = useState(true);
  const [questionsList, setQuestionsList] = useState([]);
  const [generating, setGenerating] = useState(false);
  const { user } = useUser();
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (formData) {
      GenerateQuestionList();
    }
  }, [formData]);

  const GenerateQuestionList = async () => {
    setLoading(true);
    setGenerating(true);
    setError(null);

    try {
      const result = await axios.post("/api/ai-model", {
        ...formData,
      });

      let content = result?.data?.content;

      if (!content) {
        setError("No content returned from AI")
        toast.error("No content returned from AI");
        setLoading(false);
        return;
      }

      // Remove markdown formatting if AI returns ```json blocks
      const cleanedContent = content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      // Parse JSON safely
      let parsedData;
      try {
        parsedData = JSON.parse(cleanedContent);
      } catch (err) {
        console.error("JSON Parse Error:", err);
        setError("Invalid response format from AI")
        toast.error("AI returned invalid JSON format");
        setLoading(false);
        return;
      }

      // Handle both formats:
      if (Array.isArray(parsedData)) {
        setQuestionsList(parsedData);
      } else if (parsedData?.interviewQuestions) {
        setQuestionsList(parsedData.interviewQuestions);
      } else if (parsedData?.questions) {
        setQuestionsList(parsedData.questions);
      } else {
        setError("Unexpected response format from AI")
        toast.error("Unexpected AI response format");
      }

      setLoading(false);
    } catch (e) {
      console.error(e);
      setError("Failed to generate questions. Please try again.")
      toast.error("Server Error, Try Again!");
      setLoading(false);
    } finally {
      setGenerating(false);
    }
  };

  const regenerateQuestions = () => {
    GenerateQuestionList()
  }

  const onFinish = async () => {
    if (!questionsList || questionsList.length === 0) {
      toast.error("No questions to save");
      return;
    }
    
    if (!user?.email) {
      toast.error("You must be logged in to create an interview");
      return;
    }

    setSaveLoading(true);
    const interview_id = uuidv4();

    try {
      const { data, error } = await supabase
        .from('interviews')
        .insert({
          ...formData,
          QuestionList: questionsList,
          userEmail: user.email,
          interview_id: interview_id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase Insert Error:", error);
        toast.error("Failed to save interview: " + error.message);
        return;
      }

      toast.success("Interview created successfully!");
      onCreateLink(interview_id)
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error occurred.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div>
      {/* Loading State */}
      {loading && (
        <div className="p-8 bg-blue-50 rounded-xl border border-blue-200 flex flex-col items-center justify-center text-center">
          <Loader2Icon className="h-10 w-10 animate-spin text-primary mb-4" />
          <h2 className="font-semibold text-lg">Generating Interview Questions</h2>
          <p className="text-primary mt-2 max-w-md">
            Our AI is crafting personalized questions based on your job position...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-6 bg-red-50 rounded-xl border border-red-200 flex flex-col items-center text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
          <h2 className="font-semibold text-red-700">{error}</h2>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={regenerateQuestions}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              'Try Again'
            )}
          </Button>
        </div>
      )}

      {/* Questions Display */}
      {!loading && !error && questionsList?.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">
              Generated Questions ({questionsList.length})
            </h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={regenerateQuestions}
              disabled={generating}
            >
              {generating ? (
                <Loader2Icon className="h-4 w-4 mr-1 animate-spin" />
              ) : null}
              Regenerate
            </Button>
          </div>
          
          <QuestionListContainer questionsList={questionsList} />
          
          {/* Summary */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg flex gap-6 text-sm text-gray-600">
            <span>
              <strong>{questionsList.length}</strong> questions generated
            </span>
            <span>
              <strong>{formData?.duration}</strong> interview duration
            </span>
            <span>
              <strong>{formData?.type?.length || 0}</strong> interview types
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && questionsList?.length === 0 && (
        <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center text-center">
          <p className="text-gray-500 mt-2">No questions generated yet.</p>
          <Button 
            className="mt-4"
            onClick={regenerateQuestions}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Questions'
            )}
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between mt-10">
        <div className="text-sm text-gray-500 flex items-center">
          {questionsList?.length > 0 && (
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Ready to create interview
            </span>
          )}
        </div>
        
        <Button 
          onClick={onFinish}
          disabled={saveLoading || questionsList?.length === 0 || !user?.email}
          className="min-w-[200px]"
        >
          {saveLoading ? (
            <>
              <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Create Interview Link'
          )}
        </Button>
      </div>
      
      {!user?.email && (
        <p className="text-red-500 text-xs mt-2 text-right">
          Please log in to save the interview
        </p>
      )}
    </div>
  );
}

export default QuestionList;
