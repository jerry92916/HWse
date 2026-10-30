const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { app, demoQuestions, getDemoQuestions, validateQuestion } = require('../server');

let server;
let baseUrl;
const nativeFetch = global.fetch;
let originalApiKey;

before(async () => {
  originalApiKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  global.fetch = nativeFetch;
  if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalApiKey;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('health endpoint reports server status without exposing secrets', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, 'ok');
});

test('static app serves the learning dashboard and browser script', async () => {
  const page = await fetch(baseUrl);
  const script = await fetch(`${baseUrl}/app.js`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /LinguaPath/);
  assert.equal(script.status, 200);
  assert.match(script.headers.get('content-type'), /javascript/);
});

test('demo generator returns five valid questions for each practice type', async () => {
  for (const part of ['part2', 'part3', 'part4', 'part5', 'part6', 'part7']) {
    const response = await fetch(`${baseUrl}/api/questions/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ part, topic: '軟體工程', count: 5 }),
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.source, 'demo');
    assert.equal(data.questions.length, 5);
    assert.ok(data.questions.every((question) => question.part === part && validateQuestion(question)));
  }
});

test('AI generator sends a server-side key and validates the model response', async () => {
  process.env.OPENAI_API_KEY = 'test-key-not-for-production';
  const generated = {
    part: 'part5',
    category: 'grammar',
    prompt: 'The report _____ ready.',
    options: ['is', 'are', 'be', 'being'],
    answerIndex: 0,
    explanation: '單數主詞搭配 is。',
    passage: '',
    audioScript: '',
  };
  global.fetch = async (url, options) => {
    assert.match(url, /\/chat\/completions$/);
    assert.equal(options.headers.Authorization, 'Bearer test-key-not-for-production');
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ questions: [generated] }) } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const response = await nativeFetch(`${baseUrl}/api/questions/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ part: 'part5', topic: 'technology', category: 'grammar', count: 1 }),
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.source, 'openai');
    assert.equal(data.questions[0].prompt, generated.prompt);
  } finally {
    global.fetch = nativeFetch;
    delete process.env.OPENAI_API_KEY;
  }
});

test('AI generator supports the new cloze format and validates its passage', async () => {
  process.env.OPENAI_API_KEY = 'test-key-not-for-production';
  const generated = {
    part: 'part6',
    category: 'grammar',
    prompt: 'Which word completes the notice?',
    options: ['before', 'since', 'unless', 'during'],
    answerIndex: 0,
    explanation: 'before 表示在活動開始前。',
    passage: 'Please register _____ Monday.',
    audioScript: '',
  };
  global.fetch = async (url, options) => {
    assert.match(url, /\/chat\/completions$/);
    const body = JSON.parse(options.body);
    assert.match(body.messages[1].content, /Part 6/);
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ questions: [generated] }) } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const response = await nativeFetch(`${baseUrl}/api/questions/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ part: 'part6', topic: '旅遊', category: 'grammar', count: 1 }),
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.questions[0].part, 'part6');
    assert.equal(data.questions[0].passage, generated.passage);
  } finally {
    global.fetch = nativeFetch;
    delete process.env.OPENAI_API_KEY;
  }
});

test('cloud TTS returns audio and passes the selected accent to the provider', async () => {
  process.env.OPENAI_API_KEY = 'test-key-not-for-production';
  global.fetch = async (url, options) => {
    assert.match(url, /\/audio\/speech$/);
    assert.equal(options.headers.Authorization, 'Bearer test-key-not-for-production');
    const body = JSON.parse(options.body);
    assert.match(body.instructions, /Australian/);
    return new Response(Buffer.from('mock audio'), {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  };

  try {
    const response = await nativeFetch(`${baseUrl}/api/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Good morning.', accent: 'en-AU' }),
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /audio\/mpeg/);
    assert.equal(await response.text(), 'mock audio');
  } finally {
    global.fetch = nativeFetch;
    delete process.env.OPENAI_API_KEY;
  }
});

test('generator prioritizes a requested skill and fills the remaining set', () => {
  const questions = getDemoQuestions({ part: 'part5', category: 'grammar', count: 5 });
  assert.equal(questions.length, 5);
  assert.equal(questions[0].part, 'part5');
  assert.equal(questions[0].category, 'grammar');
  assert.equal(new Set(questions.map((question) => question.id)).size, questions.length);
});

test('all supported question types have enough distinct demo questions', () => {
  for (const part of ['part2', 'part3', 'part4', 'part5', 'part6', 'part7']) {
    const questions = getDemoQuestions({ part, count: 5 });
    assert.equal(questions.length, 5, `${part} should return a full set`);
    assert.equal(new Set(questions.map((question) => question.id)).size, 5);
    assert.ok(questions.every(validateQuestion));
  }
});

test('explanation identifies the correct option and the learner answer', async () => {
  const question = demoQuestions.find((item) => item.id === 'p5-subject-verb');
  const response = await fetch(`${baseUrl}/api/explanations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, selectedIndex: 0 }),
  });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.source, 'demo');
  assert.match(data.explanation, /review/);
  assert.match(data.explanation, /reviews/);
});

test('AI explanation uses the submitted choice and returns model-generated text', async () => {
  process.env.OPENAI_API_KEY = 'test-key-not-for-production';
  global.fetch = async (url, options) => {
    assert.match(url, /\/chat\/completions$/);
    const body = JSON.parse(options.body);
    assert.match(body.messages[1].content, /review/);
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ explanation: '主詞為單數，因此選擇 reviews。' }) } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const question = demoQuestions.find((item) => item.id === 'p5-subject-verb');
    const response = await nativeFetch(`${baseUrl}/api/explanations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, selectedIndex: 0 }),
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.source, 'openai');
    assert.match(data.explanation, /單數/);
  } finally {
    global.fetch = nativeFetch;
    delete process.env.OPENAI_API_KEY;
  }
});

test('speech endpoint validates accents and uses local Windows voice when available', async () => {
  const invalid = await fetch(`${baseUrl}/api/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Hello', accent: 'unknown' }),
  });
  assert.equal(invalid.status, 400);

  if (process.platform === 'win32') {
    const localAudio = await fetch(`${baseUrl}/api/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hello, this is a listening test.', accent: 'en-US' }),
    });
    assert.equal(localAudio.status, 200);
    assert.match(localAudio.headers.get('content-type'), /audio\/wav/);
    const wav = Buffer.from(await localAudio.arrayBuffer());
    assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
    assert.equal(wav.toString('ascii', 8, 12), 'WAVE');

    const unavailableAccent = await fetch(`${baseUrl}/api/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hello', accent: 'en-AU' }),
    });
    assert.equal(unavailableAccent.status, 503);
    assert.match((await unavailableAccent.json()).error, /No Windows speech voice/);
  } else {
    const unavailable = await fetch(`${baseUrl}/api/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hello', accent: 'en-AU' }),
    });
    assert.equal(unavailable.status, 503);
  }
});

test('generator rejects unsupported practice options and malformed JSON', async () => {
  const invalidPart = await fetch(`${baseUrl}/api/questions/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ part: 'part9', topic: 'business' }),
  });
  assert.equal(invalidPart.status, 400);

  const invalidCategory = await fetch(`${baseUrl}/api/questions/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ part: 'part5', category: 'reading', topic: 'business' }),
  });
  assert.equal(invalidCategory.status, 400);

  const invalidTopic = await fetch(`${baseUrl}/api/questions/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ part: 'part5', topic: 123 }),
  });
  assert.equal(invalidTopic.status, 400);

  const malformed = await fetch(`${baseUrl}/api/questions/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"part":',
  });
  assert.equal(malformed.status, 400);
});

test('question validation rejects an out-of-range answer index', () => {
  const question = { ...demoQuestions[0], answerIndex: 4 };
  assert.equal(validateQuestion(question), false);
  const missingPassage = { ...demoQuestions.find((item) => item.part === 'part7'), passage: '' };
  assert.equal(validateQuestion(missingPassage), false);
});
