// ============================================
// GEMINI API WRAPPER — gemini.js
// Auto-fallback: Gemini Direct → OpenRouter
// Shared across ALL projects. Do NOT modify.
// ============================================

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'gemini-2.0-flash';

const OPENROUTER_MODELS = [
  'google/gemini-2.5-flash',          // Paid — fast, uses your credits
  'google/gemini-2.0-flash',          // Paid — backup paid option
  'deepseek/deepseek-v4-flash:free',  // Free fallback (slow)
  'meta-llama/llama-3.3-70b-instruct:free', // Free fallback
];

// ---- Key Management (no prompt() dialogs) ----

async function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['gemini_api_key'], (result) => {
      resolve(result.gemini_api_key || null);
    });
  });
}

async function getOpenRouterKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['openrouter_api_key'], (result) => {
      resolve(result.openrouter_api_key || null);
    });
  });
}

async function resetApiKeys() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['gemini_api_key', 'openrouter_api_key'], resolve);
  });
}

// ---- Gemini Direct ----

async function callGeminiDirect(prompt, options = {}) {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('❌ No Gemini API key. Click ⚙ → paste your key from aistudio.google.com → Save');

  const model = options.model || DEFAULT_MODEL;
  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: options.maxTokens || 2048,
      temperature: options.temperature ?? 0.7,
    },
  };

  if (options.systemInstruction) {
    requestBody.systemInstruction = { parts: [{ text: options.systemInstruction }] };
  }
  if (options.responseType === 'json') {
    requestBody.generationConfig.responseMimeType = 'application/json';
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

async function callOpenRouter(prompt, options = {}) {
  const apiKey = await getOpenRouterKey();
  if (!apiKey) {
    throw new Error('❌ OpenRouter API key not set. Click ⚙ in extension popup → paste your OpenRouter key → Save. Get free credits at openrouter.ai');
  }

  const models = options.openRouterModel
    ? [options.openRouterModel, ...OPENROUTER_MODELS]
    : OPENROUTER_MODELS;

  console.log(`[OpenRouter] Trying models: ${models.slice(0, 2).join(', ')} (+ ${models.length - 2} more)`);
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`[OpenRouter] Attempting: ${model}`);
      const body = {
        model,
        messages: [
          ...(options.systemInstruction
            ? [{ role: 'system', content: options.systemInstruction }]
            : []),
          { role: 'user', content: prompt },
        ],
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature ?? 0.7,
      };

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://github.com/abhishek-admin',
          'X-Title': 'Gemini AI Tools',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        lastError = new Error(err?.error?.message || `${model}: HTTP ${response.status}`);
        console.log(`[OpenRouter] ✗ ${model} failed: ${lastError.message}`);
        continue;
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) {
        lastError = new Error(`${model}: empty response`);
        console.log(`[OpenRouter] ✗ ${model} returned empty`);
        continue;
      }

      console.log(`[OpenRouter] ✅ ${model} succeeded`);
      return text;

    } catch (err) {
      lastError = err;
      console.log(`[OpenRouter] ✗ ${model} error: ${err.message}`);
      continue;
    }
  }

  throw lastError || new Error('All OpenRouter models failed. Check your API key and balance at openrouter.ai');
}

// ---- Main Entry: Gemini with Auto-Fallback ----

async function callGemini(prompt, options = {}) {
  // Check if Gemini key exists
  const geminiKey = await getApiKey();
  const openRouterKey = await getOpenRouterKey();

  // If Gemini key is missing or empty, skip directly to OpenRouter
  if (!geminiKey) {
    console.log('[Skip] No Gemini key, using OpenRouter directly');
    return await callOpenRouter(prompt, options);
  }

  try {
    return await callGeminiDirect(prompt, options);
  } catch (error) {
    const msg = error.message.toLowerCase();
    const shouldFallback =
      msg.includes('quota') || msg.includes('rate') || msg.includes('429') ||
      msg.includes('not found') || msg.includes('not supported') ||
      msg.includes('resource has been exhausted') || msg.includes('limit') ||
      msg.includes('quota exceeded');

    if (shouldFallback) {
      console.log('[Fallback] Gemini quota/rate hit → routing to OpenRouter');
      if (!openRouterKey) {
        throw new Error('Gemini quota exceeded AND no OpenRouter key. Click ⚙ to add OpenRouter key.');
      }
      return await callOpenRouter(prompt, options);
    }
    throw error;
  }
}

// ---- Chat (multi-turn) ----

async function chatGemini(history, newMessage, options = {}) {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('No Gemini API key. Click ⚙ to add your key.');

  const model = options.model || DEFAULT_MODEL;
  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;

  const contents = history.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));
  contents.push({ role: 'user', parts: [{ text: newMessage }] });

  const requestBody = {
    contents,
    generationConfig: {
      maxOutputTokens: options.maxTokens || 2048,
      temperature: options.temperature ?? 0.7,
    },
  };

  if (options.systemInstruction) {
    requestBody.systemInstruction = { parts: [{ text: options.systemInstruction }] };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ---- Vision ----

async function visionGemini(base64Image, mimeType, prompt, options = {}) {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('No Gemini API key. Click ⚙ to add your key.');

  const model = options.model || 'gemini-2.0-flash';
  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{
      parts: [
        { inlineData: { mimeType, data: base64Image } },
        { text: prompt },
      ],
    }],
    generationConfig: {
      maxOutputTokens: options.maxTokens || 2048,
      temperature: options.temperature ?? 0.7,
    },
  };

  if (options.systemInstruction) {
    requestBody.systemInstruction = { parts: [{ text: options.systemInstruction }] };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ---- Page Content Extraction (reliable, with fallback) ----

async function getPageContent() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) throw new Error('No active tab found.');

  // Try content script message first
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractContent' });
    if (response?.text && response.text.length > 50) return response;
  } catch (e) {
    // Content script not injected — fall through to executeScript
  }

  // Fallback: inject extraction directly
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const article = document.querySelector('article') || document.querySelector('main') || document.body;
      const clone = article.cloneNode(true);
      clone.querySelectorAll('script, style, nav, footer, aside, header, iframe, .ad, [role="navigation"]')
        .forEach(el => el.remove());
      return {
        title: document.title,
        url: window.location.href,
        text: clone.innerText.replace(/\n{3,}/g, '\n\n').trim().slice(0, 15000),
        metaDescription: document.querySelector('meta[name="description"]')?.content || '',
      };
    },
  });

  if (results?.[0]?.result?.text) return results[0].result;
  throw new Error('Could not read page content. Try refreshing the page.');
}