// client/main.js

const messagesEl = document.getElementById('messages');
const usernameEl = document.getElementById('username');
const peerUrlEl = document.getElementById('peerUrl');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

let lastId = 0;
const localBase = window.location.origin; // this VM's server
// Use polling interval (ms)
const POLL_INTERVAL = 1000;

function addMessageToDOM(m, me=false) {
  const d = document.createElement('div');
  d.className = 'msg' + (me ? ' me' : '');
  d.innerHTML = `<strong>${escapeHtml(m.username)}</strong> <small>${new Date(m.timestamp).toLocaleTimeString()}</small><div>${escapeHtml(m.text)}</div>`;
  messagesEl.appendChild(d);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

async function sendMessageTo(url) {
  const text = messageInput.value.trim();
  if (!text) return;
  const payload = { username: usernameEl.value || 'Anon', text };
  try {
    const resp = await fetch(url + '/send', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      console.error('send failed', await resp.text());
    } else {
      messageInput.value = '';
    }
  } catch (e) {
    console.error('send error', e);
  }
}

sendBtn.addEventListener('click', async () => {
  // send to local server and peer server (so both ends store the message)
  const peer = peerUrlEl.value.trim();
  // send to local
  await sendMessageTo(localBase);
  // if peer provided, try send to peer as well
  if (peer) {
    await sendMessageTo(peer);
  }
});

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendBtn.click();
});

// poll messages from local server
async function poll() {
  const q = lastId ? `?since=${lastId}` : '';
  try {
    const resp = await fetch(localBase + '/messages' + q);
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data.messages)) {
        for (const m of data.messages) {
          addMessageToDOM(m, false);
          lastId = Math.max(lastId, m.id || lastId);
        }
      }
    } else {
      console.error('poll failed', resp.status);
    }
  } catch (e) {
    console.error('poll error', e);
  }
  setTimeout(poll, POLL_INTERVAL);
}

// also pull peer messages optionally (if you want to show messages from peer server directly)
// Optional: to poll peer server too, uncomment and adapt.
// async function pollPeer() { ... }

poll();
