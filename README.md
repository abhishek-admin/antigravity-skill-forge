# ⚒ Antigravity Skill Forge

> **Plain English in. Ready-to-install `SKILL.md` out.** 
> Create spec-compliant behavioral instruction files for your Gemini AI coding agents in under 10 seconds.

<div align="center">

[![Chrome MV3](https://img.shields.io/badge/Chrome-Manifest_V3-7C6AFF?style=for-the-badge&logo=google-chrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![Gemini AI](https://img.shields.io/badge/Gemini-3.5_Flash-D4AF37?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)
[![Streak](https://img.shields.io/badge/Day-07_/_180-vanilla?style=for-the-badge&logo=github&logoColor=white)](https://x.com/happy_ships)

</div>

---

## 🎨 v1.1.0 Midnight Luxe Redesign

Skill Forge has been upgraded with a stunning cinematic visual identity tailored for modern developer workspaces. 

```text
  ✨ Royal Gold Accents    ✨ Mechanical Double-Concentric Gears
  ✨ Mac-style IDE Previews  ✨ Sliding Glassmorphic Settings Panel
```

> [!NOTE]
> All visual upgrades are driven by optimized CSS and hardware-accelerated animations directly inside the popup interface—keeping all API interactions, state triggers, and storage caching fully lightweight.

---

## 📖 The Problem & The Solution

Writing behavioral instruction files (`SKILL.md`) for **Antigravity** or other Gemini-based agents is simple until you hit the precise formatting rules:
- **Kebab-case only** file and frontmatter names.
- Descriptions that **must** start with `"Use when..."` and document *trigger conditions*, not workflows.
- 11 complex markdown rules spanning frontmatter blocks, tables, lists, and headers.

**Skill Forge** removes the format tax. Describe what you want in plain English, and get a completely spec-compliant, ready-to-use skill in seconds.

![Demo Screen](antigrav.gif)

---

## ⚡ Core Features

- ⚙ **Instant Generation** — Transform natural language descriptions into complete, valid `SKILL.md` files with correct YAML frontmatter and body structures.
- 📐 **Rigid Spec Compliance** — System prompt contains paired few-shot examples that drop output failures down to near-zero.
- 📋 **Zero-Pain Copy & Download** — Copy the raw markdown cleanly in one click, or download the `.md` file with the filename pre-slugified and ready.
- 🔌 **Dynamic Model Selector** — Swap between Gemini models (3.5 Flash, 2.5 Flash, 2.0 Flash) on the fly.
- 💾 **Session Caching** — Reopening the extension restores your last generated skill automatically for up to 10 minutes.
- 🔌 **Automatic Fallback** — Add both Gemini and OpenRouter keys. The extension defaults to Gemini and automatically falls back to OpenRouter if your API quota is exceeded.

---

## 🛠 Getting Started

### 1. Load the Extension
1. Clone this repository locally.
2. Open Chrome and navigate to `chrome://extensions`.
3. Toggle on **Developer mode** in the top right.
4. Click **Load unpacked** and select the `antigravity-skill-forge` folder.

### 2. Configure Your Keys
On your first launch, the extension presents a beautiful onboarding screen:
- **Gemini Key** — Get one for free at [aistudio.google.com](https://aistudio.google.com/apikey).
- **OpenRouter Key** — Get one at [openrouter.ai](https://openrouter.ai).

*To edit your keys later, simply click the **⚙** gear icon at the top right of the popup.*

---

## 🧠 Engineering Highlight: Examples > Instructions

During initial prototyping, Gemini frequently hallucinated the `description` field, describing the *workflow steps* instead of starting with `"Use when..."` and defining the *triggering environment*.

Changing instructions in the system prompt had very little effect. The breakthrough came from adding **one pair of good/bad examples** directly into the system instructions:
- **Good description**: `"Use when about to run git push or commit staged files — catches accidental .env commits."`
- **Bad description**: `"Use when pushing. Runs git diff, checks for env, stops push if found."`

This single few-shot example pair dropped the generation failure rate from **8/20 down to 2/20**. 

---

## 🔧 Technical Stack

- **Extension Framework**: Chrome Extension Manifest V3
- **Primary AI Model**: Gemini 3.5 Flash via AI Studio SDK
- **Fallback Engine**: OpenRouter API
- **Client Implementation**: Pure Vanilla JS, zero build steps, zero bulky dependencies. Runs directly out of the folder.

---

## 📅 180 Days of Building
This project is part of a larger developer journey: shipping one useful AI tool/extension every day for 180 days.

This release is part of the **Google I/O 2026 Week — 7 Project Sprint** (`IO-1`), powered by **Gemini 3.5 Flash**.

Follow along for daily releases and tech-stack deep dives:
- **Twitter / X**: [@happy_ships](https://x.com/happy_ships)
- **Day**: `07 / 180`

---

*Licensed under the [MIT License](LICENSE).*
