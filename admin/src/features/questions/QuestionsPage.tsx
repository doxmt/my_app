import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import type { Question } from '@/types'

export function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  async function loadQuestions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error(`문제 조회 실패: ${error.message}`)
    } else {
      setQuestions(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadQuestions()
  }, [])

  async function togglePublished(question: Question) {
    const { error } = await supabase
      .from('questions')
      .update({ is_published: !question.is_published })
      .eq('id', question.id)

    if (error) {
      toast.error(`변경 실패: ${error.message}`)
      return
    }

    setQuestions((prev) =>
      prev.map((q) => (q.id === question.id ? { ...q, is_published: !q.is_published } : q)),
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">문제</h1>
        <Button asChild>
          <Link to="/questions/new">새 문제 작성</Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>문제</TableHead>
              <TableHead>유형</TableHead>
              <TableHead>게시 상태</TableHead>
              <TableHead className="text-right">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((question) => (
              <TableRow key={question.id}>
                <TableCell className="max-w-md truncate">{question.prompt}</TableCell>
                <TableCell>
                  {question.type === 'descriptive' ? '서술형' : '객관식'}
                </TableCell>
                <TableCell>
                  <Badge variant={question.is_published ? 'default' : 'secondary'}>
                    {question.is_published ? '게시됨' : '미게시'}
                  </Badge>
                </TableCell>
                <TableCell className="flex justify-end gap-2 text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/questions/${question.id}`}>수정</Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => togglePublished(question)}>
                    {question.is_published ? '게시 내리기' : '게시하기'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
