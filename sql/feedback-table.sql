-- Drop and recreate with additional fields
DROP TABLE IF EXISTS public.interview_feedback CASCADE;

CREATE TABLE public.interview_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL,
  job_position TEXT,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT,
  duration TEXT,
  category_scores JSONB DEFAULT '{}',
  overall_feedback TEXT,
  strengths TEXT[],
  improvements TEXT[],
  answers JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  qualification_status TEXT DEFAULT 'pending',
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.interview_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read feedback" ON public.interview_feedback FOR SELECT USING (true);
CREATE POLICY "Anyone can insert feedback" ON public.interview_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update feedback" ON public.interview_feedback FOR UPDATE USING (true);
