const STORAGE_KEY = 'linguapath.learning.v1';
const CATEGORY_LABELS = {
  grammar: '文法',
  vocabulary: '單字',
  reading: '閱讀',
  listening: '聽力',
};
const PART_LABELS = {
  part2: 'Part 2・問答應答',
  part3: 'Part 3・職場對話',
  part4: 'Part 4・簡短獨白',
  part5: 'Part 5・句子填空',
  part6: 'Part 6・短文填空',
  part7: 'Part 7・閱讀理解',
  listening: '聽力・對話理解',
};
const ACCENT_LABELS = {
  'en-US': '美式',
  'en-GB': '英式',
  'en-AU': '澳洲',
  'en-CA': '加拿大',
};
const PART_CATEGORIES = {
  part2: ['listening'],
  part3: ['listening'],
  part4: ['listening'],
  part5: ['grammar', 'vocabulary'],
  part6: ['grammar', 'vocabulary'],
  part7: ['reading'],
};
const LETTERS = ['A', 'B', 'C', 'D'];
const state = {
  answers: [],
  questions: [],
  questionIndex: 0,
  part: 'part5',
  topic: '',
  source: 'demo',
  selectedIndex: null,
  transcriptVisible: false,
};
let toastTimer;

const elements = {
  dashboard: document.querySelector('#dashboard-view'),
  practice: document.querySelector('#practice-view'),
  pageLabel: document.querySelector('#page-label'),
  aiStatus: document.querySelector('#ai-status'),
  attempts: document.querySelector('#stat-attempts'),
  accuracy: document.querySelector('#stat-accuracy'),
  score: document.querySelector('#stat-score'),
  chart: document.querySelector('#skill-chart'),
  recommendation: document.querySelector('#recommendation'),
  recent: document.querySelector('#recent-list'),
  clearHistory: document.querySelector('#clear-history'),
  form: document.querySelector('#practice-form'),
  part: document.querySelector('#part-select'),
  topic: document.querySelector('#topic-select'),
  customTopic: document.querySelector('#custom-topic-input'),
  customTopicLabel: document.querySelector('#custom-topic-label'),
  category: document.querySelector('#category-select'),
  accent: document.querySelector('#accent-select'),
  accentLabel: document.querySelector('#accent-label'),
  startButton: document.querySelector('#start-button'),
  generationNote: document.querySelector('#generation-note'),
  quizPanel: document.querySelector('#quiz-panel'),
  quizContent: document.querySelector('#quiz-content'),
  toast: document.querySelector('#toast'),
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => elements.toast.classList.remove('is-visible'), 3400);
}

function loadAnswers() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved) || !saved.every((answer) => (
      CATEGORY_LABELS[answer.category]
      && typeof answer.correct === 'boolean'
      && typeof answer.prompt === 'string'
      && typeof answer.timestamp === 'string'
    ))) {
      throw new Error('Saved learning history did not match the expected format');
    }
    return saved.slice(-500);
  } catch (error) {
    console.error('Unable to read saved learning history:', error.message);
    showToast('本機學習紀錄格式無法讀取，已從空白紀錄開始。');
    return [];
  }
}

function saveAnswers() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.answers.slice(-500)));
  } catch (error) {
    console.error('Unable to save learning history:', error.message);
    showToast('無法保存學習紀錄，請檢查瀏覽器儲存空間設定。');
  }
}

function summarize() {
  const totals = Object.fromEntries(Object.keys(CATEGORY_LABELS).map((category) => [
    category,
    { attempts: 0, correct: 0, incorrect: 0 },
  ]));
  for (const answer of state.answers) {
    totals[answer.category].attempts += 1;
    if (answer.correct) totals[answer.category].correct += 1;
    else totals[answer.category].incorrect += 1;
  }
  const attempts = state.answers.length;
  const correct = state.answers.filter((answer) => answer.correct).length;
  const accuracy = attempts ? Math.round((correct / attempts) * 100) : null;
  const score = accuracy === null ? null : Math.round(250 + accuracy * 7.5);
  return { totals, attempts, accuracy, score };
}

function createSvgNode(name, attributes = {}) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

function renderChart(totals) {
  const center = { x: 180, y: 126 };
  const radius = 83;
  const categories = ['grammar', 'vocabulary', 'reading', 'listening'];
  const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
  elements.chart.replaceChildren();

  for (const scale of [0.25, 0.5, 0.75, 1]) {
    const points = angles.map((angle) => `${center.x + Math.cos(angle) * radius * scale},${center.y + Math.sin(angle) * radius * scale}`).join(' ');
    elements.chart.append(createSvgNode('polygon', { points, class: 'chart-grid' }));
  }
  for (const angle of angles) {
    elements.chart.append(createSvgNode('line', {
      x1: center.x, y1: center.y,
      x2: center.x + Math.cos(angle) * radius,
      y2: center.y + Math.sin(angle) * radius,
      class: 'chart-axis',
    }));
  }

  const values = categories.map((category) => (
    totals[category].attempts
      ? totals[category].correct / totals[category].attempts
      : 0.12
  ));
  const points = angles.map((angle, index) => ({
    x: center.x + Math.cos(angle) * radius * values[index],
    y: center.y + Math.sin(angle) * radius * values[index],
  }));
  elements.chart.append(createSvgNode('polygon', {
    points: points.map((point) => `${point.x},${point.y}`).join(' '),
    class: 'chart-area',
  }));
  for (const point of points) {
    elements.chart.append(createSvgNode('circle', { cx: point.x, cy: point.y, r: 4, class: 'chart-point' }));
  }

  const labels = [
    { text: '文法', x: center.x, y: 20, anchor: 'middle' },
    { text: '單字', x: 302, y: center.y + 4, anchor: 'start' },
    { text: '閱讀', x: center.x, y: 245, anchor: 'middle' },
    { text: '聽力', x: 56, y: center.y + 4, anchor: 'end' },
  ];
  for (const label of labels) {
    const node = createSvgNode('text', { x: label.x, y: label.y, 'text-anchor': label.anchor, class: 'chart-label' });
    node.textContent = label.text;
    elements.chart.append(node);
  }
}

function getWeakestCategory(totals) {
  const attempted = Object.entries(totals).filter(([, value]) => value.attempts > 0);
  if (!attempted.length) return null;
  return attempted.sort((left, right) => (
    (right[1].incorrect / right[1].attempts) - (left[1].incorrect / left[1].attempts)
    || right[1].incorrect - left[1].incorrect
  ))[0][0];
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? '最近'
    : new Intl.DateTimeFormat('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

function renderRecent() {
  const recent = state.answers.slice(-5).reverse();
  elements.clearHistory.disabled = state.answers.length === 0;
  if (!recent.length) {
    elements.recent.innerHTML = '<div class="empty-state">完成第一題後，作答紀錄會出現在這裡。</div>';
    return;
  }
  elements.recent.innerHTML = recent.map((answer) => `
    <div class="recent-item">
      <div class="recent-result ${answer.correct ? 'correct' : 'incorrect'}">${answer.correct ? '✓' : '×'}</div>
      <div class="recent-copy"><strong>${escapeHtml(answer.prompt)}</strong><span>${escapeHtml(PART_LABELS[answer.part] || '練習')}・${escapeHtml(CATEGORY_LABELS[answer.category])}</span></div>
      <span class="recent-time">${escapeHtml(formatTime(answer.timestamp))}</span>
    </div>
  `).join('');
}

function renderRecommendation(totals) {
  const weakest = getWeakestCategory(totals);
  if (!weakest) {
    elements.recommendation.innerHTML = '<div class="recommendation-icon">✧</div><h3>讓練習開始累積</h3><p>完成幾題後，我們會整理你的答題表現，找出最值得優先練習的方向。</p>';
    return;
  }
  const data = totals[weakest];
  const rate = Math.round((data.incorrect / data.attempts) * 100);
  const nextPart = weakest === 'reading' ? 'part7' : weakest === 'listening' ? 'part3' : 'part5';
  elements.recommendation.innerHTML = `
    <div class="recommendation-icon">✧</div>
    <h3>優先練習：${escapeHtml(CATEGORY_LABELS[weakest])}</h3>
    <p>目前 ${data.attempts} 題中有 ${data.incorrect} 題需要再加強（錯誤率 ${rate}%）。建議下一組從這個方向開始。</p>
    <button class="button button-soft recommendation-action" type="button">練習${escapeHtml(CATEGORY_LABELS[weakest])} <span aria-hidden="true">→</span></button>
  `;
  elements.recommendation.querySelector('.recommendation-action').addEventListener('click', () => {
    elements.part.value = nextPart;
    elements.category.value = weakest;
    showView('practice');
  });
}

function renderDashboard() {
  const summary = summarize();
  elements.attempts.innerHTML = `${summary.attempts} <small>題</small>`;
  elements.accuracy.innerHTML = summary.accuracy === null ? '—<small>%</small>' : `${summary.accuracy}<small>%</small>`;
  elements.score.textContent = summary.score === null ? '—' : String(summary.score);
  renderChart(summary.totals);
  renderRecommendation(summary.totals);
  renderRecent();
}

function updateCategoryOptions() {
  const supported = PART_CATEGORIES[elements.part.value];
  for (const option of elements.category.options) {
    if (!option.value) continue;
    option.disabled = !supported.includes(option.value);
  }
  if (elements.category.value && !supported.includes(elements.category.value)) {
    elements.category.value = '';
  }
}

function showView(view) {
  const isPractice = view === 'practice';
  elements.dashboard.classList.toggle('is-hidden', isPractice);
  elements.practice.classList.toggle('is-hidden', !isPractice);
  elements.pageLabel.textContent = isPractice ? '開始練習' : '總覽';
  document.querySelectorAll('.nav-link').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.view === view);
  });
  if (isPractice) elements.part.focus({ preventScroll: true });
}

function currentQuestion() {
  return state.questions[state.questionIndex];
}

function recordAnswer(question, selectedIndex) {
  state.answers.push({
    category: question.category,
    correct: selectedIndex === question.answerIndex,
    prompt: question.prompt,
    part: question.part,
    timestamp: new Date().toISOString(),
  });
  state.answers = state.answers.slice(-500);
  saveAnswers();
  renderDashboard();
}

function getQuestionContext(question) {
  if (['part6', 'part7'].includes(question.part) && question.passage) {
    const passage = escapeHtml(question.passage).replace(/_{2,}/g, '<span class="blank">_____</span>');
    return `<div class="question-context">${passage}</div>`;
  }
  if (PART_CATEGORIES[question.part].includes('listening') && state.transcriptVisible && question.audioScript) {
    return `<div class="question-context"><strong>聽力逐字稿</strong><br>${escapeHtml(question.audioScript)}</div>`;
  }
  return '';
}

function renderQuestion() {
  const question = currentQuestion();
  if (!question) return renderSummary();
  const completed = state.questionIndex;
  const progress = (completed / state.questions.length) * 100;
  const isListening = PART_CATEGORIES[question.part].includes('listening');
  const answerStatus = state.selectedIndex === null ? '' : 'disabled';
  const displayedPrompt = ['part5', 'part6'].includes(question.part)
    ? escapeHtml(question.prompt).replace(/_{2,}/g, '<span class="blank">_____</span>')
    : escapeHtml(question.prompt);

  elements.quizContent.innerHTML = `
    <div class="quiz-topline"><span>${escapeHtml(PART_LABELS[question.part])}・${escapeHtml(CATEGORY_LABELS[question.category])}</span><span>第 ${completed + 1} 題 / ${state.questions.length}</span></div>
    <div class="quiz-progress"><span style="width:${progress}%"></span></div>
    ${getQuestionContext(question)}
    ${isListening ? `<div class="audio-controls"><button class="audio-button" id="play-audio" type="button">▶ 播放聽力</button><button class="audio-button transcript-toggle" id="toggle-transcript" type="button">${state.transcriptVisible ? '隱藏逐字稿' : '顯示逐字稿'}</button><span class="subheading">口音：${escapeHtml(ACCENT_LABELS[elements.accent.value])}</span></div>` : ''}
    <div class="question-text">${displayedPrompt}</div>
    <div class="answer-list">${question.options.map((option, index) => {
      let stateClass = '';
      if (state.selectedIndex !== null && index === question.answerIndex) stateClass = 'is-correct';
      else if (state.selectedIndex === index) stateClass = 'is-wrong';
      return `<button class="answer-option ${stateClass}" data-answer="${index}" type="button" ${answerStatus}><span class="option-letter">${LETTERS[index]}</span><span>${escapeHtml(option)}</span></button>`;
    }).join('')}</div>
    <div id="feedback-slot"></div>
    <div id="next-slot"></div>
  `;

  elements.quizContent.querySelectorAll('.answer-option').forEach((button) => {
    button.addEventListener('click', () => submitAnswer(Number(button.dataset.answer)));
  });
  document.querySelector('#play-audio')?.addEventListener('click', playListening);
  document.querySelector('#toggle-transcript')?.addEventListener('click', () => {
    state.transcriptVisible = !state.transcriptVisible;
    renderQuestion();
  });
  if (state.selectedIndex !== null) renderFeedback(question, state.selectedIndex, question.explanation);
}

function renderFeedback(question, selectedIndex, explanation, errorMessage = '') {
  const correct = selectedIndex === question.answerIndex;
  const feedbackSlot = document.querySelector('#feedback-slot');
  const nextSlot = document.querySelector('#next-slot');
  if (!feedbackSlot || !nextSlot) return;
  feedbackSlot.innerHTML = `
    <div class="answer-feedback">
      <strong>${correct ? '答對了！' : `再看一次：正確答案是 ${LETTERS[question.answerIndex]}．${escapeHtml(question.options[question.answerIndex])}`}</strong>
      ${escapeHtml(explanation)}
      ${errorMessage ? `<span class="feedback-error">${escapeHtml(errorMessage)}</span>` : ''}
    </div>
  `;
  const isLast = state.questionIndex === state.questions.length - 1;
  nextSlot.innerHTML = `<div class="quiz-actions"><button class="button button-soft" id="back-dashboard" type="button">回到儀表板</button><button class="button button-primary" id="next-question" type="button">${isLast ? '查看本組結果' : '下一題'} <span aria-hidden="true">→</span></button></div>`;
  document.querySelector('#back-dashboard').addEventListener('click', () => showView('dashboard'));
  document.querySelector('#next-question').addEventListener('click', () => {
    state.questionIndex += 1;
    state.selectedIndex = null;
    state.transcriptVisible = false;
    renderQuestion();
  });
}

async function submitAnswer(selectedIndex) {
  if (state.selectedIndex !== null) return;
  const question = currentQuestion();
  state.selectedIndex = selectedIndex;
  recordAnswer(question, selectedIndex);
  renderQuestion();
  const feedback = document.querySelector('#feedback-slot');
  feedback.innerHTML = '<div class="answer-feedback">家教正在整理解析…</div>';
  try {
    const response = await fetch('/api/explanations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, selectedIndex }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '解析服務目前無法使用');
    renderFeedback(question, selectedIndex, data.explanation);
  } catch (error) {
    console.error('Unable to load explanation:', error.message);
    renderFeedback(question, selectedIndex, question.explanation, 'AI 解析暫時無法連線，以上顯示題目內建解析。');
  }
}

function renderSummary() {
  const correct = state.answers.filter((answer) => answer.correct).length;
  const latest = state.answers.slice(-state.questions.length);
  const sessionCorrect = latest.filter((answer) => answer.correct).length;
  const sessionRate = latest.length ? Math.round((sessionCorrect / latest.length) * 100) : 0;
  elements.quizContent.innerHTML = `
    <div class="session-summary">
      <div class="summary-icon" aria-hidden="true">✦</div>
      <p class="eyebrow">PRACTICE COMPLETE</p>
      <h2>這一組練習完成了！</h2>
      <p>每一次檢視與修正，都是向前的一步。</p>
      <div class="summary-score">${sessionRate}%</div>
      <p>本組答對 ${sessionCorrect} / ${latest.length} 題 ・ 累積答對 ${correct} 題</p>
      <div class="quiz-actions"><button class="button button-soft" id="summary-dashboard" type="button">查看學習儀表板</button><button class="button button-primary" id="summary-again" type="button">再練一組 <span aria-hidden="true">→</span></button></div>
    </div>
  `;
  document.querySelector('#summary-dashboard').addEventListener('click', () => showView('dashboard'));
  document.querySelector('#summary-again').addEventListener('click', () => {
    elements.form.requestSubmit();
    elements.practice.scrollIntoView({ behavior: 'smooth' });
  });
}

async function startPractice(event) {
  event.preventDefault();
  const part = elements.part.value;
  const topic = (elements.topic.value === 'custom' ? elements.customTopic.value : elements.topic.value).trim();
  const category = elements.category.value;
  if (!topic || topic.length > 80) {
    showToast('請選擇練習主題，或輸入 1 到 80 個字元的自訂主題。');
    (elements.topic.value === 'custom' ? elements.customTopic : elements.topic).focus();
    return;
  }
  elements.startButton.disabled = true;
  elements.startButton.textContent = '正在準備題目…';
  try {
    const response = await fetch('/api/questions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ part, topic, category: category || undefined, count: 5 }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '無法準備題目');
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      throw new Error('題庫沒有回傳可練習的題目');
    }
    state.questions = data.questions;
    state.questionIndex = 0;
    state.selectedIndex = null;
    state.transcriptVisible = false;
    state.part = part;
    state.topic = topic;
    state.source = data.source;
    elements.quizPanel.classList.remove('is-hidden');
    renderQuestion();
    elements.quizPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (data.source === 'demo') {
      showToast('目前使用示範題庫；設定 OPENAI_API_KEY 即可依主題生成 AI 題目。');
    }
  } catch (error) {
    console.error('Unable to start practice:', error.message);
    showToast(error.message);
  } finally {
    elements.startButton.disabled = false;
    elements.startButton.innerHTML = '開始 5 題練習 <span aria-hidden="true">→</span>';
  }
}

function browserSpeech(text, accent) {
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    throw new Error('此瀏覽器不支援語音播放，請改用支援語音的瀏覽器。');
  }
  window.speechSynthesis.cancel();
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((item) => item.lang.toLowerCase() === accent.toLowerCase())
    || voices.find((item) => item.lang.toLowerCase().startsWith(accent.slice(0, 2).toLowerCase()));
  if (!voice) {
    throw new Error(`此瀏覽器沒有${ACCENT_LABELS[accent]}英語語音。請安裝對應語音，或設定 OPENAI_API_KEY 使用雲端語音。`);
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = accent;
  utterance.rate = 0.88;
  utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

async function playListening(event) {
  const button = event.currentTarget;
  const question = currentQuestion();
  button.disabled = true;
  const originalLabel = button.textContent;
  button.textContent = '正在準備語音…';
  try {
    const response = await fetch('/api/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: question.audioScript, accent: elements.accent.value }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      if (response.status !== 503 && response.status !== 502) throw new Error(errorData.error || '語音服務目前無法使用');
      browserSpeech(question.audioScript, elements.accent.value);
      const reason = response.status === 503 ? '雲端語音尚未設定' : '雲端語音服務暫時失敗';
      showToast(`${reason}，已改用瀏覽器語音播放${ACCENT_LABELS[elements.accent.value]}口音。`);
    } else {
      const audioUrl = URL.createObjectURL(await response.blob());
      const audio = new Audio(audioUrl);
      audio.addEventListener('ended', () => URL.revokeObjectURL(audioUrl), { once: true });
      audio.addEventListener('error', () => URL.revokeObjectURL(audioUrl), { once: true });
      await audio.play();
    }
  } catch (error) {
    console.error('Unable to play listening audio:', error.message);
    showToast(error.message);
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

async function checkAiStatus() {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) throw new Error(`Health check failed with HTTP ${response.status}`);
    const data = await response.json();
    elements.aiStatus.classList.toggle('is-ready', data.aiEnabled);
    elements.aiStatus.innerHTML = data.aiEnabled ? '<i></i> AI 服務已啟用' : '<i></i> 示範模式';
    elements.generationNote.textContent = data.aiEnabled
      ? 'LLM 依照所選題型與主題出題，答錯時提供個人化解析。'
      : data.localSpeech
        ? '目前使用示範題庫；Windows 可用已安裝的英語語音播放。設定 OPENAI_API_KEY 可啟用 AI 生成與多國口音雲端語音。'
        : '目前為示範模式。設定伺服器端 OPENAI_API_KEY 可啟用 AI 生成題目、解析與雲端語音。';
  } catch (error) {
    console.error('Unable to check AI service status:', error.message);
    elements.aiStatus.innerHTML = '<i></i> AI 狀態未知';
  }
}

document.querySelectorAll('.nav-link').forEach((button) => {
  button.addEventListener('click', () => showView(button.dataset.view));
});
document.querySelectorAll('[data-open-practice]').forEach((button) => {
  button.addEventListener('click', () => showView('practice'));
});
elements.part.addEventListener('change', () => {
  const listening = PART_CATEGORIES[elements.part.value].includes('listening');
  elements.accentLabel.classList.toggle('is-hidden', !listening);
  updateCategoryOptions();
});
elements.topic.addEventListener('change', () => {
  const custom = elements.topic.value === 'custom';
  elements.customTopicLabel.classList.toggle('is-hidden', !custom);
  if (custom) elements.customTopic.focus();
});
elements.form.addEventListener('submit', startPractice);
elements.clearHistory.addEventListener('click', () => {
  if (!state.answers.length) return;
  state.answers = [];
  saveAnswers();
  renderDashboard();
  showToast('已清除這台裝置上的學習紀錄。');
});

state.answers = loadAnswers();
elements.accentLabel.classList.toggle('is-hidden', !PART_CATEGORIES[elements.part.value].includes('listening'));
updateCategoryOptions();
renderDashboard();
checkAiStatus();
