import { ReactNode, useEffect, useRef } from 'react';
import { cn, FieldError, Label } from '@/Components/ui';

/**
 * A field that opens an inline, full-width panel below it (used by DatePicker and TimePicker).
 * Renders a grid cell plus a `col-span-2` panel, so place it directly inside a two-column grid;
 * give that grid `grid-flow-dense` so the next field stays on the same row while a panel is open.
 */
export default function PickerField({
    id,
    label,
    error,
    open,
    onOpenChange,
    display,
    placeholder,
    icon,
    children,
}: {
    id: string;
    label: string;
    error?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    display: string | null;
    placeholder: string;
    icon: ReactNode;
    children: ReactNode;
}) {
    const fieldRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // Close when the user taps or tabs into anything outside the field and its panel. This listens
    // for `click`, not `pointerdown`: closing shrinks the sheet, and on iOS the click then lands on
    // whatever moved under the finger (often the sheet backdrop) instead of the field that was tapped.
    useEffect(() => {
        if (!open) return;
        const onOutside = (e: Event) => {
            const target = e.target as Node;
            if (!fieldRef.current?.contains(target) && !panelRef.current?.contains(target)) onOpenChange(false);
        };
        document.addEventListener('click', onOutside);
        document.addEventListener('focusin', onOutside);
        return () => {
            document.removeEventListener('click', onOutside);
            document.removeEventListener('focusin', onOutside);
        };
    }, [open, onOpenChange]);

    return (
        <>
            <div ref={fieldRef}>
                <Label htmlFor={id}>{label}</Label>
                <button
                    id={id}
                    type="button"
                    aria-expanded={open}
                    onClick={() => onOpenChange(!open)}
                    className={cn(
                        'flex h-11 w-full items-center justify-between gap-2 rounded-xl bg-white px-3.5 text-left ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-navy-500 focus:outline-none',
                        open && 'ring-2 ring-navy-500',
                        display ? 'text-slate-900' : 'text-slate-400',
                    )}
                >
                    <span className="truncate">{display ?? placeholder}</span>
                    <span className="shrink-0 text-slate-400">{icon}</span>
                </button>
                <FieldError message={error} />
            </div>
            {open && (
                <div ref={panelRef} className="col-span-2 rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200">
                    {children}
                </div>
            )}
        </>
    );
}
