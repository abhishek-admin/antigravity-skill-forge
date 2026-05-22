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

});
