// chatbot-widget.js - Standalone JavaScript
(function () {
  if (window.__CHATBOT_WIDGET_LOADED) return;
  window.__CHATBOT_WIDGET_LOADED = true;
  const api = window.CHATBOT_API || '';
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = 'chatbot-widget.css';
  document.head.appendChild(style);
  const btn = document.createElement('button');
  btn.id = 'chatbot-btn';
  btn.innerText = '💬';
  document.body.appendChild(btn);
  const container = document.createElement('div');
  container.id = 'chatbot-container';
  container.innerHTML = `<div id="chatbot-header">AI Chatbot <span id="chatbot-close">×</span></div><div id="chatbot-messages"></div><form id="chatbot-form"><input id="chatbot-input" autocomplete="off" placeholder="Ask me anything..."/><button>Send</button></form>`;
  document.body.appendChild(container);
  btn.onclick = () => container.classList.toggle('open');
  document.getElementById('chatbot-close').onclick = () => container.classList.remove('open');
  const form = document.getElementById('chatbot-form');
  const input = document.getElementById('chatbot-input');
  const messages = document.getElementById('chatbot-messages');
  function addMsg(text, from) {
    const div = document.createElement('div');
    div.className = 'msg ' + from;
    div.innerText = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }
  form.onsubmit = async (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    addMsg(q, 'user');
    input.value = '';
    addMsg('...', 'bot');
    try {
      const res = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q })
      });
      const data = await res.json();
      messages.lastChild.innerText = data.message || 'No response.';
      if (data.sources) {
        const src = document.createElement('div');
        src.className = 'sources';
        src.innerText = 'Sources: ' + data.sources.map(s => s.title || s.name).join(', ');
        messages.appendChild(src);
      }
    } catch (e) {
      messages.lastChild.innerText = 'Error: ' + e.message;
    }
  };
})();