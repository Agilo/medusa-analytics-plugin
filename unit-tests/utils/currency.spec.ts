import { DateTime } from 'luxon';
import {
  convertToStoreCurrency,
  createStoreCurrencyConverter,
  DEFAULT_CURRENCY,
  getExchangeRatesTtl,
  getStoreCurrencyAndRates,
} from '../../src/utils/currency';

const RATES = { rates: { USD: 2, GBP: 0.5 } };

function createScope({
  storeCurrency = 'eur',
  cached = null,
}: { storeCurrency?: string | null; cached?: unknown } = {}) {
  const cache = {
    get: jest.fn().mockResolvedValue(cached),
    set: jest.fn().mockResolvedValue(undefined),
  };
  const logger = { warn: jest.fn() };
  const store = {
    listStores: jest.fn().mockResolvedValue([
      {
        supported_currencies: storeCurrency
          ? [{ currency_code: storeCurrency, is_default: true }]
          : [],
      },
    ]),
  };
  const services: Record<string, unknown> = { store, cache, logger };
  return {
    scope: { resolve: (key: string) => services[key] } as any,
    cache,
    logger,
  };
}

function mockFetch(response: { ok: boolean; status?: number; body?: unknown }) {
  return jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: response.ok,
    status: response.status ?? (response.ok ? 200 : 500),
    json: async () => response.body,
  } as Response);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('convertToStoreCurrency', () => {
  it('returns amounts in the store currency unchanged, without needing rates', () => {
    expect(convertToStoreCurrency(10, 'eur', 'EUR', null)).toBe(10);
  });

  it('divides by the rate for other currencies', () => {
    expect(convertToStoreCurrency(10, 'usd', 'EUR', RATES)).toBe(5);
  });

  it('returns null when the currency has no rate', () => {
    expect(convertToStoreCurrency(10, 'jpy', 'EUR', RATES)).toBeNull();
  });

  it('returns null when there are no rates at all', () => {
    expect(convertToStoreCurrency(10, 'usd', 'EUR', null)).toBeNull();
  });
});

describe('createStoreCurrencyConverter', () => {
  it('warns once per currency that cannot be converted', () => {
    const logger = { warn: jest.fn() };
    const convert = createStoreCurrencyConverter({
      currencyCode: 'EUR',
      exchangeRates: RATES,
      logger,
    });

    expect(convert(10, 'jpy')).toBeNull();
    expect(convert(20, 'JPY')).toBeNull();
    expect(convert(10, 'usd')).toBe(5);
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});

describe('getStoreCurrencyAndRates', () => {
  it('uses cached rates without calling the API', async () => {
    const { scope } = createScope({ cached: RATES });
    const fetchSpy = jest.spyOn(global, 'fetch');

    const result = await getStoreCurrencyAndRates(scope);

    expect(result).toEqual({ currencyCode: 'EUR', exchangeRates: RATES });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetches and caches rates when nothing is cached', async () => {
    const { scope, cache } = createScope();
    mockFetch({ ok: true, body: { base: 'EUR', ...RATES } });

    const result = await getStoreCurrencyAndRates(scope);

    expect(result).toEqual({ currencyCode: 'EUR', exchangeRates: RATES });
    expect(cache.set).toHaveBeenCalledWith(
      'exchange_rates_EUR',
      RATES,
      expect.any(Number),
    );
  });

  it('does not cache a failed response', async () => {
    const { scope, cache, logger } = createScope();
    mockFetch({ ok: false, status: 503, body: { message: 'down' } });

    const result = await getStoreCurrencyAndRates(scope);

    expect(result.exchangeRates).toBeNull();
    expect(cache.set).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });

  it('does not cache a response without rates', async () => {
    const { scope, cache } = createScope();
    mockFetch({ ok: true, body: { message: 'not found' } });

    const result = await getStoreCurrencyAndRates(scope);

    expect(result.exchangeRates).toBeNull();
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('handles a network error', async () => {
    const { scope, cache, logger } = createScope();
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('ECONNRESET'));

    const result = await getStoreCurrencyAndRates(scope);

    expect(result.exchangeRates).toBeNull();
    expect(cache.set).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });

  it('ignores a cached failure body from older plugin versions', async () => {
    const { scope } = createScope({ cached: { message: 'old error' } });
    mockFetch({ ok: true, body: RATES });

    const result = await getStoreCurrencyAndRates(scope);

    expect(result.exchangeRates).toEqual(RATES);
  });

  it('defaults to EUR when the store has no default currency', async () => {
    const { scope } = createScope({ storeCurrency: null, cached: RATES });

    const result = await getStoreCurrencyAndRates(scope);

    expect(result.currencyCode).toBe(DEFAULT_CURRENCY);
  });
});

describe('getExchangeRatesTtl', () => {
  it('expires at 16:00 Berlin time the same day when before 16:00', () => {
    const now = DateTime.fromISO('2024-06-10T10:00:00', {
      zone: 'Europe/Berlin',
    });
    expect(getExchangeRatesTtl(now)).toBe(6 * 60 * 60);
  });

  it('expires at 16:00 Berlin time the next day when after 16:00', () => {
    const now = DateTime.fromISO('2024-06-10T17:00:00', {
      zone: 'Europe/Berlin',
    });
    expect(getExchangeRatesTtl(now)).toBe(23 * 60 * 60);
  });
});
