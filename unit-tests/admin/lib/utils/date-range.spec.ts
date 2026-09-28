import { CalendarDate } from '@internationalized/date';
import { format } from 'date-fns';
import {
  calendarDateToDate,
  dateRangeToRangeValue,
  formatDateRangeParam,
  isDatePreset,
  parseRangeParam,
  presetToDateRange,
  rangeValueToDateRange,
} from '../../../../src/admin/lib/utils/date-range';

// Assert on calendar days, not instants, so results don't depend on the timezone
const ymd = (date?: Date) => (date ? format(date, 'yyyy-MM-dd') : date);
const days = (range?: { from?: Date; to?: Date }) =>
  range && { from: ymd(range.from), to: ymd(range.to) };

describe('isDatePreset', () => {
  it.each(['this-month', 'last-month', 'last-3-months'])('accepts %s', (v) => {
    expect(isDatePreset(v)).toBe(true);
  });

  it.each(['all-time', 'custom', '', 'THIS-MONTH'])('rejects "%s"', (v) => {
    expect(isDatePreset(v)).toBe(false);
  });
});

describe('presetToDateRange', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  const at = (y: number, m: number, d: number) => {
    jest.useFakeTimers({ now: new Date(y, m - 1, d, 12) });
  };

  it('mid-year', () => {
    at(2024, 6, 15);
    expect(days(presetToDateRange('this-month'))).toEqual({
      from: '2024-06-01',
      to: '2024-06-15',
    });
    expect(days(presetToDateRange('last-month'))).toEqual({
      from: '2024-05-01',
      to: '2024-05-31',
    });
    expect(days(presetToDateRange('last-3-months'))).toEqual({
      from: '2024-03-01',
      to: '2024-05-31',
    });
  });

  it('crosses the year boundary', () => {
    at(2024, 1, 10);
    expect(days(presetToDateRange('last-month'))).toEqual({
      from: '2023-12-01',
      to: '2023-12-31',
    });
    expect(days(presetToDateRange('last-3-months'))).toEqual({
      from: '2023-10-01',
      to: '2023-12-31',
    });
  });

  it('ends February on the leap day', () => {
    at(2024, 3, 5);
    expect(days(presetToDateRange('last-month'))).toEqual({
      from: '2024-02-01',
      to: '2024-02-29',
    });
  });

  it('this-month on the 1st is a single day', () => {
    at(2024, 6, 1);
    expect(days(presetToDateRange('this-month'))).toEqual({
      from: '2024-06-01',
      to: '2024-06-01',
    });
  });
});

describe('formatDateRangeParam', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('formats from and to', () => {
    expect(
      formatDateRangeParam({
        from: new Date(2024, 5, 1),
        to: new Date(2024, 5, 30),
      }),
    ).toBe('2024-06-01-2024-06-30');
  });

  it('uses from as to when to is missing', () => {
    expect(formatDateRangeParam({ from: new Date(2024, 5, 1) })).toBe(
      '2024-06-01-2024-06-01',
    );
  });

  it('falls back to today when from is missing', () => {
    jest.useFakeTimers({ now: new Date(2024, 5, 15, 12) });
    expect(formatDateRangeParam({ from: undefined })).toBe(
      '2024-06-15-2024-06-15',
    );
    expect(
      formatDateRangeParam({ from: undefined, to: new Date(2024, 5, 20) }),
    ).toBe('2024-06-15-2024-06-20');
  });
});

describe('parseRangeParam', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves presets relative to today', () => {
    jest.useFakeTimers({ now: new Date(2024, 5, 15, 12) });
    expect(days(parseRangeParam('last-month'))).toEqual({
      from: '2024-05-01',
      to: '2024-05-31',
    });
  });

  it('parses a custom range to local midnight', () => {
    const range = parseRangeParam('2024-06-01-2024-06-30');
    expect(days(range)).toEqual({ from: '2024-06-01', to: '2024-06-30' });
    expect(range?.from?.getHours()).toBe(0);
  });

  it('round-trips with formatDateRangeParam', () => {
    const param = '2023-12-31-2024-01-01';
    expect(formatDateRangeParam(parseRangeParam(param)!)).toBe(param);
  });

  it('keeps a reversed range as given', () => {
    expect(days(parseRangeParam('2024-06-30-2024-06-01'))).toEqual({
      from: '2024-06-30',
      to: '2024-06-01',
    });
  });

  it('returns Invalid Dates for well-shaped but impossible dates', () => {
    const range = parseRangeParam('2024-13-45-2024-06-01');
    expect(Number.isNaN(range?.from?.getTime())).toBe(true);
    expect(ymd(range?.to)).toBe('2024-06-01');
  });

  it.each([
    '',
    'all-time',
    '2024-06-01',
    '2024-6-1-2024-6-30',
    '2024-06-01_2024-06-30',
    ' 2024-06-01-2024-06-30',
    '2024-06-01-2024-06-30-extra',
  ])('returns undefined for "%s"', (param) => {
    expect(parseRangeParam(param)).toBeUndefined();
  });
});

describe('calendarDateToDate', () => {
  it('maps to local midnight of the same day', () => {
    const date = calendarDateToDate(new CalendarDate(2024, 2, 29));
    expect(ymd(date)).toBe('2024-02-29');
    expect(date.getHours()).toBe(0);
  });
});

describe('dateRangeToRangeValue', () => {
  it('returns null without a from date', () => {
    expect(dateRangeToRangeValue(undefined)).toBeNull();
    expect(dateRangeToRangeValue({ from: undefined })).toBeNull();
  });

  it('converts both ends', () => {
    const value = dateRangeToRangeValue({
      from: new Date(2024, 5, 1),
      to: new Date(2024, 5, 30),
    });
    expect(value?.start.toString()).toBe('2024-06-01');
    expect(value?.end.toString()).toBe('2024-06-30');
  });

  it('uses from as end when to is missing', () => {
    const value = dateRangeToRangeValue({ from: new Date(2024, 5, 1) });
    expect(value?.end.toString()).toBe('2024-06-01');
  });
});

describe('rangeValueToDateRange', () => {
  it('returns undefined for null', () => {
    expect(rangeValueToDateRange(null)).toBeUndefined();
  });

  it('round-trips with dateRangeToRangeValue', () => {
    const range = { from: new Date(2024, 0, 31), to: new Date(2024, 1, 29) };
    expect(days(rangeValueToDateRange(dateRangeToRangeValue(range)))).toEqual(
      days(range),
    );
  });
});
