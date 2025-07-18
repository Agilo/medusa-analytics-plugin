import {
  getAllDateGroupingKeys,
  getDateGroupingKey,
  getWeekRangeKeyForDate,
} from '../../src/utils/orders';

describe('date utils', () => {
  describe('getWeekRangeKeyForDate', () => {
    it('returns correct week key for mid-week date', () => {
      const key = getWeekRangeKeyForDate(
        new Date('2024-06-05'),
        '2024-06-01',
        '2024-06-30'
      );
      expect(key).toBe('1.-7.6');
    });
    it('returns correct week key for start-week date', () => {
      const key = getWeekRangeKeyForDate(
        new Date('2024-06-01'),
        '2024-06-01',
        '2024-06-30'
      );
      expect(key).toBe('1.-7.6');
    });
    it('returns correct week key for end-week date', () => {
      const key = getWeekRangeKeyForDate(
        new Date('2024-06-07'),
        '2024-06-01',
        '2024-06-30'
      );
      expect(key).toBe('1.-7.6');
    });

    it('falls back if outside range', () => {
      const key = getWeekRangeKeyForDate(
        new Date('2020-01-01'),
        '2024-06-01',
        '2024-06-30'
      );
      expect(key).toBe('2020-01-01');
    });
    it('returns correct key when week spans across two months', () => {
      const key = getWeekRangeKeyForDate(
        new Date('2024-04-30'),
        '2024-04-29',
        '2024-05-30'
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
          '2024-06-30'
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
          '2024-06-30'
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
          '2024-06-30'
        );
        expect(key).toMatch('29.-30.6');
      });
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
        '2024-06-01'
      );
      expect(result).toEqual(['2024-04', '2024-05', '2024-06']);
    });

    it('returns week keys for range', () => {
      const result = getAllDateGroupingKeys('week', '2024-06-01', '2024-06-15');
      const expectResult = ['1.-7.6', '8.-14.6', '15.-15.6'];
      result.forEach((r, i) => {
        expect(r).toBe(expectResult[i]);
      });
    });
  });
});
