import type { Register } from 'claude-code'

async function shortHost($: any): Promise<string> {
  for (const argv of [['hostname', '-s'], ['hostname']]) {
    const r = await $.process.run(argv, { timeoutMs: 4000 }).catch(() => undefined)
    const out = r?.stdout?.trim()
    if (out) return out.split('.')[0]
  }
  return (await $.env.get('HOSTNAME')) || (await $.env.get('HOST')) || 'host'
}

// Which out-of-band channel this box can reach the user on. Mirrors idle-ping.
async function channel($: any): Promise<string> {
  const home = (await $.env.get('HOME')) ?? ''
  const tgEnv = `${home}/.claude/channels/telegram/.env`
  if (home && (await $.fs.exists(tgEnv).catch(() => false))) {
    const txt = await $.fs.read(tgEnv).catch(() => '')
    if (/(^|\n)\s*(?:export\s+)?TELEGRAM_BOT_TOKEN\s*=/.test(txt)) return 'telegram'
  }
  if (await $.env.get('CLAUDE_PING_EMAIL')) return 'email'
  return 'none'
}

async function sudo($: any): Promise<string> {
  const r = await $.process.run(['sudo', '-n', 'true'], { timeoutMs: 4000 }).catch(() => undefined)
  return r?.exitCode === 0 ? 'yes' : 'no'
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    // ponytail: detach so start isn't delayed by the probes; status needs no turn.
    void (async () => {
      const [h, c, s] = await Promise.all([shortHost($), channel($), sudo($)])
      $.ui.status(`${h} · ping:${c} · sudo:${s}`)
    })()
    return started
  })
}
