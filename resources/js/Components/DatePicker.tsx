import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import PickerField from '@/Components/PickerField';
import { isoDate, parse, weekdayDate } from '@/lib/format';

/**
 * Month calendar that closes as soon as a day is picked. Values are 'YYYY-MM-DD'.
 * `optional` adds a Clear button; `min` disables earlier days and opens on that month when empty.
 * See PickerField for where to place it.
 */
export default function DatePicker({
    id,
    label,
    value,
    onChange,
    error,
    optional = false,
    min,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    optional?: boolean;
    min?: string;
}) {
    const [open, setOpen] = useState(false);
    const selected = value ? parse(value) : undefined;
    const minDate = min ? parse(min) : undefined;

    const pick = (next: string) => {
        onChange(next);
        setOpen(false);
    };

    return (
        <PickerField
            id={id}
            label={label}
            error={error}
            open={open}
            onOpenChange={setOpen}
            display={value ? weekdayDate(value) : null}
            placeholder={optional ? 'Optional' : 'Pick a date'}
            icon={<CalendarDays className="size-4" />}
        >
            <DayPicker
                mode="single"
                required
                selected={selected}
                defaultMonth={selected ?? minDate}
                disabled={minDate && { before: minDate }}
                onSelect={(day) => pick(isoDate(day))}
                className="mx-auto w-fit text-slate-700 [--rdp-accent-background-color:var(--color-navy-50)] [--rdp-accent-color:var(--color-navy-700)] [--rdp-day-height:40px] [--rdp-day-width:40px] [--rdp-day_button-height:38px] [--rdp-day_button-width:38px]"
                classNames={{
                    selected: 'font-bold [&>button]:bg-navy-800 [&>button]:text-white',
                    today: 'font-bold text-navy-700',
                }}
            />
            {optional && value && (
                <div className="flex justify-start">
                    <button type="button" onClick={() => pick('')} className="h-9 rounded-lg px-3 text-sm font-semibold text-slate-500 active:bg-slate-100">
                        Clear
                    </button>
                </div>
            )}
        </PickerField>
    );
}
