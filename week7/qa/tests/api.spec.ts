import { test, expect } from '@playwright/test';

test('API @api adds positive integers', async ({ request }) => {
  const response = await request.post('/api/add', {
    data: { a: 10, b: 25 },
  });

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');
  expect(await response.json()).toEqual({ result: 35 });
});

test('API @api adds negative integers', async ({ request }) => {
  const response = await request.post('/api/add', {
    data: { a: -8, b: -3 },
  });

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ result: -11 });
});

test('API @api adds zero', async ({ request }) => {
  const response = await request.post('/api/add', {
    data: { a: 0, b: 0 },
  });

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ result: 0 });
});

test('API @api adds decimal numbers', async ({ request }) => {
  const response = await request.post('/api/add', {
    data: { a: 0.1, b: 0.2 },
  });

  expect(response.status()).toBe(200);
  expect((await response.json()).result).toBeCloseTo(0.3, 10);
});

test('API @api supports values larger than 32-bit integers', async ({ request }) => {
  const response = await request.post('/api/add', {
    data: { a: 2147483648, b: 1 },
  });

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ result: 2147483649 });
});

test('API @api rejects results beyond the floating-point range', async ({ request }) => {
  const response = await request.post('/api/add', {
    data: { a: 1.7976931348623157e308, b: 1.7976931348623157e308 },
  });

  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: 'number overflow' });
});

test('API @api rejects a missing operand', async ({ request }) => {
  const response = await request.post('/api/add', {
    data: { a: 1 },
  });

  expect(response.status()).toBe(422);
});

test('API @api accepts fractional operands', async ({ request }) => {
  const response = await request.post('/api/add', {
    data: { a: 1.5, b: 2 },
  });

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ result: 3.5 });
});

test('API @api rejects malformed JSON', async ({ request }) => {
  const response = await request.post('/api/add', {
    data: '{"a":',
    headers: { 'content-type': 'application/json' },
  });

  expect(response.status()).toBe(422);
});

test('API @api subtracts integers', async ({ request }) => {
  const response = await request.post('/api/calculate', {
    data: { a: 12, b: 5, operation: 'subtract' },
  });

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ result: 7 });
});

test('API @api multiplies integers', async ({ request }) => {
  const response = await request.post('/api/calculate', {
    data: { a: -4, b: 3, operation: 'multiply' },
  });

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ result: -12 });
});

test('API @api returns fractional division results', async ({ request }) => {
  const response = await request.post('/api/calculate', {
    data: { a: 7, b: 2, operation: 'divide' },
  });

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ result: 3.5 });
});

test('API @api multiplies very large numbers', async ({ request }) => {
  const response = await request.post('/api/calculate', {
    data: { a: 1e200, b: 1e100, operation: 'multiply' },
  });

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ result: 1e300 });
});

test('API @api rejects division by zero', async ({ request }) => {
  const response = await request.post('/api/calculate', {
    data: { a: 10, b: 0, operation: 'divide' },
  });

  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: 'division by zero' });
});

test('API @api rejects overflow in multiplication', async ({ request }) => {
  const response = await request.post('/api/calculate', {
    data: { a: 1e308, b: 10, operation: 'multiply' },
  });

  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: 'number overflow' });
});

test('API @api rejects an unknown operation', async ({ request }) => {
  const response = await request.post('/api/calculate', {
    data: { a: 10, b: 2, operation: 'power' },
  });

  expect(response.status()).toBe(422);
});
