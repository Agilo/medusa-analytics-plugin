import type { MedusaContainer } from '@medusajs/framework/types';
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils';
import { DateTime } from 'luxon';

export const DEFAULT_CURRENCY = 'EUR';

const FRANKFURTER_URL = 'https://api.frankfurter.dev/v1/latest';

/** Rates relative to the store currency: 1 store-currency unit = `rates[code]` units of `code`. */
export type ExchangeRates = { rates: Record<string, number> };

type Logger = { warn: (message: string) => void };

function isExchangeRates(value: unknown): value is ExchangeRates {
  return (
    typeof value === 'object' &&
    value !== null &&
    'rates' in value &&
    typeof (value as { rates: unknown }).rates === 'object' &&
    (value as { rates: unknown }).rates !== null
  );
}

/**
 * Seconds until the next 16:00 Europe/Berlin, which is shortly after the ECB
 * publishes new reference rates (the source Frankfurter uses).
 */
export function getExchangeRatesTtl(now: DateTime = DateTime.now()): number {
  const berlinNow = now.setZone('Europe/Berlin');
  let expireAt = berlinNow.set({
    hour: 16,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  if (berlinNow >= expireAt) {
    expireAt = expireAt.plus({ days: 1 });
  }
  return Math.floor(expireAt.diff(berlinNow, 'seconds').seconds);
}

async function fetchExchangeRates(
  currencyCode: string,
  logger: Logger,
): Promise<ExchangeRates | null> {
  try {
    const response = await fetch(`${FRANKFURTER_URL}?base=${currencyCode}`);
    if (!response.ok) {
      logger.warn(
        `[medusa-analytics-plugin] Exchange rates request for ${currencyCode} failed with status ${response.status}. Amounts in other currencies are left out until rates are available.`,
      );
      return null;
    }
    const body: unknown = await response.json();
    if (!isExchangeRates(body)) {
      logger.warn(
        `[medusa-analytics-plugin] Exchange rates response for ${currencyCode} has no rates. Amounts in other currencies are left out until rates are available.`,
      );
      return null;
    }
    return { rates: body.rates };
  } catch (error) {
    logger.warn(
      `[medusa-analytics-plugin] Exchange rates request for ${currencyCode} failed: ${
        error instanceof Error ? error.message : String(error)
      }. Amounts in other currencies are left out until rates are available.`,
    );
    return null;
  }
}

export async function getStoreCurrencyCode(
  scope: Pick<MedusaContainer, 'resolve'>,
): Promise<string> {
  const storeModuleService = scope.resolve(Modules.STORE);
  const stores = await storeModuleService.listStores(
    {},
    { relations: ['supported_currencies'] },
  );
  return (
    stores?.[0]?.supported_currencies
      ?.find((c) => c.is_default)
      ?.currency_code?.toUpperCase() || DEFAULT_CURRENCY
  );
}

/** A failed rates request isn't cached and gives `exchangeRates: null`. */
export async function getStoreCurrencyAndRates(
  scope: Pick<MedusaContainer, 'resolve'>,
): Promise<{ currencyCode: string; exchangeRates: ExchangeRates | null }> {
  const cacheModuleService = scope.resolve(Modules.CACHE);
  const logger = scope.resolve(ContainerRegistrationKeys.LOGGER);

  const currencyCode = await getStoreCurrencyCode(scope);

  const cacheKey = `exchange_rates_${currencyCode}`;
  const cached = await cacheModuleService.get<unknown>(cacheKey);
  if (isExchangeRates(cached)) {
    return { currencyCode, exchangeRates: cached };
  }

  const exchangeRates = await fetchExchangeRates(currencyCode, logger);
  if (exchangeRates) {
    await cacheModuleService.set(
      cacheKey,
      exchangeRates,
      getExchangeRatesTtl(),
    );
  }

  return { currencyCode, exchangeRates };
}

/** Returns `null` when there is no usable rate for the amount's currency. */
export function convertToStoreCurrency(
  amount: number,
  amountCurrency: string,
  currencyCode: string,
  exchangeRates: ExchangeRates | null,
): number | null {
  const code = amountCurrency.toUpperCase();
  if (code === currencyCode.toUpperCase()) {
    return amount;
  }
  const rate = exchangeRates?.rates?.[code];
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    return null;
  }
  return amount / rate;
}

/** Per request: warns once per currency that can't be converted. */
export function createStoreCurrencyConverter({
  currencyCode,
  exchangeRates,
  logger,
}: {
  currencyCode: string;
  exchangeRates: ExchangeRates | null;
  logger: Logger;
}) {
  const warned = new Set<string>();
  return (amount: number, amountCurrency: string): number | null => {
    const converted = convertToStoreCurrency(
      amount,
      amountCurrency,
      currencyCode,
      exchangeRates,
    );
    const code = amountCurrency.toUpperCase();
    if (converted === null && !warned.has(code)) {
      warned.add(code);
      logger.warn(
        `[medusa-analytics-plugin] No exchange rate from ${code} to ${currencyCode}. Amounts in ${code} are left out of the totals.`,
      );
    }
    return converted;
  };
}
