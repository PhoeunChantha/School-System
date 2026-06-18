import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, isValid, parse } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface DatePickerProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    startYear?: number;
    endYear?: number;
}

export function DatePicker({
    value,
    onChange,
    placeholder = 'Pick a date',
    className,
    disabled,
    startYear,
    endYear,
}: DatePickerProps) {
    const parsedDate = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
    const selected = parsedDate && isValid(parsedDate) ? parsedDate : undefined;
    const currentYear = new Date().getFullYear();
    const startYearValue = startYear ?? currentYear - 100;
    const endYearValue = endYear ?? currentYear + 10;
    const startMonth = new Date(startYearValue, 0);
    const endMonth = new Date(endYearValue, 11);
    const monthOptions = useMemo(
        () =>
            Array.from({ length: 12 }, (_, monthIndex) => ({
                value: monthIndex.toString(),
                label: format(new Date(2024, monthIndex, 1), 'MMMM'),
            })),
        [],
    );
    const yearOptions = useMemo(
        () =>
            Array.from(
                { length: endYearValue - startYearValue + 1 },
                (_, yearIndex) => startYearValue + yearIndex,
            ),
        [endYearValue, startYearValue],
    );
    const [calendarMonth, setCalendarMonth] = useState(selected ?? new Date());

    useEffect(() => {
        if (selected) {
            setCalendarMonth(selected);
        }
    }, [value]);

    const handleSelect = (date: Date | undefined) => {
        onChange(date ? format(date, 'yyyy-MM-dd') : '');
    };

    const handleMonthChange = (month: string) => {
        setCalendarMonth((date) => new Date(date.getFullYear(), Number(month), 1));
    };

    const handleYearChange = (year: string) => {
        setCalendarMonth((date) => new Date(Number(year), date.getMonth(), 1));
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn('w-full min-w-0 justify-start text-left font-normal', !value && 'text-muted-foreground', className)}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="min-w-0 truncate">
                        {selected ? format(selected, 'PPP') : placeholder}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] rounded-2xl border-slate-200/80 p-3 shadow-2xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900" align="start">
                <div className="mb-3 grid grid-cols-2 gap-2">
                    <Select value={calendarMonth.getMonth().toString()} onValueChange={handleMonthChange}>
                        <SelectTrigger className="h-10 w-full rounded-xl border-transparent bg-slate-100 px-3 text-sm font-semibold text-slate-900 shadow-none transition-colors hover:bg-slate-200/70 focus:ring-2 focus:ring-primary/30 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-64 rounded-xl">
                            {monthOptions.map((month) => (
                                <SelectItem key={month.value} value={month.value}>
                                    {month.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={calendarMonth.getFullYear().toString()} onValueChange={handleYearChange}>
                        <SelectTrigger className="h-10 w-full rounded-xl border-transparent bg-slate-100 px-3 text-sm font-semibold text-slate-900 shadow-none transition-colors hover:bg-slate-200/70 focus:ring-2 focus:ring-primary/30 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-64 rounded-xl">
                            {yearOptions.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={handleSelect}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    startMonth={startMonth}
                    endMonth={endMonth}
                    className="p-0"
                    classNames={{
                        month_caption: 'hidden',
                    }}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}
