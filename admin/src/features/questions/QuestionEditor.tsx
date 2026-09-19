import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import type { Category, Question, QuestionCandidate, QuestionType } from '@/types'

type Mode = 'new' | 'edit' | 'candidate'

interface Props {
  mode: Mode
}

interface FormState {
  categoryId: string
  type: QuestionType
  prompt: string
  modelAnswer: string
  difficulty: string
  tags: string
  isPublished: boolean
}

const emptyForm: FormState = {
  categoryId: '',
  type: 'descriptive',
  prompt: '',
  modelAnswer: '',
  difficulty: '',
  tags: '',
  isPublished: false,
}

export function QuestionEditor({ mode }: Props) {
  const params = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(mode !== 'new')
  const [saving, setSaving] = useState(false)
  const [candidate, setCandidate] = useState<QuestionCandidate | null>(null)

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) toast.error(`카테고리 조회 실패: ${error.message}`)
        else setCategories(data)
      })
  }, [])

  useEffect(() => {
    if (mode === 'new' || !params.id) {
      setLoading(false)
      return
    }

    if (mode === 'edit') {
      supabase
        .from('questions')
        .select('*')
        .eq('id', params.id)
        .single()
        .then(({ data, error }) => {
          if (error || !data) {
            toast.error(`문제 조회 실패: ${error?.message ?? 'not found'}`)
          } else {
            const question = data as Question
            setForm({
              categoryId: question.category_id,
              type: question.type,
              prompt: question.prompt,
              modelAnswer: question.model_answer ?? '',
              difficulty: question.difficulty ?? '',
              tags: question.tags.join(', '),
              isPublished: question.is_published,
            })
          }
          setLoading(false)
        })
    } else {
      supabase
        .from('question_candidates')
        .select('*')
        .eq('id', params.id)
        .single()
        .then(({ data, error }) => {
          if (error || !data) {
            toast.error(`후보 조회 실패: ${error?.message ?? 'not found'}`)
          } else {
            const c = data as QuestionCandidate
            setCandidate(c)
            setForm({
              categoryId: c.category_id ?? '',
              type: 'descriptive',
              prompt: c.draft_prompt ?? '',
              modelAnswer: c.draft_model_answer ?? '',
              difficulty: '',
              tags: '',
              isPublished: false,
            })
          }
          setLoading(false)
        })
    }
  }, [mode, params.id])

  function parseTags(tags: string): string[] {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)

    if (mode === 'new') {
      const { error } = await supabase.from('questions').insert({
        category_id: form.categoryId,
        type: form.type,
        prompt: form.prompt,
        model_answer: form.modelAnswer || null,
        difficulty: form.difficulty || null,
        tags: parseTags(form.tags),
        is_published: form.isPublished,
      })
      setSaving(false)
      if (error) {
        toast.error(`저장 실패: ${error.message}`)
        return
      }
      toast.success('문제를 만들었습니다.')
      navigate('/questions')
      return
    }

    if (mode === 'edit' && params.id) {
      const { error } = await supabase
        .from('questions')
        .update({
          category_id: form.categoryId,
          type: form.type,
          prompt: form.prompt,
          model_answer: form.modelAnswer || null,
          difficulty: form.difficulty || null,
          tags: parseTags(form.tags),
          is_published: form.isPublished,
        })
        .eq('id', params.id)
      setSaving(false)
      if (error) {
        toast.error(`저장 실패: ${error.message}`)
        return
      }
      toast.success('문제를 수정했습니다.')
      navigate('/questions')
      return
    }

    if (mode === 'candidate' && candidate) {
      const { error } = await supabase.rpc('approve_question_candidate', {
        p_candidate_id: candidate.id,
        p_category_id: form.categoryId,
        p_type: form.type,
        p_prompt: form.prompt,
        p_model_answer: form.modelAnswer || null,
        p_choices: null,
        p_correct_choice_id: null,
        p_difficulty: form.difficulty || null,
        p_tags: parseTags(form.tags),
        p_is_published: form.isPublished,
      })
      setSaving(false)
      if (error) {
        toast.error(`승인 실패: ${error.message}`)
        return
      }
      toast.success('후보를 승인했습니다.')
      navigate('/candidates')
    }
  }

  async function handleReject() {
    if (!candidate) return
    setSaving(true)
    const { error } = await supabase
      .from('question_candidates')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', candidate.id)
    setSaving(false)
    if (error) {
      toast.error(`반려 실패: ${error.message}`)
      return
    }
    toast.success('후보를 반려했습니다.')
    navigate('/candidates')
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">불러오는 중...</p>
  }

  const title =
    mode === 'new' ? '새 문제 작성' : mode === 'edit' ? '문제 수정' : '후보 승인'

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>카테고리</Label>
            <Select
              value={form.categoryId}
              onValueChange={(value) => setForm((f) => ({ ...f, categoryId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>유형</Label>
            <Select
              value={form.type}
              onValueChange={(value) => setForm((f) => ({ ...f, type: value as QuestionType }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="descriptive">서술형</SelectItem>
                <SelectItem value="multiple_choice">객관식</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="prompt">문제</Label>
            <Textarea
              id="prompt"
              rows={4}
              value={form.prompt}
              onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="model_answer">모범답안</Label>
            <Textarea
              id="model_answer"
              rows={4}
              value={form.modelAnswer}
              onChange={(e) => setForm((f) => ({ ...f, modelAnswer: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="difficulty">난이도</Label>
            <Input
              id="difficulty"
              value={form.difficulty}
              onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="tags">태그 (쉼표로 구분)</Label>
            <Input
              id="tags"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
            />
            게시 (앱에 노출)
          </label>

          <div className="flex gap-2">
            <Button type="submit" disabled={saving || !form.categoryId}>
              {saving
                ? '저장 중...'
                : mode === 'candidate'
                  ? '승인'
                  : '저장'}
            </Button>
            {mode === 'candidate' ? (
              <Button type="button" variant="outline" disabled={saving} onClick={handleReject}>
                반려
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
