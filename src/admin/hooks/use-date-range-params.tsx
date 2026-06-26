import * as React from 'react';
import { DateRange } from 'react-day-picker';
import { useSearchParams } from 'react-router-dom';
import {
  formatDateRangeParam,
  isDatePreset,
  parseRangeParam,
  presetToDateRange,
} from '../lib/date-range';

export const useDateRangeParams = () => {
  const [searchParams, setSearchParams] = useSearchParams(); // Retrieving data from context no need to use useSearchParams
  const rangeParam = searchParams.get('range') || 'this-month';

  const date = React.useMemo(() => parseRangeParam(rangeParam), [rangeParam]);

  const preset = isDatePreset(rangeParam) ? rangeParam : 'custom';

  const setRangeParam = React.useCallback(
    (range: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('range', range);
      setSearchParams(params);
    },
    [searchParams, setSearchParams],
  );

  const updateDatePreset = React.useCallback(
    (next: string) => {
      if (isDatePreset(next)) {
        setRangeParam(next);
        return;
      }

      if (isDatePreset(rangeParam)) {
        setRangeParam(formatDateRangeParam(presetToDateRange(rangeParam)));
      }
    },
    [rangeParam, setRangeParam],
  );

  const handleDateRangeChange = React.useCallback(
    (value: DateRange | undefined) => {
      if (value?.from && value?.to) {
        setRangeParam(formatDateRangeParam(value));
      }
    },
    [setRangeParam],
  );

  return { date, rangeParam, preset, updateDatePreset, handleDateRangeChange };
};
