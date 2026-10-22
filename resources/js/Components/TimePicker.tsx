import clsx from 'clsx';
import { Clock } from 'lucide-react';
import { useState } from 'react';
import Picker from 'react-mobile-picker';
import PickerField from '@/Components/PickerField';
import { time } from '@/lib/format';

const HOURS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const MINUTES = ['00', '15', '30', '45'];
const PERIODS = ['AM', 'PM'];
const DEFAULT_TIME = '18:00';

type Wheels = { hour: string; minute: string; period: string };

const toWheels = (value: string): Wheels => {
    const [h, m] = value.split(':');
    const hour = Number(h);
    return { hour: String(hour % 12 || 12), minute: m, period: hour < 12 ? 'AM' : 'PM' };
};

const fromWheels = ({ hour, minute, period }: Wheels) =>
    `${String((Number(hour) % 12) + (period === 'PM' ? 12 : 0)).padStart(2, '0')}:${minute}`;

/**
 * Hour / minute / AM-PM wheels in 15-minute steps (native time inputs ignore `step` on phones).
 * See PickerField for where to place it.
 */
export default function TimePicker({
    id,
    label,
    value,
    onChange,
    error,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
}) {
    const [open, setOpen] = useState(false);
    const wheels = toWheels(value || DEFAULT_TIME);
    // Keep an off-grid minute from an older game (e.g. 6:10) selectable until it's changed.
    const minutes = MINUTES.includes(wheels.minute) ? MINUTES : [...MINUTES, wheels.minute].sort();

    const onOpenChange = (next: boolean) => {
        if (next && !value) onChange(DEFAULT_TIME);
        setOpen(next);
    };

    const column = (name: keyof Wheels, options: string[], format: (option: string) => string = (o) => o) => (
        <Picker.Column name={name}>
            {options.map((option) => (
                <Picker.Item key={option} value={option}>
                    {({ selected }) => (
                        <span className={clsx('text-lg', selected ? 'font-bold text-navy-800' : 'text-slate-400')}>{format(option)}</span>
                    )}
                </Picker.Item>
            ))}
        </Picker.Column>
    );

    return (
        <PickerField
            id={id}
            label={label}
            error={error}
            open={open}
            onOpenChange={onOpenChange}
            display={time(value)}
            placeholder="Pick a time"
            icon={<Clock className="size-4" />}
        >
            {/* wheelMode only affects mouse wheels: scrolling down moves to the next (later) option. Touch drags are unaffected. */}
            <Picker value={wheels} onChange={(next) => onChange(fromWheels(next))} height={180} itemHeight={40} wheelMode="normal">
                {column('hour', HOURS)}
                {column('minute', minutes, (m) => `:${m}`)}
                {column('period', PERIODS)}
            </Picker>
            <div className="flex justify-end">
                <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-lg px-3 text-sm font-semibold text-navy-700 active:bg-navy-50">
                    Done
                </button>
            </div>
        </PickerField>
    );
}
