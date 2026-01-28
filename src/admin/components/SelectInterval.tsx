import { Select } from '@medusajs/ui';
import { IntervalOption, useIntervalRange } from '../hooks/use-interval-range';

export const SelectInterval: React.FC = () => {
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
        <Select.Item value="30-days-ago">Last 30 Days</Select.Item>
        <Select.Item value="60-days-ago">Last 60 Days</Select.Item>
        <Select.Item value="90-days-ago">Last 90 Days</Select.Item>
      </Select.Content>
    </Select>
  );
};
