// Prints the running app's console (console.log/warn/error) in the terminal,
// for when the DevTools window won't load. Usage: node scripts/console-tail.js
const http = require('http');
const WebSocket = require('ws');

const METRO = process.env.METRO_PORT || 8081;

http.get(`http://localhost:${METRO}/json/list`, res => {
  let body = '';
  res.on('data', c => (body += c));
  res.on('end', () => {
    const targets = JSON.parse(body);
    if (!targets.length) return console.log('No app connected to Metro. Open the app first.');
    const t = targets[0];
    console.log(`Connected to ${t.deviceName} (${t.title}). Ctrl+C to stop.\n`);
    const ws = new WebSocket(t.webSocketDebuggerUrl, { headers: { Origin: `http://localhost:${METRO}` } });
    ws.on('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
    });
    ws.on('message', raw => {
      const m = JSON.parse(raw);
      if (m.method !== 'Runtime.consoleAPICalled') return;
      const { type, args } = m.params;
      const text = args
        .map(a => (a.value !== undefined ? (typeof a.value === 'string' ? a.value : JSON.stringify(a.value)) : a.description || a.type))
        .join(' ');
      console.log(`[${type}] ${text}`);
    });
    ws.on('close', () => console.log('Disconnected (app reloaded?). Run again.'));
    ws.on('error', e => console.log('Error:', e.message));
  });
}).on('error', e => console.log('Metro not reachable:', e.message));
