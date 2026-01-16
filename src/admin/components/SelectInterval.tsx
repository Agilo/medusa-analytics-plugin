import { Select } from '@medusajs/ui';
import { IntervalOption } from '../hooks/use-interval-range';
import { twMerge } from 'tailwind-merge';

export const SelectInterval: React.FC<{
  onIntervalChange: (value: IntervalOption) => void;
  interval: IntervalOption;
  selectProps?: React.ComponentProps<typeof Select> & {
    triggerProps: React.ComponentProps<typeof Select.Trigger>;
  };
}> = ({ interval, onIntervalChange, selectProps }) => {
  return (
    <Select
      {...selectProps}
      size="small"
      value={interval}
      onValueChange={(value: IntervalOption) => onIntervalChange(value)}
    >
      <Select.Trigger
        {...selectProps?.triggerProps}
        className={twMerge('w-40', selectProps?.triggerProps?.className)}
        // If needed, to add specific width to the select trigger (uses radix components under the hook). Also use postion popper
        // className="w-[var(--radix-select-trigger-width)]"
      >
        <Select.Value />
      </Select.Trigger>
      <Select.Content
      // position='popper'
      >
        <Select.Item value="30-days-ago">Last 30 Days</Select.Item>
        <Select.Item value="60-days-ago">Last 60 Days</Select.Item>
        <Select.Item value="90-days-ago">Last 90 Days</Select.Item>
      </Select.Content>
    </Select>
  );
};
