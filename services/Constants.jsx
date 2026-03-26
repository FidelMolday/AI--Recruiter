import {
  LayoutDashboard,
  Calendar,
  List,
  Settings,
  Code2Icon,
  User2Icon,
  BriefcaseBusinessIcon,
  Puzzle,
  MessageSquare,
} from "lucide-react";

export const SideBarOptions = [
  {
    name: "Dashboard",
    Icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    name: "Scheduled Interviews",
    Icon: Calendar,
    path: "/dashboard/scheduled-interviews",
  },
  {
    name: "All Interviews",
    Icon: List,
    path: "/dashboard/all-interviews",
  },
  {
    name: "Interview Feedbacks",
    Icon: MessageSquare,
    path: "/dashboard/interview-feedbacks",
  },
  {
    name: "Settings",
    Icon: Settings,
    path: "/settings",
  },
]
export const InterviewType = [
  {
    title: 'Technical',
    icon: Code2Icon
  },
  {
    title:'Behavioral',
    icon: User2Icon
  },
  {
    title:'Experience',
    icon: BriefcaseBusinessIcon
  },
  {
    title:'Problem Solving',
    icon: Puzzle
  },
  {
    title:'Leadership',
    icon: User2Icon
  }
]
export const QUESTIONS_PROMPT = `
You are an expert technical interviewer.

Based on the following inputs, generate a well-structured list of high-quality interview questions.

Job Title: {{jobTitle}}

Job Description:
{{jobDescription}}

Interview Duration: {{duration}}

Interview Type: {{type}}

Your Task:

1. Analyze the job description to identify:
   - Key responsibilities
   - Required skills
   - Expected experience level

2. Generate a list of interview questions based on the interview duration.
   - Short duration → fewer, concise questions
   - Long duration → deeper, more detailed questions

3. Ensure the questions match the tone and structure of a real-life {{type}} interview.

4. Return the response strictly in JSON format as shown below:

{
  "interviewQuestions": [
    {
      "question": "Sample question here",
      "type": "Technical"
    },
    {
      "question": "Another question here",
      "type": "Behavioral"
    }
  ]
}

The goal is to create a structured, relevant, and time-optimized interview plan for a {{jobTitle}} role.
`;