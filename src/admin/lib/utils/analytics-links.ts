import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

const formatDateYYYYMMDD = (date: Date) => format(date, 'yyyy-MM-dd');

export const withOptionalAnalyticsRange = (href: string, range?: DateRange) => {
  if (!range?.from) {
    return href;
  }

  const from = range.from;
  const to = range.to ?? range.from;

  const rangeParam = `${formatDateYYYYMMDD(from)}-${formatDateYYYYMMDD(to)}`;

  const url = new URL(href, 'http://_');
  url.searchParams.set('range', rangeParam);

  return `${url.pathname}${url.search}${url.hash}`;
};
