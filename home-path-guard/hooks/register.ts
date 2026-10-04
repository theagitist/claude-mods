import type { Register } from 'claude-code'

// A literal user home: /home/<user>/… or /Users/<user>/… (macOS). $HOME/~ are fine.
const HOMEPATH = /\/(?:home|Users)\/[A-Za-z0-9._-]+(?=[\/"'\s:)]|$)/g
// Machine-local, gitignored files are allowed to hold absolute paths.
const EXEMPT = /\.local\.(md|json|sh|zsh|bash)$|(^|\/)CLAUDE\.local\.md$|\/\.git\//i

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
    if (path === '' || EXEMPT.test(path)) return r
    const hits = [...new Set(writtenText(e).match(HOMEPATH) ?? [])]
    if (hits.length === 0) return r
    const note = `${$.plugin.name}: this write hardcodes ${hits.length} user-home path (${hits.slice(0, 3).join(', ')}${hits.length > 3 ? ', …' : ''}) in ${path}. If this file may be read on another machine (home differs per box), use $HOME or ~ instead. Ignore for a path the user typed, or a genuinely machine-local file.`
    return { ...r, context: [...(r.context ?? []), note] }
  })
}
