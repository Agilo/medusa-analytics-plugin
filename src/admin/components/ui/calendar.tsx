import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { cn } from '../../lib/utils';
import { Button, buttonVariants } from '../ui/button';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        'p-3 text-ui-fg-base bg-ui-bg-base border-0 shadow-none rounded-lg',
        className
      )}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-2',
        month: 'flex flex-col gap-4',
        caption: 'flex justify-center pt-1 relative items-center w-full',
        caption_label: 'text-sm font-medium',
        nav: 'flex items-center gap-1',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'size-7 bg-transparent p-0 opacity-50 hover:opacity-100'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-x-1',
        head_row: 'flex',
        head_cell: 'text-ui-fg-muted rounded-md w-8 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: cn(
          'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-ui-bg-highlight [&:has([aria-selected].day-range-end)]:rounded-r-md',
          props.mode === 'range'
            ? '[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
            : '[&:has([aria-selected])]:rounded-md'
        ),
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-8 p-0 font-normal aria-selected:opacity-100'
        ),
        day_range_start:
          'day-range-start aria-selected:text-white aria-selected:bg-ui-bg-interactive',
        day_range_end:
          'day-range-end aria-selected:text-white aria-selected:bg-ui-bg-interactive',
        day_today:
          'relative after:absolute after:content[""] after:w-1 after:h-1 after:bg-ui-bg-interactive after:rounded-full after:left-1/2 after:bottom-[2px] after:-translate-x-1/2 aria-selected:after:bg-white aria-selected:after:border-[0.0313rem] aria-selected:after:border-ui-border-interactive',
        day_outside:
          'day-outside text-ui-fg-muted aria-selected:text-ui-fg-muted',
        day_disabled: 'text-ui-fg-muted opacity-50',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        NextMonthButton: ({ className, ...props }) => (
          <Button
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              className
            )}
            {...props}
          >
            <ChevronRight className="size-6" />
          </Button>
        ),
        PreviousMonthButton: ({ className, ...props }) => (
          <Button
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              className
            )}
            {...props}
          >
            <ChevronLeft className="size-6" />
          </Button>
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };
