import * as React from 'react';
import { Select } from '@medusajs/ui';
import { IntervalOption, useIntervalRange } from '../hooks/use-interval-range';
import { useTranslation } from 'react-i18next';

export const SelectInterval: React.FC = () => {
  const { t } = useTranslation();
  const { interval, onIntervalChange } = useIntervalRange();

  return (
    <Select
      size="small"
      value={interval}
      onValueChange={(value: IntervalOption) => onIntervalChange(value)}
    >
      <Select.Trigger className="w-40">
        <Select.Value />
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="30-days-ago">
          {t('analytics.interval.last30Days')}
        </Select.Item>
        <Select.Item value="60-days-ago">
          {t('analytics.interval.last60Days')}
        </Select.Item>
        <Select.Item value="90-days-ago">
          {t('analytics.interval.last90Days')}
        </Select.Item>
      </Select.Content>
    </Select>
  );
};
