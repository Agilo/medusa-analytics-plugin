import {
  addDays,
  isAfter,
  parseISO,
  format,
  startOfMonth,
  eachDayOfInterval,
  eachMonthOfInterval,
} from 'date-fns';

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
