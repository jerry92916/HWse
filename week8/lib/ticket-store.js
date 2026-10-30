const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

class TicketStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.tickets = null;
    this.queue = Promise.resolve();
  }

  async load() {
    if (this.tickets) return;
    try {
      const contents = await fs.readFile(this.filePath, 'utf8');
      const tickets = JSON.parse(contents);
      if (!Array.isArray(tickets)) throw new Error('Ticket data must be a JSON array.');
      this.tickets = tickets;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      this.tickets = [];
    }
  }

  async runExclusive(operation) {
    const result = this.queue.then(async () => {
      await this.load();
      return operation();
    });
    this.queue = result.catch(() => {});
    return result;
  }

  async persist(tickets = this.tickets) {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    await fs.writeFile(temporaryPath, `${JSON.stringify(tickets, null, 2)}\n`, 'utf8');
    await fs.rename(temporaryPath, this.filePath);
  }

  async list(filters = {}) {
    return this.runExclusive(() => {
      const search = (filters.search || '').toLocaleLowerCase();
      return this.tickets
        .filter((ticket) => !filters.status || ticket.status === filters.status)
        .filter((ticket) => !filters.category || ticket.category === filters.category)
        .filter((ticket) => !filters.severity || ticket.severity === filters.severity)
        .filter((ticket) => !search || [
          ticket.subject,
          ticket.customerName,
          ticket.customerEmail,
          ticket.message,
        ].some((value) => value.toLocaleLowerCase().includes(search)))
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    });
  }

  async get(id) {
    return this.runExclusive(() => this.tickets.find((ticket) => ticket.id === id) || null);
  }

  async create(ticketData) {
    return this.runExclusive(async () => {
      const now = new Date().toISOString();
      const ticket = {
        id: randomUUID(),
        ...ticketData,
        status: 'open',
        messages: [{
          id: randomUUID(),
          sender: 'customer',
          body: ticketData.message,
          createdAt: now,
        }],
        createdAt: now,
        updatedAt: now,
      };
      const updatedTickets = [...this.tickets, ticket];
      await this.persist(updatedTickets);
      this.tickets = updatedTickets;
      return ticket;
    });
  }

  async updateStatus(id, status) {
    return this.runExclusive(async () => {
      const ticket = this.tickets.find((item) => item.id === id);
      if (!ticket) return null;
      const updatedTicket = { ...ticket, status, updatedAt: new Date().toISOString() };
      const updatedTickets = this.tickets.map((item) => item.id === id ? updatedTicket : item);
      await this.persist(updatedTickets);
      this.tickets = updatedTickets;
      return updatedTicket;
    });
  }

  async addReply(id, body) {
    return this.runExclusive(async () => {
      const ticket = this.tickets.find((item) => item.id === id);
      if (!ticket) return null;
      const now = new Date().toISOString();
      const updatedTicket = {
        ...ticket,
        messages: [...ticket.messages, {
          id: randomUUID(),
          sender: 'agent',
          body,
          createdAt: now,
        }],
        updatedAt: now,
        status: ticket.status === 'open' ? 'in_progress' : ticket.status,
      };
      const updatedTickets = this.tickets.map((item) => item.id === id ? updatedTicket : item);
      await this.persist(updatedTickets);
      this.tickets = updatedTickets;
      return updatedTicket;
    });
  }
}

module.exports = { TicketStore };
