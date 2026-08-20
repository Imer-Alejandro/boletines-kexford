const { DateTime } = require('luxon');

function parseTimeToSeconds(time) {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 3600 + minute * 60;
}

function createUtcDateTime(date, seconds) {
  const [year, month, day] = date.split('-').map(Number);
  const hour = Math.floor(seconds / 3600);
  const minute = Math.floor((seconds % 3600) / 60);
  const second = seconds % 60;
  return DateTime.utc(year, month, day, hour, minute, second);
}

function getDateRange(startDate, endDate) {
  const start = DateTime.fromISO(startDate, { zone: 'utc' });
  const end = DateTime.fromISO(endDate, { zone: 'utc' });
  if (!start.isValid || !end.isValid) {
    throw new Error('Invalid date range');
  }
  if (end < start) {
    throw new Error('end_date must be equal or later than start_date');
  }
  const dates = [];
  let cursor = start;
  while (cursor <= end) {
    dates.push(cursor.toISODate());
    cursor = cursor.plus({ days: 1 });
  }
  return dates;
}

function buildWindows(startTime, endTime) {
  const beginSeconds = parseTimeToSeconds(startTime);
  const finishSeconds = parseTimeToSeconds(endTime);
  if (finishSeconds <= beginSeconds) {
    throw new Error('end_time must be later than start_time');
  }

  const windows = [];
  let windowStart = beginSeconds;
  while (windowStart < finishSeconds) {
    const windowEnd = Math.min(windowStart + 3600, finishSeconds);
    windows.push({ start: windowStart, end: windowEnd });
    windowStart += 3600;
  }
  return windows;
}

function generateTimesInWindow(date, window, count, minInterval, maxInterval) {
  if (count === 0) return [];
  const availableSeconds = window.end - window.start;
  if (count * minInterval > availableSeconds) {
    throw new Error('Cannot schedule recipients within the provided time window and interval constraints');
  }

  const times = [];
  let current = window.start;
  for (let index = 0; index < count; index += 1) {
    const remaining = count - index;
    const earliest = current + minInterval;
    const latest = window.end - minInterval * (remaining - 1) - 1;
    if (earliest > latest) {
      current = Math.min(window.end - 1, earliest);
      times.push(createUtcDateTime(date, current).toISO());
      continue;
    }

    const ceiling = Math.min(latest, current + maxInterval);
    const nextSeconds = Math.floor(Math.random() * (ceiling - earliest + 1)) + earliest;
    current = nextSeconds;
    times.push(createUtcDateTime(date, current).toISO());
  }

  return times;
}

function distributeAcrossWindows(count, windows, hourlyLimit) {
  const assignments = new Array(windows.length).fill(0);
  const totalWindows = windows.length;
  const base = Math.floor(count / totalWindows);
  const remainder = count % totalWindows;

  for (let i = 0; i < totalWindows; i += 1) {
    assignments[i] = Math.min(base + (i < remainder ? 1 : 0), hourlyLimit);
  }

  const assigned = assignments.reduce((sum, n) => sum + n, 0);
  if (assigned < count) {
    throw new Error('Not enough capacity to schedule recipients with the configured hourly limit');
  }

  return assignments;
}

function generateScheduledAtTimes({ start_date, end_date, start_time, end_time, daily_limit, hourly_limit, min_interval_seconds, max_interval_seconds }, totalRecipients) {
  const dates = getDateRange(start_date, end_date);
  const windows = buildWindows(start_time, end_time);

  const maxDailyCapacity = windows.length * hourly_limit;
  if (daily_limit > maxDailyCapacity) {
    throw new Error('daily_limit cannot exceed the total hourly capacity of the day');
  }

  const totalCapacity = dates.length * maxDailyCapacity;
  if (totalRecipients > totalCapacity) {
    throw new Error('Total recipients exceed campaign capacity for the configured date and hour range');
  }

  const scheduled = [];
  let remainingRecipients = totalRecipients;

  for (const date of dates) {
    if (remainingRecipients === 0) break;
    const dayCount = Math.min(remainingRecipients, daily_limit);
    const windowAssignments = distributeAcrossWindows(dayCount, windows, hourly_limit);

    for (let i = 0; i < windows.length; i += 1) {
      const count = windowAssignments[i];
      const window = windows[i];
      const times = generateTimesInWindow(date, window, count, min_interval_seconds, max_interval_seconds);
      scheduled.push(...times);
    }

    remainingRecipients -= dayCount;
  }

  if (scheduled.length !== totalRecipients) {
    throw new Error('Unable to generate schedule for all recipients');
  }

  return scheduled.sort();
}

module.exports = { generateScheduledAtTimes };
