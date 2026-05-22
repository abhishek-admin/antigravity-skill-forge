# Antigravity Skill Forge

> Plain English in. Ready-to-install SKILL.md out.

**Day 07 / 180 — 180 Days of Building**

Writing a behavioral instruction file for a Gemini coding agent sounds simple until you hit the spec. The name must be kebab-case. The description must start with "Use when…" and describe the trigger, not the workflow. There are 11 formatting rules across frontmatter and body structure. This extension removes all of them — describe the skill idea in plain English and get a spec-compliant SKILL.md in under 10 seconds.

![Demo](antigrav.gif)

---

## What it does

- **Instant generation** — describe any agent behavior in plain English, get a valid SKILL.md with correct YAML frontmatter and body structure
- **Spec-compliant output** — all 11 Antigravity formatting rules encoded into the Gemini system prompt so the output installs without edits
- **Copy or download** — copy the raw markdown to clipboard or download the file directly with the skill name auto-extracted as the filename
- **Model selector** — switch between Gemini models without changing your API key; fetches live model list from your account
- **Session memory** — reopening the popup restores your last generated skill for 10 minutes

---

## How to use

1. Click the extension icon
2. Describe the skill idea in plain English — e.g. *"always check staged files for .env before any git push"*
3. Click **⚡ Forge Skill**
4. Copy the markdown or hit **⬇ Download** to save the `.md` file
5. Drop it into your Antigravity agent's skills directory

---

## Getting Started

### 1. Load the extension
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked** → select the `antigravity-skill-forge` folder

### 2. Add your API key
On first launch, the extension automatically shows a setup screen asking for your API key.

You only need **one** of the following — enter whichever you have:

- **Gemini API key** — free at [aistudio.google.com](https://aistudio.google.com/apikey)
- **OpenRouter API key** — free tier at [openrouter.ai](https://openrouter.ai)

If both are saved, Gemini is used first with OpenRouter as automatic fallback when quota runs out. You can update or change keys anytime via the **⚙** icon in the popup.

---

## Tech stack

- Chrome Extension Manifest V3
- Gemini 3.5 Flash (primary) → OpenRouter fallback
- Paired good/bad examples in system prompt — dropped generation failure rate from 8/20 → 2/20
- Vanilla JS — no frameworks, no build step

---

## Part of 180 Days of Building

Shipping one AI Chrome extension every day for 180 days.

Follow along: [@happy_ships](https://x.com/happy_ships)
