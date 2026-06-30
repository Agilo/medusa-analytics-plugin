import {
  calculateDateRangeMethod,
  getAllDateGroupingKeys,
  getAllWeekRangeKeys,
  getDateGroupingKey,
  getWeekRangeKeyForDate,
} from '../../src/utils/orders';
import { format, parseISO } from 'date-fns';

describe('date utils', () => {
  describe('getWeekRangeKeyForDate', () => {
    it('returns correct week key for mid-week date', () => {
      const key = getWeekRangeKeyForDate(
        new Date('2024-06-05'),
        '2024-06-01',
        '2024-06-30',
      );
      expect(key).toBe('1.-7.6');
    });
    it('returns correct week key for start-week date', () => {
      const key = getWeekRangeKeyForDate(
        new Date('2024-06-01'),
        '2024-06-01',
        '2024-06-30',
      );
      expect(key).toBe('1.-7.6');
    });
    it('returns correct week key for end-week date', () => {
      const key = getWeekRangeKeyForDate(
        new Date('2024-06-07'),
        '2024-06-01',
        '2024-06-30',
      );
      expect(key).toBe('1.-7.6');
    });

    it('falls back if outside range', () => {
      const key = getWeekRangeKeyForDate(
        new Date('2020-01-01'),
        '2024-06-01',
        '2024-06-30',
      );
      expect(key).toBe('2020-01-01');
    });
    it('returns correct key when week spans across two months', () => {
      const key = getWeekRangeKeyForDate(
        new Date('2024-04-30'),
        '2024-04-29',
        '2024-05-30',
      );
      expect(key).toBe('29.4-5.5');
    });
  });

  describe('getDateGroupingKey', () => {
    describe('for mid-month day', () => {
      const date = new Date('2024-06-15');

      it('returns correct day key', () => {
        expect(getDateGroupingKey(date, 'day')).toBe('2024-06-15');
      });

      it('returns correct month key', () => {
        expect(getDateGroupingKey(date, 'month')).toBe('2024-06');
      });

      it('returns correct week key', () => {
        const key = getDateGroupingKey(
          date,
          'week',
          '2024-06-01',
          '2024-06-30',
        );
        expect(key).toBe('15.-21.6');
      });
    });
    describe('for start-month day', () => {
      const date = new Date('2024-06-01');

      it('returns correct day key', () => {
        expect(getDateGroupingKey(date, 'day')).toBe('2024-06-01');
      });

      it('returns correct month key', () => {
        expect(getDateGroupingKey(date, 'month')).toBe('2024-06');
      });

      it('returns correct week key', () => {
        const key = getDateGroupingKey(
          date,
          'week',
          '2024-06-01',
          '2024-06-30',
        );
        expect(key).toMatch('1.-7.6');
      });
    });
    describe('for end-month day', () => {
      const date = new Date('2024-06-30');

      it('returns correct day key', () => {
        expect(getDateGroupingKey(date, 'day')).toBe('2024-06-30');
      });

      it('returns correct month key', () => {
        expect(getDateGroupingKey(date, 'month')).toBe('2024-06');
      });

      it('returns correct week key', () => {
        const key = getDateGroupingKey(
          date,
          'week',
          '2024-06-01',
          '2024-06-30',
        );
        expect(key).toMatch('29.-30.6');
      });
    });

    it('falls back to a plain day key for week grouping without a range', () => {
      expect(getDateGroupingKey(new Date('2024-06-15'), 'week')).toBe(
        '2024-06-15',
      );
    });
  });

  describe('getAllDateGroupingKeys', () => {
    it('returns daily keys for range', () => {
      const result = getAllDateGroupingKeys('day', '2024-06-01', '2024-06-03');
      expect(result).toEqual(['2024-06-01', '2024-06-02', '2024-06-03']);
    });

    it('returns monthly keys for range', () => {
      const result = getAllDateGroupingKeys(
        'month',
        '2024-04-01',
        '2024-06-01',
      );
      expect(result).toEqual(['2024-04', '2024-05', '2024-06']);
    });

    it('returns week keys for range', () => {
      const result = getAllDateGroupingKeys('week', '2024-06-01', '2024-06-15');
      expect(result).toEqual(['1.-7.6', '8.-14.6', '15.6']);
    });
  });

  describe('getAllWeekRangeKeys', () => {
    it('splits a same-month range into 7-day chunks', () => {
      const keys = getAllWeekRangeKeys(
        parseISO('2024-06-01'),
        parseISO('2024-06-15'),
      );
      expect(keys).toEqual(['1.-7.6', '8.-14.6', '15.6']);
    });

    it('keeps the month on both sides for a week spanning two months', () => {
      const keys = getAllWeekRangeKeys(
        parseISO('2024-04-29'),
        parseISO('2024-05-12'),
      );
      expect(keys).toEqual(['29.4-5.5', '6.-12.5']);
    });

    it('returns a single-day key when the range is one day', () => {
      const keys = getAllWeekRangeKeys(
        parseISO('2024-06-10'),
        parseISO('2024-06-10'),
      );
      expect(keys).toEqual(['10.6']);
    });
  });

  describe('calculateDateRangeMethod', () => {
    const fmt = (date: Date) => format(date, 'yyyy-MM-dd');

    describe('presets (fixed "now" = 2024-06-15)', () => {
      beforeAll(() => {
        jest.useFakeTimers().setSystemTime(new Date('2024-06-15T12:00:00Z'));
      });
      afterAll(() => {
        jest.useRealTimers();
      });

      it('this-month spans the current month, previous spans the month before', () => {
        const { current, previous, days } = calculateDateRangeMethod[
          'this-month'
        ]({ preset: 'this-month' });

        expect(fmt(current.start)).toBe('2024-06-01');
        expect(fmt(current.end)).toBe('2024-06-30');
        expect(fmt(previous.start)).toBe('2024-05-01');
        expect(fmt(previous.end)).toBe('2024-05-31');
        expect(days).toBe(30);
      });

      it('last-month spans the previous month, previous spans the month before that', () => {
        const { current, previous, days } = calculateDateRangeMethod[
          'last-month'
        ]({ preset: 'last-month' });

        expect(fmt(current.start)).toBe('2024-05-01');
        expect(fmt(current.end)).toBe('2024-05-31');
        expect(fmt(previous.start)).toBe('2024-04-01');
        expect(fmt(previous.end)).toBe('2024-04-30');
        expect(days).toBe(31);
      });

      it('last-3-months spans the previous three full months', () => {
        const { current, previous, days } = calculateDateRangeMethod[
          'last-3-months'
        ]({ preset: 'last-3-months' });

        expect(fmt(current.start)).toBe('2024-03-01');
        expect(fmt(current.end)).toBe('2024-05-31');
        expect(fmt(previous.start)).toBe('2023-12-01');
        expect(fmt(previous.end)).toBe('2024-02-29');
        expect(days).toBe(92);
      });
    });

    describe('custom', () => {
      it('returns the requested range as the current range', () => {
        const { current } = calculateDateRangeMethod.custom({
          preset: 'custom',
          date_from: '2024-06-10',
          date_to: '2024-06-20',
        });

        expect(current.start).toEqual(new Date('2024-06-10'));
        expect(current.end).toEqual(new Date('2024-06-20'));
      });

      it('counts days inclusively and derives an equal-length previous range', () => {
        const { previous, days } = calculateDateRangeMethod.custom({
          preset: 'custom',
          date_from: '2024-06-10',
          date_to: '2024-06-20',
        });

        expect(days).toBe(11);
        expect(fmt(previous.start)).toBe('2024-05-30');
        expect(fmt(previous.end)).toBe('2024-06-09');
      });

      it('treats a single-day range as one day with the prior day as previous', () => {
        const { previous, days } = calculateDateRangeMethod.custom({
          preset: 'custom',
          date_from: '2024-06-10',
          date_to: '2024-06-10',
        });

        expect(days).toBe(1);
        expect(fmt(previous.start)).toBe('2024-06-09');
        expect(fmt(previous.end)).toBe('2024-06-09');
      });

      it('throws when date_from is missing', () => {
        expect(() =>
          calculateDateRangeMethod.custom({
            preset: 'custom',
            date_to: '2024-06-20',
          }),
        ).toThrow('No date range provided');
      });

      it('throws when date_to is missing', () => {
        expect(() =>
          calculateDateRangeMethod.custom({
            preset: 'custom',
            date_from: '2024-06-10',
          }),
        ).toThrow('No date range provided');
      });
    });
  });
});
