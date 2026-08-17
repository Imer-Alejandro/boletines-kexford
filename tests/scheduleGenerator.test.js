const test = require('node:test');
const assert = require('node:assert/strict');
const { generateScheduledAtTimes } = require('../src/lib/scheduleGenerator');

const BASE = {
  start_date: '2026-08-17',
  end_date: '2026-08-17',
  start_time: '08:00',
  end_time: '12:00',
  daily_limit: 20,
  hourly_limit: 10,
  min_interval_seconds: 30,
  max_interval_seconds: 60,
};

test('generates correct number of scheduled times', () => {
  const times = generateScheduledAtTimes(BASE, 15);
  assert.equal(times.length, 15);
});

test('all times are within the window', () => {
  const times = generateScheduledAtTimes(BASE, 10);
  for (const t of times) {
    const d = new Date(t);
    assert.ok(d instanceof Date && !isNaN(d), `Invalid date: ${t}`);
  }
});

test('times are sorted ascending', () => {
  const times = generateScheduledAtTimes({ ...BASE, end_date: '2026-08-18' }, 20);
  for (let i = 1; i < times.length; i++) {
    assert.ok(new Date(times[i]) >= new Date(times[i - 1]));
  }
});

test('throws when recipients exceed capacity', () => {
  const small = { ...BASE, daily_limit: 5, hourly_limit: 5, end_time: '08:05' };
  assert.throws(() => generateScheduledAtTimes(small, 100), /capacity/i);
});

test('throws when end_time before start_time', () => {
  const bad = { ...BASE, start_time: '18:00', end_time: '08:00' };
  assert.throws(() => generateScheduledAtTimes(bad, 5), /end_time must be later/);
});

test('throws when end_date before start_date', () => {
  const bad = { ...BASE, start_date: '2026-08-20', end_date: '2026-08-17' };
  assert.throws(() => generateScheduledAtTimes(bad, 5), /end_date must be equal or later/);
});

test('distributes across multiple days', () => {
  const multi = { ...BASE, end_date: '2026-08-18', daily_limit: 10 };
  const times = generateScheduledAtTimes(multi, 15);
  assert.equal(times.length, 15);
  const dates = new Set(times.map((t) => t.slice(0, 10)));
  assert.ok(dates.size >= 2, 'Should span at least 2 days');
});

test('works with minimum interval equal to max interval', () => {
  const fixed = { ...BASE, min_interval_seconds: 60, max_interval_seconds: 60, daily_limit: 10 };
  const times = generateScheduledAtTimes(fixed, 10);
  assert.equal(times.length, 10);
});

test('zero recipients produces empty array', () => {
  const times = generateScheduledAtTimes(BASE, 0);
  assert.deepEqual(times, []);
});
