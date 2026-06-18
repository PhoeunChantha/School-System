import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { DayPicker } from 'react-day-picker';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn('p-3', className)}
            classNames={{
                months: 'sm:flex-row gap-2',
                month: 'flex flex-col gap-3',
                month_caption: 'flex justify-center pt-1 relative items-center w-full',
                caption_label: 'text-sm font-medium',
                nav: 'flex items-center gap-1',
                button_previous: cn(
                    buttonVariants({ variant: 'outline' }),
                    'absolute -left-3 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full border-slate-200 bg-white p-0 text-slate-500 shadow-sm opacity-100 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
                ),
                button_next: cn(
                    buttonVariants({ variant: 'outline' }),
                    'absolute -right-3 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full border-slate-200 bg-white p-0 text-slate-500 shadow-sm opacity-100 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
                ),
                month_grid: 'w-full border-collapse',
                weekdays: 'flex justify-between',
                weekday: 'w-10 pb-1 text-center text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500',
                week: 'flex w-full justify-between mt-1',
                day: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected].day-range-end)]:rounded-r-full [&:has([aria-selected].day-range-start)]:rounded-l-full',
                day_button: cn(
                    'inline-flex h-10 w-10 items-center justify-center rounded-full p-0 text-sm font-normal text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 aria-selected:opacity-100 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white',
                ),
                range_start: 'day-range-start rounded-l-full',
                range_end: 'day-range-end rounded-r-full',
                selected: 'rounded-full bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground [&>button]:bg-primary [&>button]:text-primary-foreground [&>button:hover]:bg-primary [&>button:hover]:text-primary-foreground',
                today: 'font-semibold text-primary [&:not([aria-selected])>button]:ring-1 [&:not([aria-selected])>button]:ring-inset [&:not([aria-selected])>button]:ring-primary/40',
                outside: 'day-outside text-slate-300 opacity-100 aria-selected:bg-accent/50 dark:text-slate-600',
                disabled: 'text-slate-300 opacity-50 dark:text-slate-600',
                range_middle: 'aria-selected:rounded-none aria-selected:bg-primary/10 aria-selected:text-slate-900 dark:aria-selected:text-white [&>button]:rounded-none',
                hidden: 'invisible',
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation, className }) => {
                    if (orientation === 'left') {
                        return <ChevronLeft className={cn('h-4 w-4', className)} />;
                    }

                    return <ChevronRight className={cn('h-4 w-4', className)} />;
                },
            }}
            {...props}
        />
    );
}
Calendar.displayName = 'Calendar';

export { Calendar };
