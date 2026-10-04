import { test, expect } from 'claude-code/testing'

test('denies `dot add -A`', async $ => {
  const r = await $.tool.call({ tool: 'Bash', command: 'dot add -A' })
  expect(typeof r.deny).toBe('string')
})

test('denies `dot add .`', async $ => {
  const r = await $.tool.call({ tool: 'Bash', command: 'dot add .' })
  expect(typeof r.deny).toBe('string')
})

test('allows an explicit-path add', async ($, on) => {
  on('tool.call', () => ({ result: {}, text: 'ok' }))
  const r = await $.tool.call({ tool: 'Bash', command: 'dot add .zshrc' })
  expect(r.deny).toBeUndefined()
})

test('leaves an unrelated command alone', async ($, on) => {
  on('tool.call', () => ({ result: {}, text: 'ok' }))
  const r = await $.tool.call({ tool: 'Bash', command: 'git add -A' })
  expect(r.deny).toBeUndefined()
})
