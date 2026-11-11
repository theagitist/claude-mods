import type { Register } from 'claude-code'

const EMDASH = '—'
// Prose files where em-dashes are checked. Since 2026-11-11 the user's rule
// covers internal files (CLAUDE.md, memory) too, so nothing is exempt.
const PROSE = /\.(md|markdown|txt|html?|rst|css)$/i
// ponytail: no matcher, read fields defensively; Write/Edit/MultiEdit differ.
function writtenText(e: any): string {
  if (typeof e.content === 'string') return e.content
  if (typeof e.new_string === 'string') return e.new_string
  if (Array.isArray(e.edits)) return e.edits.map((x: any) => x?.new_string ?? '').join('\n')
  return ''
}

export const register: Register = on => {
  on('tool.call', async ($, e: any, next) => {
    const r = await next(e)
    if (r.deny || r.isError) return r
    const path: string = e.file_path ?? ''
    if (!PROSE.test(path)) return r
    const text = writtenText(e)
    const n = text.split(EMDASH).length - 1
    if (n === 0) return r
    const note = `${$.plugin.name}: this write adds ${n} em-dash${n > 1 ? 'es' : ''} (${EMDASH}) to ${path}. Per the user's style rule, replace em-dashes you introduced with a comma, semicolon, colon, parentheses, "or", or a new sentence (not a hyphen). Leave em-dashes the user wrote themselves, and older text, as they are.`
    return { ...r, context: [...(r.context ?? []), note] }
  })
}
