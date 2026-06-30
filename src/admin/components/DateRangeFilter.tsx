import * as React from 'react';
import { DateRange, Select } from '@medusajs/ui';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from '@medusajs/icons';
import {
  Button,
  CalendarCell,
  CalendarGrid,
  DateInput,
  DateRangePicker,
  DateSegment,
  Dialog,
  Group,
  Heading as AriaHeading,
  Popover,
  RangeCalendar,
  DateValue,
} from 'react-aria-components';
import type { RangeValue } from '@react-types/shared';
import {
  dateRangeToRangeValue,
  rangeValueToDateRange,
} from '../lib/utils/date-range';

const CALENDAR_CELL_CLASS =
  'w-9 h-9 text-sm cursor-pointer rounded flex items-center justify-center hover:bg-ui-bg-subtle dark:hover:bg-ui-bg-subtle selected:bg-ui-bg-interactive selected:text-ui-fg-on-color selection-start:bg-ui-bg-interactive selection-start:text-ui-fg-on-color selection-end:bg-ui-bg-interactive selection-end:text-ui-fg-on-color outside-month:text-ui-fg-disabled unavailable:text-ui-fg-disabled unavailable:cursor-default text-ui-fg-base data-[selected]:bg-ui-bg-interactive data-[selected]:text-ui-fg-on-color data-[selection-start]:bg-ui-bg-interactive data-[selection-start]:text-ui-fg-on-color data-[selection-end]:bg-ui-bg-interactive data-[selection-end]:text-ui-fg-on-color';

export const DateRangeFilter: React.FC<{
  value: DateRange | undefined;
  preset: string;
  onPresetChange: (preset: string) => void;
  onRangeChange: (value: DateRange | undefined) => void;
  isDisabled?: boolean;
}> = ({ value, preset, onPresetChange, onRangeChange, isDisabled }) => {
  const handleChange = (rangeValue: RangeValue<DateValue> | null) => {
    onRangeChange(rangeValueToDateRange(rangeValue));
  };

  return (
    <div className="flex flex-wrap gap-2">
      <div className="w-[170px]">
        <Select
          disabled={isDisabled}
          value={preset}
          onValueChange={onPresetChange}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="this-month">This Month</Select.Item>
            <Select.Item value="last-month">Last Month</Select.Item>
            <Select.Item value="last-3-months">Last 3 Months</Select.Item>
            <Select.Item value="custom">Custom</Select.Item>
          </Select.Content>
        </Select>
      </div>
      <DateRangePicker
        value={dateRangeToRangeValue(value)}
        onChange={handleChange}
        isDisabled={isDisabled}
        aria-label="Date range"
      >
        <Group className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive justify-start focus-visible:shadow-borders-interactive-with-active disabled:bg-ui-bg-disabled disabled:text-ui-fg-disabled bg-ui-bg-field text-ui-fg-base txt-compact-small h-8 text-left font-normal data-[state=open]:!shadow-borders-interactive-with-active shadow-buttons-neutral hover:bg-ui-bg-field-hover outline-none transition-fg disabled:cursor-not-allowed min-w-[260px] bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-ui-bg-field-component dark:border-ui-border-base dark:hover:bg-ui-bg-field-hover px-4 border cursor-pointer">
          <CalendarIcon className="h-4 w-4 text-ui-fg-muted group-disabled:text-ui-fg-disabled flex-shrink-0" />
          <DateInput slot="start" className="flex-1 min-w-0">
            {(segment) => (
              <DateSegment
                segment={segment}
                className="outline-none rounded-sm focus:bg-ui-bg-interactive focus:text-ui-fg-on-color caret-transparent placeholder-shown:italic text-ui-fg-base data-[placeholder]:text-ui-fg-muted"
              />
            )}
          </DateInput>
          <span aria-hidden="true" className="text-ui-fg-muted px-1">
            —
          </span>
          <DateInput slot="end" className="flex-1 min-w-0">
            {(segment) => (
              <DateSegment
                segment={segment}
                className="outline-none rounded-sm focus:bg-ui-bg-interactive focus:text-ui-fg-on-color caret-transparent placeholder-shown:italic text-ui-fg-base data-[placeholder]:text-ui-fg-muted"
              />
            )}
          </DateInput>
          <Button className="text-ui-fg-muted hover:bg-ui-bg-subtle dark:hover:bg-ui-bg-subtle rounded p-1">
            <ChevronDown className="size-4" />
          </Button>
        </Group>
        <Popover className="w-auto p-0 bg-transparent z-50">
          <Dialog className="bg-ui-bg-base dark:bg-ui-bg-base border border-ui-border-base dark:border-ui-border-base rounded-lg shadow-lg p-6 max-w-fit">
            <RangeCalendar className="w-fit" visibleDuration={{ months: 2 }}>
              <header className="flex items-center justify-between mb-4">
                <Button
                  slot="previous"
                  className="p-2 hover:bg-ui-bg-subtle dark:hover:bg-ui-bg-subtle rounded text-ui-fg-base"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <AriaHeading className="font-semibold text-lg text-ui-fg-base" />
                <Button
                  slot="next"
                  className="p-2 hover:bg-ui-bg-subtle dark:hover:bg-ui-bg-subtle rounded text-ui-fg-base"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </header>
              <div className="flex gap-6">
                <CalendarGrid className="border-collapse gap-1">
                  {(date) => (
                    <CalendarCell date={date} className={CALENDAR_CELL_CLASS} />
                  )}
                </CalendarGrid>
                <CalendarGrid
                  offset={{ months: 1 }}
                  className="border-collapse gap-1"
                >
                  {(date) => (
                    <CalendarCell date={date} className={CALENDAR_CELL_CLASS} />
                  )}
                </CalendarGrid>
              </div>
            </RangeCalendar>
          </Dialog>
        </Popover>
      </DateRangePicker>
    </div>
  );
};
