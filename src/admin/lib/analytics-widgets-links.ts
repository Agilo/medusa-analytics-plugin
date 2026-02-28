import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

export const formatDateYYYYMMDD = (date: Date) => format(date, 'yyyy-MM-dd');

export const dateRangeToAnalyticsRangeParam = (range?: DateRange) => {
  if (!range?.from) {
    return undefined;
  }

  const from = range.from;
  const to = range.to ?? range.from;

  return `${formatDateYYYYMMDD(from)}-${formatDateYYYYMMDD(to)}`;
};

export const withOptionalAnalyticsRange = (href: string, range?: DateRange) => {
  const rangeParam = dateRangeToAnalyticsRangeParam(range);
  if (!rangeParam) {
    return href;
  }
  const url = new URL(href, 'http://_');
  url.searchParams.set('range', rangeParam);

  return `${url.pathname}${url.search}${url.hash}`;
};
