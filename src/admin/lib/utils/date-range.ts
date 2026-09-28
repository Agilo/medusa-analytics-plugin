import { DateRange } from 'react-day-picker';
import { CalendarDate } from '@internationalized/date';
import { subMonths, startOfMonth, endOfMonth, format, parse } from 'date-fns';
import { DateValue, RangeValue } from 'react-aria-components';

const DATE_PRESETS = ['this-month', 'last-month', 'last-3-months'] as const;
type DatePreset = (typeof DATE_PRESETS)[number];
const DATE_RANGE_REGEX = /^(\d{4}-\d{2}-\d{2})-(\d{4}-\d{2}-\d{2})$/;

export const isDatePreset = (value: string): value is DatePreset =>
  (DATE_PRESETS as readonly string[]).includes(value);

export const formatDateRangeParam = (range: DateRange): string =>
  `${format(range.from ?? new Date(), 'yyyy-MM-dd')}-${format(
    range.to ?? range.from ?? new Date(),
    'yyyy-MM-dd',
  )}`;

export function presetToDateRange(preset: DatePreset): DateRange {
  const today = new Date();
  if (preset === 'this-month') return { from: startOfMonth(today), to: today };
  if (preset === 'last-month')
    return {
      from: startOfMonth(subMonths(today, 1)),
      to: endOfMonth(subMonths(today, 1)),
    };

  return {
    from: startOfMonth(subMonths(today, 3)),
    to: endOfMonth(subMonths(today, 1)),
  };
}

export function parseRangeParam(rangeParam: string): DateRange | undefined {
  if (isDatePreset(rangeParam)) {
    return presetToDateRange(rangeParam);
  }

  const dates = rangeParam.match(DATE_RANGE_REGEX);
  if (dates) {
    return {
      from: parse(dates[1], 'yyyy-MM-dd', new Date()),
      to: parse(dates[2], 'yyyy-MM-dd', new Date()),
    };
  }

  return undefined;
}

function dateToCalendarDate(date: Date): CalendarDate {
  return new CalendarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
}

export function calendarDateToDate(calendarDate: DateValue): Date {
  const year =
    'year' in calendarDate ? calendarDate.year : new Date().getFullYear();
  const month =
    'month' in calendarDate ? calendarDate.month : new Date().getMonth() + 1;
  const day = 'day' in calendarDate ? calendarDate.day : new Date().getDate();
  return new Date(year, month - 1, day);
}

export function dateRangeToRangeValue(
  dateRange: DateRange | undefined,
): RangeValue<DateValue> | null {
  if (!dateRange?.from) return null;
  return {
    start: dateToCalendarDate(dateRange.from),
    end: dateRange.to
      ? dateToCalendarDate(dateRange.to)
      : dateToCalendarDate(dateRange.from),
  };
}

export function rangeValueToDateRange(
  rangeValue: RangeValue<DateValue> | null,
): DateRange | undefined {
  if (!rangeValue) return undefined;
  return {
    from: calendarDateToDate(rangeValue.start),
    to: rangeValue.end ? calendarDateToDate(rangeValue.end) : undefined,
  };
}
