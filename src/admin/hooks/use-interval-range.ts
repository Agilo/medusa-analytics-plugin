import * as React from 'react';
import type { DateRange } from 'react-day-picker';

export type IntervalOption = '30-days-ago' | '60-days-ago' | '90-days-ago';

const intervalToDays = {
  '30-days-ago': 30,
  '60-days-ago': 60,
  '90-days-ago': 90,
} as const;

const getRangeForInterval = (interval: IntervalOption): DateRange => {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - intervalToDays[interval]);

  return {
    from,
    to,
  };
};

export const useIntervalRange = (
  defaultInterval: IntervalOption = '30-days-ago',
) => {
  const [interval, setInterval] =
    React.useState<IntervalOption>(defaultInterval);
  const [range, setRange] = React.useState<DateRange>(() =>
    getRangeForInterval(defaultInterval),
  );

  const onIntervalChange = (value: IntervalOption) => {
    setInterval(value);
    setRange(getRangeForInterval(value));
  };

  return {
    interval,
    range,
    onIntervalChange,
  };
};
