// chatbot-widget.js - Standalone JavaScript (no edit-name button)
(function () {
  try {
    if (document.getElementById('chatbot-btn')) return;

    const resolveApi = () => (
      window.CHATBOT_API || (typeof window.getEnv === 'function' ? window.getEnv('CHATBOT_API') : '') || ''
    );

    if (!document.querySelector('link[href$="chatbot-widget.css"]')) {
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = 'chatbot-widget.css';
      document.head.appendChild(style);
    }

    const btn = document.createElement('button');
    btn.id = 'chatbot-btn';
    btn.innerHTML = '💬';
    btn.setAttribute('aria-label', 'Open chat');
    document.body.appendChild(btn);

    const container = document.createElement('div');
    container.id = 'chatbot-container';
    container.innerHTML = [
      '<div id="chatbot-header">',
      '  <span class="title">Sensei🤖</span>',
      '  <div class="header-actions">',
      '    <button id="chatbot-faq-toggle" class="faq-toggle" title="Show FAQs">FAQ</button>',
      '    <span id="chatbot-close" title="Close">×</span>',
      '  </div>',
      '</div>',
      '<div id="chatbot-faq" class="hidden"></div>',
      '<div id="chatbot-messages"></div>',
      '<form id="chatbot-form">',
      '  <input id="chatbot-input" autocomplete="off" placeholder="Ask me anything..."/>',
      '  <button type="submit">Send</button>',
      '</form>'
    ].join('');
    document.body.appendChild(container);

    const form = document.getElementById('chatbot-form');
    const input = document.getElementById('chatbot-input');
    const messages = document.getElementById('chatbot-messages');
    const faqPanel = document.getElementById('chatbot-faq');
    const faqToggle = document.getElementById('chatbot-faq-toggle');
    const closeBtn = document.getElementById('chatbot-close');

    let welcomeShown = false;
    let userName = localStorage.getItem('chatbot_user_name') || '';
    const STORAGE_KEY = 'chatbot_history_v1';

    function loadHistory() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
      } catch (_) { return []; }
    }
    function saveHistory(list) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-100)));
      } catch (_) {}
    }
    function appendHistory(from, text) {
      const list = loadHistory();
      list.push({ from, text: String(text || '') });
      saveHistory(list);
    }

    const detectUiLanguage = () => {
      const lang = (document.documentElement.lang || navigator.language || 'en').toLowerCase();
      return lang.startsWith('fr') ? 'fr' : 'en';
    };
    const t = (key, lang) => {
      const fr = {
        welcome: "Bienvenue ! 👨🏾‍🏫 Je suis Sensei.🤖 Posez-moi vos questions sur les expériences, projets ou compétences d'Ousseini !",
        askName: "Avant de commencer, comment vous appelez-vous ?",
        thanksName: (n) => `Ravi de vous rencontrer, ${n} !`,
        placeholder: "Posez-moi une question...",
        send: "Envoyer"
      };
      const en = {
        welcome: "Welcome! 👨🏾‍🏫 I'm Sensei.🤖 Ask me anything about Ousseini's experiences, projects, or skills!",
        askName: "Before we start, what's your name?",
        thanksName: (n) => `Nice to meet you, ${n}!`,
        placeholder: "Ask me anything...",
        send: "Send"
      };
      const dict = lang === 'fr' ? fr : en;
      return dict[key];
    };

    function addWelcomeMessage() {
      if (welcomeShown) return;
      const lang = detectUiLanguage();
      const msgDiv = document.createElement('div');
      msgDiv.className = 'msg bot';
      // Neutral welcome; no unsolicited mention of experiences/projects/skills
      const welcome = lang === 'fr'
        ? "Bienvenue ! 👨🏾‍🏫 Je suis Sensei.🤖 Posez-moi vos questions !"
        : "Welcome! 👨🏾‍🏫 I'm Sensei.🤖 Ask me anything!";
      msgDiv.innerHTML = welcome;
      messages.appendChild(msgDiv);
      messages.scrollTop = messages.scrollHeight;
      welcomeShown = true;
      if (!userName) {
        const nameAsk = document.createElement('div');
        nameAsk.className = 'msg bot';
        nameAsk.textContent = t('askName', lang);
        messages.appendChild(nameAsk);
        messages.scrollTop = messages.scrollHeight;
      }
    }

    btn.addEventListener('click', () => {
      const wasOpen = container.classList.contains('open');
      container.classList.toggle('open');
      if (!wasOpen && !welcomeShown) addWelcomeMessage();
    });
    closeBtn && closeBtn.addEventListener('click', () => container.classList.remove('open'));

    function addMsg(text, from, persist = true) {
      const div = document.createElement('div');
      div.className = 'msg ' + from;
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
      if (persist) appendHistory(from, text);
    }

    // Restore history if present
    (function restoreHistory() {
      const hist = loadHistory();
      if (hist.length) {
        for (const m of hist) {
          if (!m || !m.text) continue;
          addMsg(m.text, m.from === 'user' ? 'user' : 'bot', false);
        }
        welcomeShown = true; // avoid re-showing welcome
      }
    })();

    const resolveFaqs = () => {
      const fromGlobal = (window.PortfolioChatbotConfig && Array.isArray(window.PortfolioChatbotConfig.faqs))
        ? window.PortfolioChatbotConfig.faqs
        : [];
      const fromSiteContent = (window.siteContent && window.siteContent.chatbot && Array.isArray(window.siteContent.chatbot.faqs))
        ? window.siteContent.chatbot.faqs
        : [];
      const defaults = [
        'What are your key projects?',
        'What AI/Machine Learning projects have you worked on?',
        'What certifications do you have?',
        'What are your core skills?',
        'Tell me about yourself',
        'How can I contact you?'
      ];
      const merged = [...fromGlobal, ...fromSiteContent];
      return merged.length ? merged : defaults;
    };

    function renderFaqs() {
      const faqs = resolveFaqs();
      if (!faqs || !faqs.length) {
        faqPanel.innerHTML = '';
        return;
      }
      const html = [
        '<div class="faq-list" role="list">',
        ...faqs.map(q => `<button type=\"button\" class=\"faq-item\" role=\"listitem\" data-q=\"${q.replace(/\\\"/g, '&quot;')}\">❓ ${q}</button>`),
        '</div>'
      ].join('');
      faqPanel.innerHTML = html;
      faqPanel.querySelectorAll('.faq-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const q = btn.getAttribute('data-q') || '';
          if (!q) return;
          sendMessage(q);
          faqPanel.classList.add('hidden');
        });
      });
    }

    function toggleFaq() {
      if (!faqPanel) return;
      if (faqPanel.classList.contains('hidden')) {
        renderFaqs();
        faqPanel.classList.remove('hidden');
      } else {
        faqPanel.classList.add('hidden');
      }
    }
    faqToggle && faqToggle.addEventListener('click', toggleFaq);

    async function sendMessage(q) {
      const lang = detectUiLanguage();
      if (!userName) {
        const cand = q.trim();
        if (cand && cand.split(/\s+/).length <= 4 && !/[?!.]/.test(cand)) {
          const cleaned = cand.replace(/[^\p{L} '\\-]/gu, '').trim();
          if (cleaned) {
            userName = cleaned;
            try { localStorage.setItem('chatbot_user_name', userName); } catch (e) {}
            const ack = document.createElement('div');
            ack.className = 'msg bot';
            ack.textContent = (t('thanksName', lang))(userName);
            messages.appendChild(ack);
            messages.scrollTop = messages.scrollHeight;
            return;
          }
        }
      }
      addMsg(q, 'user');
      input.value = '';
      const loadingMsg = document.createElement('div');
      loadingMsg.className = 'msg bot';
      loadingMsg.textContent = '...';
      messages.appendChild(loadingMsg);
      messages.scrollTop = messages.scrollHeight;
      try {
        const api = resolveApi();
        if (!api) {
          loadingMsg.textContent = 'API not configured. For local dev: create .env with CHATBOT_API=... and open via http://localhost:8000 (not file://).';
          return;
        }
        const res = await fetch(api, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: q, name: userName || undefined })
        });
        const data = await res.json();
        const msg = (data.message || '').replace(/\r\n/g, '\n');
        loadingMsg.textContent = msg;
        appendHistory('bot', msg);
        // Sources are intentionally not displayed in the chat UI.
      } catch (err) {
        loadingMsg.textContent = 'Error: ' + err.message;
      }
    }

    form && form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      await sendMessage(q);
    });

    (function localizeControls() {
      const lang = detectUiLanguage();
      if (input) input.placeholder = t('placeholder', lang);
      const submitBtn = form && form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.textContent = t('send', lang);
    })();

    console.log('Chatbot widget initialized');
  } catch (err) {
    console.error('Failed to initialize chatbot widget:', err);
  }
})();