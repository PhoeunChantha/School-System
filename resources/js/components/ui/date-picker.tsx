import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

interface DatePickerProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function DatePicker({ value, onChange, placeholder = 'Pick a date', className, disabled }: DatePickerProps) {
    const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;

    const handleSelect = (date: Date | undefined) => {
        onChange(date ? format(date, 'yyyy-MM-dd') : '');
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground', className)}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selected ? format(selected, 'PPP') : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={handleSelect}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}
