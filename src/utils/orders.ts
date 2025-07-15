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
  startOfDay,
  endOfDay,
} from 'date-fns';

type DateRange = { start: Date; end: Date };

/**
 * Preset functions to calculate current and previous date ranges.
 * @param query Query object containing optional date_from, date_to, and preset name.
 * @returns Object with current date range, previous date range, and number of days in current range.
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
      current: {
        start: new Date(query.date_from),
        end: new Date(query.date_to),
      },
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

/**
 * Returns a formatted key representing the week range in which a given date falls,
 * based on a provided overall date range.
 *
 * @param date The date to check.
 * @param dateFrom The start date of the overall range (in ISO string format).
 * @param dateTo The end date of the overall range (in ISO string format).
 * @returns A string key in the format 'dd.MM-dd.MM' or fallback 'yyyy-MM-dd' if no range is found.
 */
export function getWeekRangeKeyForDate(
  date: Date,
  dateFrom: string,
  dateTo: string
): string {
  const start = startOfDay(parseISO(dateFrom));
  const end = endOfDay(parseISO(dateTo));
  const targetDate = startOfDay(date);

  let current = start;

  while (current <= end) {
    const weekStart = current;
    const weekEnd = isAfter(addDays(current, 6), end)
      ? end
      : addDays(current, 6);

    if (targetDate >= weekStart && targetDate <= weekEnd) {
      return `${format(weekStart, 'dd.MM')}-${format(weekEnd, 'dd.MM')}`;
    }

    current = addDays(weekEnd, 1);
  }

  return format(targetDate, 'yyyy-MM-dd');
}

/**
 * Generates a list of week range keys (formatted as 'dd.MM-dd.MM') between the given start and end dates.
 *
 * @param start The start date of the overall range.
 * @param end The end date of the overall range.
 * @returns An array of strings representing week ranges.
 */
export function getAllWeekRangeKeys(start: Date, end: Date): string[] {
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

/**
 * Generates a grouping key for a given date depending on the selected grouping mode (day, week, or month).
 *
 * @param date The date for which to generate the key.
 * @param groupBy Grouping mode: 'day', 'week', or 'month'.
 * @param dateFrom Optional start date of the range (required for 'week' grouping).
 * @param dateTo Optional end date of the range (required for 'week' grouping).
 * @returns A string key used for grouping data.
 */
export function getDateGroupingKey(
  date: Date,
  groupBy: 'day' | 'week' | 'month',
  dateFrom?: string,
  dateTo?: string
) {
  if (groupBy === 'month') {
    return format(
      startOfMonth(
        new Date(
          Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
        )
      ),
      'yyyy-MM'
    );
  }
  if (groupBy === 'week' && dateFrom && dateTo) {
    return getWeekRangeKeyForDate(
      new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
      ),
      dateFrom,
      dateTo
    );
  }
  return format(
    new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    ),
    'yyyy-MM-dd'
  );
}

/**
 * Generates a list of grouping keys for all periods between two dates, depending on the selected grouping mode.
 *
 * @param groupBy Grouping mode: 'day', 'week', or 'month'.
 * @param dateFrom Start date of the range (in ISO string format).
 * @param dateTo End date of the range (in ISO string format).
 * @returns An array of strings representing keys for each grouped period.
 */
export function getAllDateGroupingKeys(
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

  return getAllWeekRangeKeys(start, end);
}
