export type QuestionType = 'descriptive' | 'multiple_choice'
export type CandidateStatus = 'pending' | 'approved' | 'rejected'

export interface Category {
  id: string
  parent_id: string | null
  slug: string
  name: string
  description: string | null
  sort_order: number
  created_at: string
}

export interface Question {
  id: string
  category_id: string
  type: QuestionType
  prompt: string
  model_answer: string | null
  choices: unknown | null
  correct_choice_id: string | null
  difficulty: string | null
  tags: string[]
  is_published: boolean
  created_at: string
}

export interface QuestionCandidate {
  id: string
  category_id: string | null
  source_material: string | null
  source_url: string | null
  draft_prompt: string | null
  draft_model_answer: string | null
  duplicate_of: string | null
  similarity_score: number | null
  status: CandidateStatus
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}

export interface QuestionFormValues {
  category_id: string
  type: QuestionType
  prompt: string
  model_answer: string
  difficulty: string
  tags: string
  is_published: boolean
}
