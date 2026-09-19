import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
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
import type { QuestionCandidate } from '@/types'

export function CandidatesPage() {
  const [candidates, setCandidates] = useState<QuestionCandidate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('question_candidates')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          toast.error(`후보 조회 실패: ${error.message}`)
        } else {
          setCandidates(data)
        }
        setLoading(false)
      })
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">후보 승인</h1>

      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : candidates.length === 0 ? (
        <p className="text-sm text-muted-foreground">대기 중인 후보가 없습니다.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>초안 문제</TableHead>
              <TableHead>출처</TableHead>
              <TableHead className="text-right">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell className="max-w-md truncate">
                  {candidate.draft_prompt ?? '(내용 없음)'}
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {candidate.source_url ?? candidate.source_material ?? '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/candidates/${candidate.id}`}>검토</Link>
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
