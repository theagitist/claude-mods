import type { Register } from 'claude-code'

async function shortHost($: any): Promise<string> {
  const r = await $.process.run(['hostname', '-s'], { timeoutMs: 4000 }).catch(() => undefined)
  return r?.stdout?.trim()?.split('.')[0] || (await $.env.get('HOSTNAME')) || 'host'
}

async function envVarInFile($: any, file: string, key: string): Promise<string | undefined> {
  const txt = await $.fs.read(file).catch(() => '')
  const m = new RegExp(`(?:^|\\n)\\s*(?:export\\s+)?${key}\\s*=\\s*["']?([^"'\\n]+)`).exec(txt)
  return m ? m[1].trim() : undefined
}

async function firstOnPath($: any, names: string[]): Promise<string | undefined> {
  for (const n of names) {
    const r = await $.process.run(['command', '-v', n], { timeoutMs: 4000 }).catch(() => undefined)
    if (r?.exitCode === 0 && r.stdout.trim()) return n
  }
  return undefined
}

async function sendPing($: any, host: string, body: string): Promise<void> {
  const home = (await $.env.get('HOME')) ?? ''
  const tgEnv = `${home}/.claude/channels/telegram/.env`

  // 1) Telegram: token from the (gitignored) channel env file; chat id from env or that file.
  const token = home ? await envVarInFile($, tgEnv, 'TELEGRAM_BOT_TOKEN') : undefined
  const chatId = (await $.env.get('TELEGRAM_CHAT_ID')) || (home ? await envVarInFile($, tgEnv, 'TELEGRAM_CHAT_ID') : undefined)
  if (token && chatId) {
    await $.process.run(
      ['curl', '-sS', '-m', '10', '-X', 'POST',
        `https://api.telegram.org/bot${token}/sendMessage`,
        '--data-urlencode', `chat_id=${chatId}`,
        '--data-urlencode', `text=${body}`],
      { timeoutMs: 12000 },
    )
    return
  }

  // 2) Email: recipient from env, sent through whatever mailer the box has.
  const to = await $.env.get('CLAUDE_PING_EMAIL')
  if (to) {
    const subject = `Claude Code idle @ ${host}`
    const mailer = await firstOnPath($, ['msmtp', 'sendmail', 'mail', 'mailx'])
    if (mailer === 'mail' || mailer === 'mailx') {
      await $.process.run([mailer, '-s', subject, to], { stdin: body, timeoutMs: 12000 })
      return
    }
    if (mailer) {
      await $.process.run([mailer, '-t'], { stdin: `To: ${to}\nSubject: ${subject}\n\n${body}\n`, timeoutMs: 12000 })
      return
    }
  }

  $.ui.log(`idle-ping: no channel on this box. Set TELEGRAM_CHAT_ID (+ the telegram .env), or CLAUDE_PING_EMAIL and a mailer. Would have sent: ${body}`, { to: 'debug' })
}

export const register: Register = (on, options) => {
  const minTools = typeof options.minTools === 'number' ? options.minTools : 2
  let tools = 0

  on('turn.start', ($, e, next) => { tools = 0; return next(e) })
  on('tool.call', ($, e: any, next) => { if (!e.agentId) tools++; return next(e) })

  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    if (e.agentId || e.isAborted || tools < minTools) return r
    const host = await shortHost($)
    const secs = Math.round(e.durationMs / 1000)
    const summary = (e.answer || '(no visible answer)').replace(/\s+/g, ' ').trim().slice(0, 180)
    // ponytail: detached; the send shouldn't eat the turn's completion budget.
    void sendPing($, host, `[claude-code @ ${host}] idle after ${secs}s. ${summary}`).catch(() => {})
    return r
  })
}
