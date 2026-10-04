import { test, expect } from 'claude-code/testing'

test('notes a hardcoded /home path', async ($, on) => {
  on('tool.call', () => ({ result: {}, text: 'ok' }))
  const r = await $.tool.call({ tool: 'Write', file_path: '/proj/run.sh', content: 'cd /home/alice/apps\n' })
  expect((r.context ?? []).some((c: string) => c.includes('home path'))).toBe(true)
})

test('silent when $HOME is used', async ($, on) => {
  on('tool.call', () => ({ result: {}, text: 'ok' }))
  const r = await $.tool.call({ tool: 'Write', file_path: '/proj/run.sh', content: 'cd $HOME/apps\n' })
  expect(r.context).toBeUndefined()
})

test('silent for a *.local file', async ($, on) => {
  on('tool.call', () => ({ result: {}, text: 'ok' }))
  const r = await $.tool.call({ tool: 'Write', file_path: '/x/settings.local.json', content: '/Users/bob/x' })
  expect(r.context).toBeUndefined()
})
