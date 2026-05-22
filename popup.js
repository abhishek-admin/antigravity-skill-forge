document.addEventListener('DOMContentLoaded', () => {
  const actionBtn = document.getElementById('action-btn');
  const retryBtn = document.getElementById('retry-btn');
  const copyBtn = document.getElementById('copy-btn');
  const rerunBtn = document.getElementById('rerun-btn');
  const mainContent = document.getElementById('main-content');
  const loading = document.getElementById('loading');
  const result = document.getElementById('result');
  const resultContent = document.getElementById('result-content');
  const error = document.getElementById('error');
  const errorMessage = document.getElementById('error-message');
  const skillInput = document.getElementById('skill-input');
  const charHint = document.getElementById('char-hint');

  const settingsBtn = document.getElementById('settings-btn');
  const settingsPanel = document.getElementById('settings-panel');
  const settingsClose = document.getElementById('settings-close');
  const geminiKeyInput = document.getElementById('gemini-key-input');
  const openrouterKeyInput = document.getElementById('openrouter-key-input');
  const saveKeysBtn = document.getElementById('save-keys-btn');
  const clearKeysBtn = document.getElementById('clear-keys-btn');
  const toggleGeminiKey = document.getElementById('toggle-gemini-key');
  const toggleOpenrouterKey = document.getElementById('toggle-openrouter-key');

  let lastRawMarkdown = '';

  function renderMarkdown(text) {
    // Wrap YAML frontmatter block in <pre> before HTML escaping
    text = text.replace(/^---\n([\s\S]*?)\n---\n?/, (_match, content) => {
      const escaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return '<pre class="frontmatter">---\n' + escaped + '\n---</pre>\n\n';
    });
    let html = text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^---$/gm, '<hr>');

    html = html.replace(/((?:^\|.+\|$\n?)+)/gm, (tableBlock) => {
      const rows = tableBlock.trim().split('\n').filter(r => r.trim());
      if (rows.length < 2 || !/^\|[\s\-:]+\|/.test(rows[1])) return tableBlock;
      const parseRow = (row) => row.split('|').slice(1, -1).map(c => c.trim());
      const headers = parseRow(rows[0]);
      let table = '<table><thead><tr>' + headers.map(h => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>';
      rows.slice(2).forEach(row => {
        const cells = parseRow(row);
        table += '<tr>' + cells.map(c => '<td>' + c.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') + '</td>').join('') + '</tr>';
      });
      return table + '</tbody></table>';
    });

    html = html.replace(/((?:^- .+$\n?)+)/gm, (block) => {
      return '<ul>' + block.trim().split('\n').map(l => '<li>' + l.replace(/^- /, '').trim() + '</li>').join('') + '</ul>';
    });

    html = html.replace(/((?:^\d+\. .+$\n?)+)/gm, (block) => {
      return '<ol>' + block.trim().split('\n').map(l => '<li>' + l.replace(/^\d+\. /, '').trim() + '</li>').join('') + '</ol>';
    });

    html = html.split(/\n{2,}/).map(chunk => {
      const t = chunk.trim();
      if (!t) return '';
      if (/^<(h[2-4]|ul|ol|table|hr)/.test(t)) return t;
      return '<p>' + t.replace(/\n/g, '<br>') + '</p>';
    }).join('');

    return html;
  }

  function showState(state) {
    mainContent.classList.toggle('hidden', state !== 'idle');
    loading.classList.toggle('hidden', state !== 'loading');
    result.classList.toggle('hidden', state !== 'result');
    error.classList.toggle('hidden', state !== 'error');
    if (state === 'result') result.classList.add('fade-in');
  }

  function showResult(rawMd) {
    lastRawMarkdown = rawMd;
    resultContent.innerHTML = renderMarkdown(rawMd);
    showState('result');
    chrome.storage.session.set({ cached_result: rawMd, cached_at: Date.now() });
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    showState('error');
  }

  // ---- Character counter ----
  skillInput.addEventListener('input', () => {
    const len = skillInput.value.length;
    charHint.textContent = len + ' / 800';
    charHint.style.color = len > 700 ? '#ff9966' : '#44445a';
  });

  // ---- First-run onboarding ----
  const onboarding = document.getElementById('onboarding');
  const onboardGeminiInput = document.getElementById('onboard-gemini-input');
  const onboardOpenrouterInput = document.getElementById('onboard-openrouter-input');
  const onboardSaveBtn = document.getElementById('onboard-save-btn');

  function showOnboarding() {
    onboarding.classList.remove('hidden');
    mainContent.classList.add('hidden');
    loading.classList.add('hidden');
    result.classList.add('hidden');
    error.classList.add('hidden');
  }

  function hideOnboarding() { onboarding.classList.add('hidden'); }

  document.getElementById('onboard-toggle-gemini').addEventListener('click', () => {
    onboardGeminiInput.type = onboardGeminiInput.type === 'password' ? 'text' : 'password';
  });
  document.getElementById('onboard-toggle-openrouter').addEventListener('click', () => {
    onboardOpenrouterInput.type = onboardOpenrouterInput.type === 'password' ? 'text' : 'password';
  });

  onboardSaveBtn.addEventListener('click', () => {
    const gk = onboardGeminiInput.value.trim();
    const ok = onboardOpenrouterInput.value.trim();
    if (!gk && !ok) {
      onboardSaveBtn.textContent = '⚠️ Enter at least one key';
      setTimeout(() => { onboardSaveBtn.textContent = 'Get Started →'; }, 2000);
      return;
    }
    const updates = {};
    if (gk) updates.gemini_api_key = gk;
    if (ok) updates.openrouter_api_key = ok;
    chrome.storage.local.set(updates, () => { hideOnboarding(); initApp(); });
  });

  function initApp() {
    showState('idle');
    skillInput.focus();
    const len = skillInput.value.length;
    charHint.textContent = len + ' / 800';
    charHint.style.color = len > 700 ? '#ff9966' : '#44445a';
  }

  chrome.storage.local.get(['gemini_api_key', 'openrouter_api_key'], (keys) => {
    if (!keys.gemini_api_key && !keys.openrouter_api_key) {
      showOnboarding();
    } else {
      chrome.storage.session.get(['cached_result', 'cached_at'], (data) => {
        if (data.cached_result && data.cached_at && Date.now() - data.cached_at < 10 * 60 * 1000) {
          lastRawMarkdown = data.cached_result;
          resultContent.innerHTML = renderMarkdown(data.cached_result);
          showState('result');
        } else {
          initApp();
        }
      });
    }
  });

  // ---- Gemini System Prompt ----
  const SYSTEM_PROMPT = [
    'You are an expert at writing Antigravity SKILL.md files — the standard format for reusable AI agent skills.',
    '',
    'Generate a complete, valid SKILL.md for the skill idea the user describes.',
    'Output RAW MARKDOWN ONLY — no explanation, no preamble, no code fences wrapping the whole output.',
    'Start your output directly with: ---',
    '',
    '## SKILL.md Format Rules',
    '',
    '### Frontmatter (YAML)',
    'Required fields: name and description.',
    'name: kebab-case only — letters, numbers, hyphens. No spaces, no special characters.',
    'description: MUST start with "Use when..." — describes ONLY the triggering conditions, never the workflow steps. Third person. Max 500 characters.',
    '  GOOD: "Use when implementing any feature before writing code"',
    '  BAD: "Use when implementing features — writes tests first, watches them fail, then writes minimal code"',
    'The description is what Claude reads to decide whether to load this skill. It describes the PROBLEM/SITUATION, not the workflow.',
    '',
    '### Body Structure',
    '1. # Skill Name — human-readable title',
    '2. ## Overview — what this skill is, core principle in 1-2 sentences',
    '3. ## When to Use — bullet list of symptoms/situations that trigger this skill, plus "When NOT to use" subsection',
    '4. ## Core Pattern — the concrete steps or behavior. Numbered list for sequential steps, bullets for parallel rules.',
    '5. ## Common Mistakes (optional) — what goes wrong without this skill',
    '',
    '### Quality Rules',
    '- Use keywords Claude would search for: error messages, symptoms, tool names',
    '- No narrative storytelling',
    '- Token efficient: Overview under 100 words, whole skill under 500 words',
    '- No code fences wrapping the entire output',
    '',
    '### Valid Example Output',
    '',
    '---',
    'name: check-env-before-push',
    'description: Use when about to run git push or commit staged files — catches accidental .env and credential file commits before they reach remote',
    '---',
    '',
    '# Check Env Before Push',
    '',
    '## Overview',
    'Prevents credential leaks by scanning staged files for secrets before any git push. Silent .env commits are a leading cause of security incidents.',
    '',
    '## When to Use',
    '- About to run git push',
    '- About to run git commit with staged files',
    '- Reviewing staged changes in a repo using .env files',
    '',
    '**When NOT to use:** Committing to a private local repo with no remote configured.',
    '',
    '## Core Pattern',
    '1. Run git diff --cached --name-only to list staged files',
    '2. Check for any match against: .env, .env.*, *secret*, *credential*, *.pem, *.key',
    '3. If match found: STOP. Show matched filenames. Ask user to confirm or unstage them.',
    '4. If no match: proceed normally.',
    '',
    '## Common Mistakes',
    '- Checking the working tree instead of staging area (use --cached)',
    '- Only checking .env — secrets hide in many filenames',
    '---END EXAMPLE---',
    '',
    'Now generate a SKILL.md for the user\'s skill idea. Output raw markdown only, starting with ---',
  ].join('\n');

  // ---- Forge Action ----
  async function runAction() {
    const ideaText = skillInput.value.trim();
    if (!ideaText) {
      skillInput.focus();
      skillInput.style.borderColor = 'rgba(255, 100, 100, 0.5)';
      setTimeout(() => { skillInput.style.borderColor = ''; }, 1500);
      return;
    }

    showState('loading');

    try {
      const userPrompt = 'Generate a SKILL.md for the following skill idea:\n\n' + ideaText;

      const raw = await callGemini(userPrompt, {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.4,
        maxTokens: 1024,
      });

      const cleaned = raw
        .replace(/^```(?:markdown|md)?\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();

      if (!cleaned) {
        showError('Gemini returned an empty response. Try rephrasing your skill idea.');
        return;
      }

      showResult(cleaned);
    } catch (err) {
      console.error('Forge failed:', err);
      showError(err.message || 'Something went wrong. Try again.');
    }
  }

  // ---- Copy raw markdown ----
  copyBtn.addEventListener('click', () => {
    if (!lastRawMarkdown) return;
    navigator.clipboard.writeText(lastRawMarkdown)
      .then(() => {
        copyBtn.textContent = '✅ Copied!';
        setTimeout(() => { copyBtn.textContent = '📋 Copy Markdown'; }, 1500);
      })
      .catch(() => {
        copyBtn.textContent = '❌ Copy failed';
        setTimeout(() => { copyBtn.textContent = '📋 Copy Markdown'; }, 1500);
      });
  });

  // ---- Event Listeners ----
  actionBtn.addEventListener('click', runAction);
  retryBtn.addEventListener('click', runAction);

  rerunBtn.addEventListener('click', () => {
    showState('idle');
    skillInput.focus();
  });

  skillInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runAction();
    }
  });

  // ---- Settings Panel ----
  function openSettings() {
    settingsPanel.classList.remove('hidden');
    settingsPanel.classList.add('fade-in');
    chrome.storage.local.get(['gemini_api_key', 'openrouter_api_key'], (data) => {
      geminiKeyInput.value = data.gemini_api_key || '';
      openrouterKeyInput.value = data.openrouter_api_key || '';
    });
  }

  function closeSettings() {
    settingsPanel.classList.add('hidden');
    settingsPanel.classList.remove('fade-in');
  }

  settingsBtn.addEventListener('click', openSettings);
  settingsClose.addEventListener('click', closeSettings);

  toggleGeminiKey.addEventListener('click', () => {
    geminiKeyInput.type = geminiKeyInput.type === 'password' ? 'text' : 'password';
  });
  toggleOpenrouterKey.addEventListener('click', () => {
    openrouterKeyInput.type = openrouterKeyInput.type === 'password' ? 'text' : 'password';
  });

  saveKeysBtn.addEventListener('click', () => {
    const updates = {};
    const gk = geminiKeyInput.value.trim();
    const ok = openrouterKeyInput.value.trim();
    if (gk) updates.gemini_api_key = gk;
    if (ok) updates.openrouter_api_key = ok;
    if (Object.keys(updates).length === 0) return;
    chrome.storage.local.set(updates, () => {
      saveKeysBtn.textContent = '✅ Saved';
      setTimeout(() => { saveKeysBtn.textContent = 'Save Keys'; }, 1500);
    });
  });

  clearKeysBtn.addEventListener('click', async () => {
    await resetApiKeys();
    geminiKeyInput.value = '';
    openrouterKeyInput.value = '';
    clearKeysBtn.textContent = '✅ Cleared';
    setTimeout(() => { clearKeysBtn.textContent = 'Clear All Keys'; }, 1500);
  });
});
