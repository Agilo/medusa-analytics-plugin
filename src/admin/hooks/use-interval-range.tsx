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

export type IntervalRangeContextValue = {
  interval: IntervalOption;
  range: DateRange;
  onIntervalChange: (value: IntervalOption) => void;
};

const IntervalRangeContext = React.createContext({
  interval: '30-days-ago',
  range: getRangeForInterval('30-days-ago'),
  onIntervalChange: () => {},
} as IntervalRangeContextValue);

export const IntervalRangeContextProvider: React.FC<{
  defaultInterval?: IntervalOption;
  children: React.ReactNode;
}> = ({ defaultInterval = '30-days-ago', children }) => {
  const [interval, setInterval] =
    React.useState<IntervalOption>(defaultInterval);
  const [range, setRange] = React.useState<DateRange>(() =>
    getRangeForInterval(defaultInterval),
  );

  const onIntervalChange = React.useCallback((value: IntervalOption) => {
    setInterval(value);
    setRange(getRangeForInterval(value));
  }, []);

  return (
    <IntervalRangeContext.Provider
      value={{ interval, range, onIntervalChange }}
    >
      {children}
    </IntervalRangeContext.Provider>
  );
};

export const useIntervalRange = () => React.useContext(IntervalRangeContext);

// TODO: remove this HOC once all widgets are converted to use the provider directly
export const withIntervalRange = <P extends object>(
  Component: React.ComponentType<P>,
) => {
  return (props: P) => (
    <IntervalRangeContextProvider>
      <Component {...props} />
    </IntervalRangeContextProvider>
  );
};
