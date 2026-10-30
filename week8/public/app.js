const CATEGORY_LABELS = {
  billing: '帳務與付款',
  technical: '技術問題',
  account: '帳戶與登入',
  shipping: '訂單與配送',
  other: '其他問題',
};
const SEVERITY_LABELS = { urgent: '緊急', high: '高', medium: '中', low: '低' };
const STATUS_LABELS = { open: '待處理', in_progress: '處理中', resolved: '已解決' };

const state = {
  tickets: [],
  selectedId: null,
  search: '',
  status: '',
  category: '',
  aiMode: 'demo',
};

const $ = (selector) => document.querySelector(selector);
const ticketList = $('#ticket-list');
const detailPanel = $('#detail-panel');
const dialog = $('#ticket-dialog');
let toastTimer;
let searchTimer;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function initials(name) {
  return Array.from(name.trim()).slice(0, 2).join('').toUpperCase();
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function showToast(message, isError = false) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
}

async function api(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: { 'content-type': 'application/json', ...options.headers },
    });
  } catch {
    throw new Error('無法連線到伺服器，請確認服務正在執行。');
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `伺服器錯誤（${response.status}）`);
  return result;
}

function currentFilters() {
  const params = new URLSearchParams();
  if (state.search) params.set('search', state.search);
  if (state.status) params.set('status', state.status);
  if (state.category) params.set('category', state.category);
  return params.toString();
}

async function loadHealth() {
  try {
    const health = await api('/api/health');
    state.aiMode = health.aiMode;
    const pill = $('#ai-mode-pill');
    const modeName = health.aiMode === 'ai'
      ? `${health.provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} AI 已啟用`
      : '示範分類模式 · 設定 API 金鑰以啟用 AI';
    pill.innerHTML = `<span class="sparkle">✳</span> ${escapeHtml(modeName)}`;
    pill.classList.toggle('demo', health.aiMode !== 'ai');
    $('#sidebar-ai-mode').textContent = health.aiMode === 'ai' ? 'AI 服務已啟用' : '示範模式';
    $('#sidebar-ai-copy').textContent = health.aiMode === 'ai'
      ? `由 ${health.provider} ${health.model || ''} 協助分析與草擬回覆。`
      : '目前使用內建規則提供分類示範；設定 API 金鑰即可啟用大型語言模型。';
  } catch (error) {
    $('#ai-mode-pill').textContent = 'AI 服務狀態無法取得';
    showToast(error.message, true);
  }
}

async function loadTickets() {
  ticketList.innerHTML = '<div class="loading-state"><span class="spinner"></span> 正在載入工單...</div>';
  try {
    const query = currentFilters();
    const result = await api(`/api/tickets${query ? `?${query}` : ''}`);
    state.tickets = result.tickets;
    renderStats(result.stats);
    renderTicketList();
    const visibleSelection = state.tickets.find((ticket) => ticket.id === state.selectedId);
    if (visibleSelection) renderDetail(visibleSelection);
    else {
      state.selectedId = null;
      renderEmptyDetail();
    }
  } catch (error) {
    ticketList.innerHTML = `<div class="empty-list">${escapeHtml(error.message)}<br><button class="text-button" data-action="refresh">重新載入</button></div>`;
    showToast(error.message, true);
  }
}

function renderStats(stats) {
  $('#stat-total').textContent = stats.total;
  $('#stat-open').textContent = stats.open;
  $('#stat-progress').textContent = stats.inProgress;
  $('#stat-resolved').textContent = stats.resolved;
  $('#open-count').textContent = stats.open;
  $('#result-count').textContent = `${state.tickets.length} 張工單`;
}

function renderTicketList() {
  if (!state.tickets.length) {
    const hasFilters = state.search || state.status || state.category;
    ticketList.innerHTML = `
      <div class="empty-list">
        <strong>${hasFilters ? '沒有符合條件的工單' : '收件匣還沒有工單'}</strong>
        <span>${hasFilters ? '調整搜尋關鍵字或篩選條件，再試一次。' : '建立一張新工單，體驗 AI 自動分類與回覆建議。'}</span>
        ${hasFilters ? '' : '<button class="text-button" data-action="new">＋ 建立第一張工單</button>'}
      </div>`;
    return;
  }
  ticketList.innerHTML = state.tickets.map((ticket) => `
    <button class="ticket-row${ticket.id === state.selectedId ? ' selected' : ''}" type="button" data-ticket-id="${escapeHtml(ticket.id)}">
      <span class="ticket-row-top">
        <span class="ticket-customer"><span class="avatar avatar-agent">${escapeHtml(initials(ticket.customerName))}</span><strong>${escapeHtml(ticket.customerName)}</strong></span>
        <span class="ticket-time">${escapeHtml(formatTime(ticket.updatedAt))}</span>
      </span>
      <span class="ticket-subject">${escapeHtml(ticket.subject)}</span>
      <span class="ticket-row-bottom">
        <span class="ticket-meta">
          <span class="ticket-chip category-${escapeHtml(ticket.category)}">${escapeHtml(CATEGORY_LABELS[ticket.category] || '其他問題')}</span>
          <span class="status-chip status-${escapeHtml(ticket.status)}">${escapeHtml(STATUS_LABELS[ticket.status] || ticket.status)}</span>
        </span>
        <span class="ticket-preview">${escapeHtml(ticket.summary)}</span>
      </span>
    </button>`).join('');
}

function renderEmptyDetail() {
  detailPanel.innerHTML = `
    <div class="empty-detail">
      <div class="empty-illustration"><span>✳</span><i></i><b></b></div>
      <h2>${state.tickets.length ? '選擇一張工單' : '開始處理客戶需求'}</h2>
      <p>${state.tickets.length
    ? '從左側收件匣選取工單，查看客戶訊息、AI 分析與回覆建議。'
    : '建立一張工單後，AI 會協助辨識問題層級並草擬建議回覆。'}</p>
      <button class="button button-secondary" data-action="new" type="button">＋ 建立新工單</button>
    </div>`;
}

function renderDetail(ticket) {
  const messages = ticket.messages.map((message) => `
    <div class="conversation-item ${message.sender === 'agent' ? 'agent' : ''}">
      <span class="avatar ${message.sender === 'agent' ? '' : 'avatar-agent'}">${message.sender === 'agent' ? 'JD' : escapeHtml(initials(ticket.customerName))}</span>
      <div class="conversation-copy">
        <div class="conversation-meta"><strong>${message.sender === 'agent' ? '客服團隊' : escapeHtml(ticket.customerName)}</strong><span>${escapeHtml(formatTime(message.createdAt))}</span></div>
        <div class="conversation-message">${escapeHtml(message.body)}</div>
      </div>
    </div>`).join('');
  detailPanel.innerHTML = `
    <article class="ticket-detail">
      <header class="detail-header">
        <div class="detail-heading">
          <div class="ticket-id">工單 #${escapeHtml(ticket.id.slice(0, 8).toUpperCase())} · 建立於 ${escapeHtml(formatTime(ticket.createdAt))}</div>
          <h2>${escapeHtml(ticket.subject)}</h2>
        </div>
        <div class="detail-actions">
          <span class="severity-chip severity-${escapeHtml(ticket.severity)}">優先級 · ${escapeHtml(SEVERITY_LABELS[ticket.severity] || ticket.severity)}</span>
          <select id="detail-status" aria-label="更新工單狀態" data-ticket-id="${escapeHtml(ticket.id)}">
            ${Object.entries(STATUS_LABELS).map(([value, label]) => `<option value="${value}"${ticket.status === value ? ' selected' : ''}>${label}</option>`).join('')}
          </select>
        </div>
      </header>
      <div class="detail-body">
        <div class="customer-line">
          <span class="avatar">${escapeHtml(initials(ticket.customerName))}</span>
          <div><strong>${escapeHtml(ticket.customerName)}</strong><small>${escapeHtml(ticket.customerEmail)}</small></div>
        </div>
        <div class="section-label">客戶問題</div>
        <div class="message-card">${escapeHtml(ticket.message)}</div>
        <section class="analysis-section">
          <div class="analysis-title"><span>✳</span> AI 工單分析 ${ticket.source === 'ai' ? '<span class="confidence">AI 模型分析</span>' : '<span class="confidence">內建示範規則</span>'}</div>
          <p class="analysis-summary">${escapeHtml(ticket.summary)}</p>
          <div class="analysis-tags">
            <span class="ticket-chip category-${escapeHtml(ticket.category)}">${escapeHtml(CATEGORY_LABELS[ticket.category] || '其他問題')}</span>
            <span class="severity-chip severity-${escapeHtml(ticket.severity)}">${escapeHtml(SEVERITY_LABELS[ticket.severity] || ticket.severity)}優先級</span>
            <span class="confidence">信心度 ${Math.round(ticket.confidence * 100)}%</span>
          </div>
        </section>
        <div class="conversation">${messages}</div>
        <section class="reply-section">
          <div class="reply-toolbar">
            <div class="section-label">回覆客戶</div>
            <button class="text-button" id="use-suggestion" type="button">✳ 套用 AI 建議回覆</button>
          </div>
          <textarea class="reply-box" id="reply-box" maxlength="2000" placeholder="輸入回覆內容..."></textarea>
          <div class="reply-actions">
            <button class="button button-secondary" id="copy-email" type="button">複製客戶信箱</button>
            <button class="button button-primary" id="send-reply" type="button">送出回覆 →</button>
          </div>
          <div class="detail-notice" id="detail-notice" role="alert" hidden></div>
        </section>
      </div>
    </article>`;
}

function openDialog() {
  $('#form-error').hidden = true;
  $('#ticket-form').reset();
  dialog.showModal();
  $('#ticket-form').elements.customerName.focus();
}

function showFormError(message) {
  const error = $('#form-error');
  error.textContent = message;
  error.hidden = false;
}

async function createTicket(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const button = $('#submit-ticket');
  button.disabled = true;
  $('#submit-label').textContent = 'AI 分析中...';
  $('#form-error').hidden = true;
  try {
    const data = Object.fromEntries(new FormData(form).entries());
    const result = await api('/api/tickets', { method: 'POST', body: JSON.stringify(data) });
    dialog.close();
    state.selectedId = result.ticket.id;
    await loadTickets();
    showToast('工單已建立，AI 分析完成。');
  } catch (error) {
    showFormError(error.message);
  } finally {
    button.disabled = false;
    $('#submit-label').textContent = '建立並分析';
  }
}

async function changeStatus(select) {
  const ticketId = select.dataset.ticketId;
  const status = select.value;
  select.disabled = true;
  try {
    const result = await api(`/api/tickets/${encodeURIComponent(ticketId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await loadTickets();
    showToast(`工單狀態已更新為「${STATUS_LABELS[result.ticket.status]}」。`);
  } catch (error) {
    showToast(error.message, true);
    await loadTickets();
  }
}

async function sendReply() {
  const body = $('#reply-box').value.trim();
  const notice = $('#detail-notice');
  if (!body) {
    notice.textContent = '請先輸入回覆內容。';
    notice.hidden = false;
    return;
  }
  const button = $('#send-reply');
  button.disabled = true;
  notice.hidden = true;
  try {
    await api(`/api/tickets/${encodeURIComponent(state.selectedId)}/replies`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
    await loadTickets();
    showToast('回覆已新增至工單對話。');
  } catch (error) {
    notice.textContent = error.message;
    notice.hidden = false;
  } finally {
    if (document.body.contains(button)) button.disabled = false;
  }
}

async function copyEmail() {
  const ticket = state.tickets.find((item) => item.id === state.selectedId);
  if (!ticket) return;
  try {
    await navigator.clipboard.writeText(ticket.customerEmail);
    showToast('客戶信箱已複製。');
  } catch {
    showToast('無法存取剪貼簿，請手動複製客戶信箱。', true);
  }
}

document.addEventListener('click', (event) => {
  const target = event.target;
  const ticketRow = target.closest('[data-ticket-id].ticket-row');
  if (ticketRow) {
    state.selectedId = ticketRow.dataset.ticketId;
    renderTicketList();
    const ticket = state.tickets.find((item) => item.id === state.selectedId);
    if (ticket) renderDetail(ticket);
    return;
  }
  const action = target.closest('[data-action]')?.dataset.action;
  if (action === 'new') openDialog();
  if (action === 'refresh') loadTickets();
});

$('#new-ticket-button').addEventListener('click', openDialog);
$('#empty-new-ticket').addEventListener('click', openDialog);
$('#close-dialog').addEventListener('click', () => dialog.close());
$('#cancel-dialog').addEventListener('click', () => dialog.close());
$('#ticket-form').addEventListener('submit', createTicket);
$('#refresh-button').addEventListener('click', loadTickets);
$('#search-input').addEventListener('input', (event) => {
  clearTimeout(searchTimer);
  state.search = event.target.value.trim();
  searchTimer = setTimeout(loadTickets, 220);
});
$('#status-filter').addEventListener('change', (event) => {
  state.status = event.target.value;
  loadTickets();
});
$('#category-filter').addEventListener('change', (event) => {
  state.category = event.target.value;
  loadTickets();
});
detailPanel.addEventListener('change', (event) => {
  if (event.target.id === 'detail-status') changeStatus(event.target);
});
detailPanel.addEventListener('click', (event) => {
  if (event.target.id === 'use-suggestion') {
    const ticket = state.tickets.find((item) => item.id === state.selectedId);
    if (ticket) {
      $('#reply-box').value = ticket.suggestedReply;
      $('#reply-box').focus();
    }
  }
  if (event.target.id === 'send-reply') sendReply();
  if (event.target.id === 'copy-email') copyEmail();
});
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    $('#search-input').focus();
  }
});

$('#today-label').textContent = new Intl.DateTimeFormat('zh-TW', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
}).format(new Date());
loadHealth();
loadTickets();
