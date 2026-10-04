import { test, expect } from 'claude-code/testing'

const EM = '—'

test('notes an em-dash in a public .md', async ($, on) => {
  on('tool.call', () => ({ result: {}, text: 'ok' }))
  const r = await $.tool.call({ tool: 'Write', file_path: '/vault/Note.md', content: `uno ${EM} dos` })
  expect((r.context ?? []).some((c: string) => c.includes('em-dash'))).toBe(true)
})

test('silent for CLAUDE.md', async ($, on) => {
  on('tool.call', () => ({ result: {}, text: 'ok' }))
  const r = await $.tool.call({ tool: 'Write', file_path: '/proj/CLAUDE.md', content: `uno ${EM} dos` })
  expect(r.context).toBeUndefined()
})

test('silent for a memory file', async ($, on) => {
  on('tool.call', () => ({ result: {}, text: 'ok' }))
  const r = await $.tool.call({ tool: 'Write', file_path: '/x/memory/foo.md', content: `a ${EM} b` })
  expect(r.context).toBeUndefined()
})
