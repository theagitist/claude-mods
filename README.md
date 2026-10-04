# claude-mods

Five small Claude Code mods (function-hook plugins). They run in the terminal
CLI (no GUI panes), and they are written to work the same on every machine:
Linux or macOS, any username, any home directory. Nothing personal is baked
into the source. Per-machine values (a Telegram chat id, an email address) come
from the environment, so the same checkout is safe to push publicly and hand to
other people.

## The mods

| Mod | What it does | How it shows |
|---|---|---|
| `dot-guard` | Blocks a `git add` that would stage your whole `$HOME` work-tree (`dot add -A`, `dot add .`, `dot add *`). One fat-finger away from committing your entire home directory. | Denies the tool call with a reason. |
| `emdash-watch` | Flags em-dashes the model writes into public-facing prose (`.md`, `.html`, `.css`, `.txt`, `.rst`). Internal files (`CLAUDE.md`, anything under `memory/` or `.claude/`) are exempt. | Non-blocking note appended to the write's result, visible to the model only. |
| `home-path-guard` | Flags a hardcoded user home (`/home/<user>`, `/Users/<user>`) written into a file, nudging `$HOME` / `~`. Machine-local files (`*.local.*`) are exempt. | Non-blocking note to the model. |
| `box-status` | Status line showing which box you are on, which out-of-band channel it can reach you on (`telegram` / `email` / `none`), and whether passwordless `sudo` works. | One status-line entry under the prompt. |
| `idle-ping` | When a turn that did real work ends, pings you out of band so you can step away. Telegram when a bot token and chat id are present, otherwise email. | Sends a message; logs to the debug sink when no channel is configured. |

## Install (per machine)

Clone this repo to the same relative path on each box, for example:

```sh
git clone <your-remote> ~/apps/claude-mods
```

Then point Claude Code at the five folders. The cleanest cross-machine way is
`CLAUDE_CODE_PLUGIN_DIRS` in the `env` block of `~/.claude/settings.json`
(which uses `~`, so the one line works on every machine):

```json
{
  "env": {
    "CLAUDE_CODE_PLUGIN_DIRS": "~/apps/claude-mods/dot-guard:~/apps/claude-mods/emdash-watch:~/apps/claude-mods/box-status:~/apps/claude-mods/home-path-guard:~/apps/claude-mods/idle-ping"
  }
}
```

(On Windows the list separator is `;` instead of `:`.)

Or load them for a single session without touching settings:

```sh
claude --plugin-dir ~/apps/claude-mods/dot-guard --plugin-dir ~/apps/claude-mods/idle-ping
```

## Per-machine configuration (idle-ping)

`idle-ping` reads its target from the environment, never from source:

- **Telegram** (preferred when set): it reads `TELEGRAM_BOT_TOKEN` (and
  optionally `TELEGRAM_CHAT_ID`) from `~/.claude/channels/telegram/.env`, and
  `TELEGRAM_CHAT_ID` from the process environment if not in that file. Keep that
  file out of version control (mode `600`).
- **Email** (fallback): set `CLAUDE_PING_EMAIL` to the recipient. The mod sends
  through the first mailer it finds on `PATH` (`msmtp`, `sendmail`, `mail`,
  `mailx`).
- If neither is configured, it writes what it would have sent to the debug log
  and does nothing else.

`box-status` reports the same channel resolution, so a glance at the status line
tells you whether a ping would actually go out on this box.

## Settings knobs

- `dot-guard.wrappers` (default `dot`): comma-separated command names that run
  git with `--work-tree=$HOME`. Set it to your own dotfiles alias if it is not
  `dot`.
- `idle-ping.minTools` (default `2`): how many tool calls a turn needs before it
  counts as real work worth a ping. Raise it to ping less often.

## Developing

Each mod is a folder with `.claude-plugin/plugin.json`, `hooks/hooks.json`, and
`hooks/register.ts`. Check and test one with:

```sh
claude plugin validate <mod>
claude plugin test <mod>
```
