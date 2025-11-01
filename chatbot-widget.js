// chatbot-widget.js - Standalone JavaScript (clean robust version)
(function () {
  try {
    // Avoid duplicate initialization
    if (document.getElementById('chatbot-btn')) {
      console.log('Chatbot widget already present.');
      return;
    }

    // Resolve API lazily to allow env-loader + late assignment
    const resolveApi = () => {
      return (
        window.CHATBOT_API ||
        (typeof window.getEnv === 'function' ? window.getEnv('CHATBOT_API') : '') ||
        ''
      );
    };
    // Warn if loaded from file:// which breaks fetch and CORS
    if (window.location.protocol === 'file:') {
      console.warn('[chatbot] Running from file://. Start a local server (e.g., http://localhost:8000) so .env loads and CORS works.');
    }

    // Ensure CSS is loaded (only once)
    if (!document.querySelector('link[href*="widget/chatbot-widget.css"]')) {
      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = 'widget/chatbot-widget.css';
      document.head.appendChild(style);
    }

    // Floating button with inline fallback styles
    const btn = document.createElement('button');
    btn.id = 'chatbot-btn';
    btn.innerHTML = '💬';
    btn.setAttribute('aria-label', 'Open chat');
    btn.style.cssText = [
      'position: fixed !important',
      'bottom: 20px !important',
      'right: 20px !important',
      'width: 60px !important',
      'height: 60px !important',
      'border-radius: 50% !important',
      'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important',
      'color: #fff !important',
      'border: none !important',
      'font-size: 24px !important',
      'cursor: pointer !important',
      'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important',
      'z-index: 9999 !important',
      'display: flex !important',
      'align-items: center !important',
      'justify-content: center !important'
    ].join('; ');
    document.body.appendChild(btn);

    // Container
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

    // Elements
    const form = document.getElementById('chatbot-form');
    const input = document.getElementById('chatbot-input');
  const messages = document.getElementById('chatbot-messages');
  const faqPanel = document.getElementById('chatbot-faq');
  const faqToggle = document.getElementById('chatbot-faq-toggle');
    const closeBtn = document.getElementById('chatbot-close');

    let welcomeShown = false;

    function addWelcomeMessage() {
      if (welcomeShown) return;
      const msgDiv = document.createElement('div');
      msgDiv.className = 'msg bot';
      msgDiv.innerHTML = "Welcome! 👨🏾‍🏫 I'm Sensei.🤖 Ask me anything about Ousseini's experiences, projects, or skills!";
      messages.appendChild(msgDiv);
      messages.scrollTop = messages.scrollHeight;
      welcomeShown = true;
    }

    btn.addEventListener('click', () => {
      const wasOpen = container.classList.contains('open');
      container.classList.toggle('open');
      if (!wasOpen && !welcomeShown) addWelcomeMessage();
    });

    closeBtn && closeBtn.addEventListener('click', () => {
      container.classList.remove('open');
    });

    function addMsg(text, from) {
      const div = document.createElement('div');
      div.className = 'msg ' + from;
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    // Resolve FAQs from config with safe defaults
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
        ...faqs.map(q => `<button type="button" class="faq-item" role="listitem" data-q="${q.replace(/\"/g, '&quot;')}">❓ ${q}</button>`),
        '</div>'
      ].join('');
      faqPanel.innerHTML = html;
      // Wire clicks
      faqPanel.querySelectorAll('.faq-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const q = btn.getAttribute('data-q') || '';
          if (!q) return;
          sendMessage(q);
          // Close FAQ after sending
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
          body: JSON.stringify({ message: q })
        });
        const data = await res.json();
        loadingMsg.textContent = (data.message || '').replace(/\r\n/g, '\n');
        if (data.sources && data.sources.length > 0) {
          const src = document.createElement('div');
          src.className = 'sources';
          const labels = data.sources.map(s => {
            if (typeof s === 'string') return s;
            return s?.title || s?.name || '';
          }).filter(Boolean);
          src.textContent = 'Sources: ' + labels.join(', ');
          messages.appendChild(src);
          messages.scrollTop = messages.scrollHeight;
        }
      } catch (err) {
        loadingMsg.textContent = 'Error: ' + err.message;
      }
    }

    form && form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      // Delegate to shared sender
      await sendMessage(q);
    });

    console.log('Chatbot widget initialized');
  } catch (err) {
    console.error('Failed to initialize chatbot widget:', err);
  }
})();