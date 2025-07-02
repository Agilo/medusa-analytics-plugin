import {
  addDays,
  isAfter,
  parseISO,
  format,
  startOfMonth,
  eachDayOfInterval,
  eachMonthOfInterval,
  differenceInCalendarDays,
  endOfMonth,
  subMonths,
} from 'date-fns';

type DateRange = { start: Date; end: Date };

/**
 * `calculateDateRangeMethod` provides functions to calculate date ranges
 * for different presets (e.g., this month, last month, custom).
 *
 * Each function returns:
 * - `current`: the current date range (start and end)
 * - `previous`: the previous date range for comparison
 * - `days`: number of days in the current range
 */
export const calculateDateRangeMethod: Record<
  'custom' | 'this-month' | 'last-month' | 'last-3-months',
  (query: { date_from?: string; date_to?: string; preset: string }) => {
    current: DateRange;
    previous: DateRange;
    days: number;
  }
> = {
  custom: (query) => {
    if (!query.date_from || !query.date_to) {
      throw new Error('No date range provided');
    }
    const start = parseISO(query.date_from);
    const end = parseISO(query.date_to);

    const days = differenceInCalendarDays(end, start) + 1;
    const prevEnd = new Date(start);
    prevEnd.setDate(start.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevEnd.getDate() - (days - 1));

    return {
      current: { start, end },
      previous: { start: prevStart, end: prevEnd },
      days,
    };
  },

  'this-month': () => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const prevStart = startOfMonth(subMonths(now, 1));
    const prevEnd = endOfMonth(subMonths(now, 1));

    const days = differenceInCalendarDays(end, start) + 1;

    return {
      current: { start, end },
      previous: { start: prevStart, end: prevEnd },
      days,
    };
  },

  'last-month': () => {
    const last = subMonths(new Date(), 1);
    const start = startOfMonth(last);
    const end = endOfMonth(last);

    const prevStart = startOfMonth(subMonths(last, 1));
    const prevEnd = endOfMonth(subMonths(last, 1));

    const days = differenceInCalendarDays(end, start) + 1;

    return {
      current: { start, end },
      previous: { start: prevStart, end: prevEnd },
      days,
    };
  },

  'last-3-months': () => {
    const now = new Date();
    const start = startOfMonth(subMonths(now, 3));
    const end = endOfMonth(subMonths(now, 1));

    const prevStart = startOfMonth(subMonths(now, 6));
    const prevEnd = endOfMonth(subMonths(now, 4));

    const days = differenceInCalendarDays(end, start) + 1;

    return {
      current: { start, end },
      previous: { start: prevStart, end: prevEnd },
      days,
    };
  },
};

export function generateWeekKey(
  date: Date,
  dateFrom: string,
  dateTo: string
): string {
  const start = parseISO(dateFrom);
  const end = parseISO(dateTo);

  let current = start;

  while (current <= end) {
    const weekStart = current;
    const weekEnd = isAfter(addDays(current, 6), end)
      ? end
      : addDays(current, 6);

    if (date >= weekStart && date <= weekEnd) {
      return `${format(weekStart, 'dd.MM')}-${format(weekEnd, 'dd.MM')}`;
    }

    current = addDays(weekEnd, 1);
  }

  return format(date, 'yyyy-MM-dd');
}

export function generateWeekRanges(start: Date, end: Date): string[] {
  const weeks: string[] = [];
  let current = start;

  while (current <= end) {
    const weekStart = current;
    const weekEnd = isAfter(addDays(current, 6), end)
      ? end
      : addDays(current, 6);
    weeks.push(`${format(weekStart, 'dd.MM')}-${format(weekEnd, 'dd.MM')}`);
    current = addDays(weekEnd, 1);
  }

  return weeks;
}

export function getGroupKey(
  date: Date,
  groupBy: 'day' | 'week' | 'month',
  dateFrom?: string,
  dateTo?: string
) {
  if (groupBy === 'month') {
    return format(startOfMonth(date), 'yyyy-MM');
  }
  if (groupBy === 'week' && dateFrom && dateTo) {
    return generateWeekKey(date, dateFrom, dateTo);
  }
  return format(date, 'yyyy-MM-dd');
}

export function generateKeyRange(
  groupBy: 'day' | 'week' | 'month',
  dateFrom: string,
  dateTo: string
): string[] {
  const start = parseISO(dateFrom);
  const end = parseISO(dateTo);

  if (groupBy === 'day') {
    return eachDayOfInterval({ start, end }).map((d) =>
      format(d, 'yyyy-MM-dd')
    );
  }

  if (groupBy === 'month') {
    return eachMonthOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM'));
  }

  return generateWeekRanges(start, end);
}
