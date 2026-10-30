const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { createApp } = require('../server');
const { TicketStore } = require('../lib/ticket-store');
const {
  classifyWithAi,
  classifyWithRules,
  getAiConfiguration,
  parseClassification,
} = require('../lib/triage');

const classification = {
  category: 'billing',
  severity: 'high',
  summary: '客戶反映訂單遭重複扣款。',
  suggestedReply: '您好，我們已收到您的問題，將協助確認。',
  confidence: 0.91,
};

async function startServer(t, options = {}) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'week8-support-'));
  const dataFile = path.join(directory, 'tickets.json');
  const app = createApp({
    ...options,
    store: options.store || new TicketStore(dataFile),
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  t.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await fs.rm(directory, { recursive: true, force: true });
  });
  return { baseUrl: `http://127.0.0.1:${server.address().port}`, dataFile };
}

function validTicket(overrides = {}) {
  return {
    customerName: '林小明',
    customerEmail: 'ming@example.com',
    subject: '訂單重複扣款',
    message: '我的訂單被重複扣款，請協助確認這筆付款。',
    ...overrides,
  };
}

async function postTicket(baseUrl, body = validTicket()) {
  return fetch(`${baseUrl}/api/tickets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('health endpoint reports configured demo mode without exposing credentials', async (t) => {
  const { baseUrl } = await startServer(t, {
    getAiConfiguration: () => ({ mode: 'demo', provider: 'openai', model: 'gpt-test', apiKey: 'secret' }),
  });
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: 'ok',
    aiMode: 'demo',
    provider: 'openai',
    model: null,
  });
});

test('creates a ticket with AI classification and stores the original message', async (t) => {
  const { baseUrl } = await startServer(t, {
    classifyTicket: async () => classification,
    getAiConfiguration: () => ({ mode: 'ai', provider: 'openai', model: 'gpt-test' }),
  });
  const response = await postTicket(baseUrl);
  assert.equal(response.status, 201);
  const { ticket } = await response.json();
  assert.equal(ticket.category, 'billing');
  assert.equal(ticket.severity, 'high');
  assert.equal(ticket.source, 'ai');
  assert.equal(ticket.status, 'open');
  assert.equal(ticket.messages[0].body, validTicket().message);
  assert.match(ticket.id, /^[\da-f-]{36}$/);
});

test('rejects invalid ticket fields and email addresses', async (t) => {
  const { baseUrl } = await startServer(t);
  const invalidCases = [
    validTicket({ customerName: 'A' }),
    validTicket({ customerEmail: 'not-an-email' }),
    validTicket({ subject: 'ok' }),
    validTicket({ message: '短訊' }),
  ];
  for (const invalid of invalidCases) {
    const response = await postTicket(baseUrl, invalid);
    assert.equal(response.status, 400);
    assert.equal(typeof (await response.json()).error, 'string');
  }
  const list = await fetch(`${baseUrl}/api/tickets`);
  assert.equal((await list.json()).tickets.length, 0);
});

test('does not silently create an unclassified ticket when AI is unavailable', async (t) => {
  const { baseUrl } = await startServer(t, {
    classifyTicket: async () => { throw new Error('provider is offline'); },
  });
  const response = await postTicket(baseUrl);
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /AI 分類服務/);
  const list = await fetch(`${baseUrl}/api/tickets`);
  assert.equal((await list.json()).tickets.length, 0);
});

test('filters tickets while keeping dashboard statistics global', async (t) => {
  const { baseUrl } = await startServer(t, { classifyTicket: async () => classification });
  const first = await postTicket(baseUrl);
  const second = await postTicket(baseUrl, validTicket({
    customerName: '王小華',
    customerEmail: 'hua@example.com',
    subject: '付款問題第二筆',
  }));
  const firstTicket = (await first.json()).ticket;
  const secondTicket = (await second.json()).ticket;
  await fetch(`${baseUrl}/api/tickets/${firstTicket.id}/status`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status: 'resolved' }),
  });
  const response = await fetch(`${baseUrl}/api/tickets?search=王小華`);
  const result = await response.json();
  assert.equal(result.tickets.length, 1);
  assert.equal(result.tickets[0].id, secondTicket.id);
  assert.deepEqual(result.stats, { total: 2, open: 1, inProgress: 0, resolved: 1 });
});

test('updates ticket status, records replies, and persists them to disk', async (t) => {
  const { baseUrl, dataFile } = await startServer(t, { classifyTicket: async () => classification });
  const created = await postTicket(baseUrl);
  const ticket = (await created.json()).ticket;
  const replyResponse = await fetch(`${baseUrl}/api/tickets/${ticket.id}/replies`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ body: '您好，我們會協助確認付款紀錄。' }),
  });
  assert.equal(replyResponse.status, 201);
  const updated = (await replyResponse.json()).ticket;
  assert.equal(updated.status, 'in_progress');
  assert.equal(updated.messages.length, 2);
  assert.equal(updated.messages[1].sender, 'agent');
  const stored = JSON.parse(await fs.readFile(dataFile, 'utf8'));
  assert.equal(stored[0].messages.length, 2);
  const statusResponse = await fetch(`${baseUrl}/api/tickets/${ticket.id}/status`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status: 'resolved' }),
  });
  assert.equal((await statusResponse.json()).ticket.status, 'resolved');
});

test('returns clear errors for missing tickets and invalid status changes', async (t) => {
  const { baseUrl } = await startServer(t);
  const missing = await fetch(`${baseUrl}/api/tickets/not-found`);
  assert.equal(missing.status, 404);
  const invalid = await fetch(`${baseUrl}/api/tickets/not-found/status`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status: 'archived' }),
  });
  assert.equal(invalid.status, 400);
});

test('serves the support desk interface', async (t) => {
  const { baseUrl } = await startServer(t);
  const response = await fetch(baseUrl);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(await response.text(), /AI 驅動的客服工單系統/);
});

test('demo classifier assigns a category, severity, and reply suggestion', () => {
  const result = classifyWithRules('登入帳戶時發生錯誤，無法使用服務。');
  assert.equal(result.category, 'technical');
  assert.equal(result.severity, 'high');
  assert.ok(result.suggestedReply.length > 10);
  assert.ok(result.confidence >= 0 && result.confidence <= 1);
});

test('validates AI JSON output and rejects unsupported classification values', () => {
  assert.deepEqual(parseClassification(JSON.stringify(classification)), classification);
  assert.throws(() => parseClassification('not json'));
  assert.throws(() => parseClassification(JSON.stringify({ ...classification, category: 'unknown' })));
});

test('sends an OpenAI-compatible request and parses its classification', async () => {
  const originalFetch = global.fetch;
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify(classification) } }],
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  try {
    const result = await classifyWithAi(validTicket(), {
      mode: 'ai', provider: 'openai', model: 'gpt-test', apiKey: 'test-secret',
    });
    assert.deepEqual(result, classification);
    assert.equal(request.url, 'https://api.openai.com/v1/chat/completions');
    assert.equal(request.options.headers.authorization, 'Bearer test-secret');
  } finally {
    global.fetch = originalFetch;
  }
});

test('sends an Anthropic messages request and parses its classification', async () => {
  const originalFetch = global.fetch;
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({
      content: [{ type: 'text', text: JSON.stringify(classification) }],
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  try {
    const result = await classifyWithAi(validTicket(), {
      mode: 'ai', provider: 'anthropic', model: 'claude-test', apiKey: 'test-secret',
    });
    assert.deepEqual(result, classification);
    assert.equal(request.url, 'https://api.anthropic.com/v1/messages');
    assert.equal(request.options.headers['x-api-key'], 'test-secret');
  } finally {
    global.fetch = originalFetch;
  }
});

test('selects the provider-specific credential and reports demo mode without a key', () => {
  assert.deepEqual(getAiConfiguration({ AI_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: 'anth-key' }), {
    provider: 'anthropic',
    apiKey: 'anth-key',
    model: 'claude-3-5-haiku-latest',
    mode: 'ai',
  });
  assert.equal(getAiConfiguration({}).mode, 'demo');
  assert.throws(() => getAiConfiguration({ AI_PROVIDER: 'other' }), /AI_PROVIDER/);
});
