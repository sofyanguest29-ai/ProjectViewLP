'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

// Render HTML rich text (read-only). Tag project (span.project-tag) bisa diklik
// untuk pindah ke halaman detail project yang di-tag.
export default function RichContent({ html, allProjects = [], className = 'rte-readonly', onNavigate }) {
  const router = useRouter()

  async function handleClick(e) {
    const tag = e.target.closest?.('.project-tag')
    if (!tag) return
    e.preventDefault()
    e.stopPropagation()

    let projectId = tag.getAttribute('data-project-id')
    if (!projectId) {
      // Tag lama belum punya id, ambil no project dari teks "#1234 - Judul"
      const match = (tag.textContent || '').trim().match(/^#\s*([^\s]+)\s*-/)
      const code = match?.[1]
      if (!code) return
      const found = allProjects.find((p) => String(p.project_code) === code)
      if (found) {
        projectId = found.id
      } else {
        const { data } = await createClient().from('projects').select('id').eq('project_code', code).maybeSingle()
        projectId = data?.id
      }
    }
    if (!projectId) {
      alert('Project yang di-tag tidak ditemukan (mungkin sudah dihapus).')
      return
    }
    onNavigate?.()
    router.push(`/dashboard/project/${projectId}`)
  }

  return <div className={className} onClick={handleClick} dangerouslySetInnerHTML={{ __html: html }} />
}
