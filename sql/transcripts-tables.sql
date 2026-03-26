-- Drop and recreate with transcript and new evaluation format
DROP TABLE IF EXISTS public.interview_feedback CASCADE;

-- Transcripts table
CREATE TABLE public.interview_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT,
  job_position TEXT,
  transcript JSONB DEFAULT '[]',
  duration TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback/Evaluation table
CREATE TABLE public.interview_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID REFERENCES public.interview_transcripts(id),
  interview_id UUID NOT NULL,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT,
  job_position TEXT,
  
  -- New scoring format
  communication_score INTEGER,
  technical_knowledge_score INTEGER,
  confidence_score INTEGER,
  problem_solving_score INTEGER,
  overall_score INTEGER,
  recommendation TEXT,
  detailed_feedback TEXT,
  
  -- Legacy fields (kept for compatibility)
  category_scores JSONB DEFAULT '{}',
  overall_feedback TEXT,
  strengths TEXT[],
  improvements TEXT[],
  
  -- Status
  status TEXT DEFAULT 'pending',
  qualification_status TEXT DEFAULT 'pending',
  email_sent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.interview_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_evaluations ENABLE ROW LEVEL SECURITY;

-- Policies for transcripts
CREATE POLICY "Anyone can read transcripts" ON public.interview_transcripts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert transcripts" ON public.interview_transcripts FOR INSERT WITH CHECK (true);

-- Policies for evaluations
CREATE POLICY "Anyone can read evaluations" ON public.interview_evaluations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert evaluations" ON public.interview_evaluations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update evaluations" ON public.interview_evaluations FOR UPDATE USING (true);
