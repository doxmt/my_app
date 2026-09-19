import { useEffect, useState, type FormEvent } from 'react'
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
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'

const NO_PARENT = 'none'

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [parentId, setParentId] = useState<string>(NO_PARENT)
  const [saving, setSaving] = useState(false)

  async function loadCategories() {
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      toast.error(`카테고리 조회 실패: ${error.message}`)
    } else {
      setCategories(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCategories()
  }, [])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setSaving(true)

    const { error } = await supabase.from('categories').insert({
      name,
      slug,
      parent_id: parentId === NO_PARENT ? null : parentId,
    })

    setSaving(false)

    if (error) {
      toast.error(`생성 실패: ${error.message}`)
      return
    }

    toast.success('카테고리를 생성했습니다.')
    setName('')
    setSlug('')
    setParentId(NO_PARENT)
    loadCategories()
  }

  async function handleRename(category: Category, nextName: string) {
    if (nextName === category.name || nextName.trim().length === 0) return

    const { error } = await supabase
      .from('categories')
      .update({ name: nextName })
      .eq('id', category.id)

    if (error) {
      toast.error(`수정 실패: ${error.message}`)
      return
    }

    setCategories((prev) =>
      prev.map((c) => (c.id === category.id ? { ...c, name: nextName } : c)),
    )
  }

  const fields = categories.filter((c) => c.parent_id === null)
  const topicsByParent = new Map<string, Category[]>()
  for (const category of categories) {
    if (category.parent_id === null) continue
    const list = topicsByParent.get(category.parent_id) ?? []
    list.push(category)
    topicsByParent.set(category.parent_id, list)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>새 분야/주제</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="slug">슬러그</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label>상위 분야</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT}>없음 (최상위 분야)</SelectItem>
                  {fields.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? '저장 중...' : '만들기'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>카테고리 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">불러오는 중...</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {fields.map((field) => (
                <li key={field.id}>
                  <Input
                    defaultValue={field.name}
                    className="h-8 max-w-xs font-medium"
                    onBlur={(e) => handleRename(field, e.target.value)}
                  />
                  <ul className="ml-4 mt-1 flex flex-col gap-1">
                    {(topicsByParent.get(field.id) ?? []).map((topic) => (
                      <li key={topic.id}>
                        <Input
                          defaultValue={topic.name}
                          className="h-8 max-w-xs text-sm"
                          onBlur={(e) => handleRename(topic, e.target.value)}
                        />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
