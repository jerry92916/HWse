const path = require('node:path');
const express = require('express');
const { TicketStore } = require('./lib/ticket-store');
const {
  CATEGORIES,
  SEVERITIES,
  classifyTicket,
  getAiConfiguration,
} = require('./lib/triage');

const STATUSES = ['open', 'in_progress', 'resolved'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateNewTicket(body) {
  const fields = [
    ['customerName', '姓名', 2, 80],
    ['customerEmail', '電子郵件', 3, 254],
    ['subject', '問題主旨', 3, 120],
    ['message', '問題描述', 10, 5000],
  ];
  for (const [field, label, min, max] of fields) {
    if (typeof body[field] !== 'string') return `${label}為必填欄位。`;
    const value = body[field].trim();
    if (value.length < min || value.length > max) {
      return `${label}長度需介於 ${min} 至 ${max} 個字元。`;
    }
  }
  if (!EMAIL_PATTERN.test(body.customerEmail.trim())) return '請輸入有效的電子郵件地址。';
  return null;
}

function createApp(options = {}) {
  const app = express();
  const store = options.store || new TicketStore(
    process.env.TICKET_DATA_FILE || path.join(__dirname, 'data', 'tickets.json'),
  );
  const getConfiguration = options.getAiConfiguration || getAiConfiguration;
  const classifier = options.classifyTicket || classifyTicket;

  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/health', (request, response) => {
    const configuration = getConfiguration();
    response.json({
      status: 'ok',
      aiMode: configuration.mode,
      provider: configuration.provider,
      model: configuration.mode === 'ai' ? configuration.model : null,
    });
  });

  app.get('/api/tickets', async (request, response) => {
    const filters = {
      search: typeof request.query.search === 'string' ? request.query.search.slice(0, 100) : '',
      status: typeof request.query.status === 'string' ? request.query.status : '',
      category: typeof request.query.category === 'string' ? request.query.category : '',
      severity: typeof request.query.severity === 'string' ? request.query.severity : '',
    };
    if (filters.status && !STATUSES.includes(filters.status)) {
      return response.status(400).json({ error: '不支援的工單狀態。' });
    }
    if (filters.category && !CATEGORIES.includes(filters.category)) {
      return response.status(400).json({ error: '不支援的問題分類。' });
    }
    if (filters.severity && !SEVERITIES.includes(filters.severity)) {
      return response.status(400).json({ error: '不支援的問題層級。' });
    }
    const [tickets, allTickets] = await Promise.all([store.list(filters), store.list()]);
    return response.json({
      tickets,
      stats: {
        total: allTickets.length,
        open: allTickets.filter((ticket) => ticket.status === 'open').length,
        inProgress: allTickets.filter((ticket) => ticket.status === 'in_progress').length,
        resolved: allTickets.filter((ticket) => ticket.status === 'resolved').length,
      },
    });
  });

  app.get('/api/tickets/:id', async (request, response) => {
    const ticket = await store.get(request.params.id);
    if (!ticket) return response.status(404).json({ error: '找不到這張工單。' });
    return response.json({ ticket });
  });

  app.post('/api/tickets', async (request, response) => {
    const validationError = validateNewTicket(request.body || {});
    if (validationError) return response.status(400).json({ error: validationError });
    const ticketInput = {
      customerName: request.body.customerName.trim(),
      customerEmail: request.body.customerEmail.trim(),
      subject: request.body.subject.trim(),
      message: request.body.message.trim(),
    };
    let classification;
    let configuration;
    try {
      configuration = getConfiguration();
      classification = await classifier(ticketInput, configuration);
    } catch (error) {
      console.error('Ticket AI classification failed:', error.message);
      return response.status(502).json({
        error: 'AI 分類服務目前無法使用，工單尚未建立。請稍後再試。',
      });
    }
    const ticket = await store.create({
      ...ticketInput,
      ...classification,
      source: configuration.mode,
    });
    return response.status(201).json({ ticket });
  });

  app.patch('/api/tickets/:id/status', async (request, response) => {
    const { status } = request.body || {};
    if (!STATUSES.includes(status)) {
      return response.status(400).json({ error: '狀態需為待處理、處理中或已解決。' });
    }
    const ticket = await store.updateStatus(request.params.id, status);
    if (!ticket) return response.status(404).json({ error: '找不到這張工單。' });
    return response.json({ ticket });
  });

  app.post('/api/tickets/:id/replies', async (request, response) => {
    const body = typeof request.body?.body === 'string' ? request.body.body.trim() : '';
    if (!body || body.length > 2000) {
      return response.status(400).json({ error: '回覆內容不可為空，且不可超過 2000 個字元。' });
    }
    const ticket = await store.addReply(request.params.id, body);
    if (!ticket) return response.status(404).json({ error: '找不到這張工單。' });
    return response.status(201).json({ ticket });
  });

  app.use((error, request, response, next) => {
    if (response.headersSent) return next(error);
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
      return response.status(400).json({ error: '請求內容不是有效的 JSON。' });
    }
    console.error('Request failed:', error);
    return response.status(500).json({ error: '伺服器發生錯誤，請稍後再試。' });
  });
  return app;
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3008;
  createApp().listen(port, '127.0.0.1', () => {
    console.log(`Week 8 support desk is running at http://127.0.0.1:${port}`);
  });
}

module.exports = { createApp, validateNewTicket };
