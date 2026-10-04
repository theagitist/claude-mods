import type { Register } from 'claude-code'

// A standalone stage-everything arg: catastrophic when the work-tree is $HOME.
const WHOLE_TREE = /\badd\b[^|&;]*?\s(-A|--all|\.|\*|:\/)(\s|$)/

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const register: Register = (on, options) => {
  const wrappers = String(options.wrappers ?? 'dot').split(',').map(s => s.trim()).filter(Boolean)

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const cmd = e.command
    if (!WHOLE_TREE.test(cmd)) return next(e)

    // Cheap, env-free checks first: a dotfiles wrapper, or a literal $HOME work-tree.
    let targetsHome =
      cmd.includes('--work-tree=$HOME') ||
      wrappers.some(w => new RegExp(`(^|[|&;]|\\s)${escapeRe(w)}\\s+add\\b`).test(cmd))

    // Only a `--work-tree=<abs path>` needs the real home to compare against.
    if (!targetsHome && /--work-tree=/.test(cmd)) {
      try {
        const home = await $.env.get('HOME')
        targetsHome = !!home && cmd.includes(home)
      } catch { /* env unavailable: fall through, wrapper check already ran */ }
    }

    return targetsHome
      ? { deny: `${$.plugin.name}: refusing a "git add" that stages the whole $HOME work-tree (-A/--all/./*). Stage explicit paths instead; this would commit all of your home directory.` }
      : next(e)
  })
}
