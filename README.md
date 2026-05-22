# Antigravity Skill Forge

![demo](demo.gif)

Describe a skill idea in plain English. Get a ready-to-install `SKILL.md` for Antigravity agents.

---

## What it does

Type any skill idea — "whenever Claude is about to delete a file, check if it's referenced elsewhere first" — and Skill Forge generates a properly formatted `SKILL.md` using the real Antigravity spec:

- Valid YAML frontmatter (`name` in kebab-case, `description` starting with "Use when...")
- Correct body structure: Overview, When to Use, Core Pattern, Common Mistakes
- Claude Search Optimization baked in — keywords, token budget, triggering conditions only in description
- One click to copy raw markdown, paste directly into `~/.claude/skills/your-skill/SKILL.md`

---

## How to use

1. Open the extension
2. Describe your skill idea in plain English
3. Click **Forge Skill** (or press Ctrl+Enter)
4. Click **Copy Markdown**
5. Paste into `~/.claude/skills/<skill-name>/SKILL.md`

---

## Getting Started

**First launch:** The extension will ask for an API key.

- **Gemini API key** (recommended) — free at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- **OpenRouter key** — fallback option at [openrouter.ai/keys](https://openrouter.ai/keys)

Either one is enough. Keys are stored locally, never sent anywhere except the respective API.

---

## Tech stack

- Chrome Extension Manifest V3
- Gemini 2.0 Flash (via Gemini API, with OpenRouter fallback)
- Vanilla JS — no build step, no dependencies

---

## Install (unpacked)

1. Download or clone this repo
2. Open `chrome://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked** → select this folder

---

Built by [@happy_ships](https://x.com/happy_ships) · Day 7/180
