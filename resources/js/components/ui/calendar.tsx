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
                month: 'flex flex-col gap-2',
                month_caption: 'flex justify-center pt-1 relative items-center w-full',
                caption_label: 'text-sm font-medium',
                nav: 'flex items-center gap-1',
                button_previous: cn(
                    buttonVariants({ variant: 'outline' }),
                    'absolute -left-3 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full border-slate-200 bg-white p-0 text-slate-500 shadow-sm opacity-100 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
                ),
                button_next: cn(
                    buttonVariants({ variant: 'outline' }),
                    'absolute -right-3 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full border-slate-200 bg-white p-0 text-slate-500 shadow-sm opacity-100 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
                ),
                month_grid: 'w-full border-collapse',
                weekdays: 'flex',
                weekday: 'text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]',
                week: 'flex w-full mt-2',
                day: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md',
                day_button: cn(buttonVariants({ variant: 'ghost' }), 'h-9 w-10 p-0 font-normal aria-selected:opacity-100'),
                range_start: 'day-range-start rounded-l-md',
                range_end: 'day-range-end rounded-r-md',
                selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md',
                today: 'bg-accent text-accent-foreground',
                outside: 'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
                disabled: 'text-muted-foreground opacity-50',
                range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
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
