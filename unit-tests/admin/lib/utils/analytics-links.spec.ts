import { withOptionalAnalyticsRange } from '../../../../src/admin/lib/utils/analytics-links';

const june = { from: new Date(2024, 5, 1), to: new Date(2024, 5, 30) };

describe('withOptionalAnalyticsRange', () => {
  it('returns the href unchanged without a from date', () => {
    expect(withOptionalAnalyticsRange('/orders?x=1#top')).toBe(
      '/orders?x=1#top',
    );
    expect(withOptionalAnalyticsRange('/orders', { from: undefined })).toBe(
      '/orders',
    );
  });

  it('adds the range param', () => {
    expect(withOptionalAnalyticsRange('/orders', june)).toBe(
      '/orders?range=2024-06-01-2024-06-30',
    );
  });

  it('uses from as to when to is missing', () => {
    expect(withOptionalAnalyticsRange('/orders', { from: june.from })).toBe(
      '/orders?range=2024-06-01-2024-06-01',
    );
  });

  it('keeps existing params and the hash', () => {
    expect(withOptionalAnalyticsRange('/orders?q=a%20b#top', june)).toBe(
      '/orders?q=a+b&range=2024-06-01-2024-06-30#top',
    );
  });

  it('replaces an existing range param', () => {
    expect(
      withOptionalAnalyticsRange('/orders?range=this-month&q=1', june),
    ).toBe('/orders?range=2024-06-01-2024-06-30&q=1');
  });

  it('resolves relative paths against the root', () => {
    expect(withOptionalAnalyticsRange('orders', june)).toBe(
      '/orders?range=2024-06-01-2024-06-30',
    );
  });

  it('drops the origin of an absolute URL', () => {
    expect(withOptionalAnalyticsRange('https://shop.test/orders', june)).toBe(
      '/orders?range=2024-06-01-2024-06-30',
    );
  });
});
