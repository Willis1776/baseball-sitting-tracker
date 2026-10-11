import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ButtonHTMLAttributes, forwardRef, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export const cn = (...classes: ClassValue[]) => twMerge(clsx(classes));

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const variants: Record<Variant, string> = {
    primary: 'bg-navy-800 text-white active:bg-navy-900 disabled:bg-navy-200',
    secondary: 'bg-white text-navy-800 ring-1 ring-inset ring-slate-300 active:bg-slate-50 disabled:text-slate-400',
    danger: 'bg-stitch-600 text-white active:bg-stitch-700 disabled:bg-stitch-100',
    ghost: 'text-navy-700 active:bg-navy-50 disabled:text-slate-400',
};

export function Button({
    variant = 'primary',
    size = 'md',
    className,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
    return (
        <button
            type="button"
            {...props}
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors select-none disabled:cursor-not-allowed',
                size === 'sm' && 'h-9 px-3 text-sm',
                size === 'md' && 'h-11 px-4 text-[15px]',
                size === 'lg' && 'h-13 px-5 text-base',
                variants[variant],
                className,
            )}
        />
    );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
    return <div className={cn('rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70', className)}>{children}</div>;
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
    return (
        <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-slate-700">
            {children}
        </label>
    );
}

export function FieldError({ message }: { message?: string }) {
    return message ? <p className="mt-1 text-sm text-stitch-600">{message}</p> : null;
}

const control =
    'block w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-navy-500 focus:outline-none';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
    { className, ...props },
    ref,
) {
    return <input ref={ref} {...props} className={cn(control, 'h-11', className)} />;
});

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
    return <select {...props} className={cn(control, 'h-11 pr-8', className)} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea {...props} className={cn(control, className)} />;
}

export function Field({
    label,
    error,
    children,
    id,
}: {
    label: string;
    error?: string;
    children: ReactNode;
    id?: string;
}) {
    return (
        <div>
            <Label htmlFor={id}>{label}</Label>
            {children}
            <FieldError message={error} />
        </div>
    );
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'navy' | 'red' | 'green' | 'amber' }) {
    return (
        <span
            className={clsx(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                tone === 'slate' && 'bg-slate-100 text-slate-600',
                tone === 'navy' && 'bg-navy-50 text-navy-700',
                tone === 'red' && 'bg-stitch-50 text-stitch-700',
                tone === 'green' && 'bg-emerald-50 text-emerald-700',
                tone === 'amber' && 'bg-amber-50 text-amber-700',
            )}
        >
            {children}
        </span>
    );
}

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
    return (
        <div className="flex flex-col items-center px-6 py-10 text-center">
            {icon && <div className="mb-3 text-slate-300">{icon}</div>}
            <p className="font-semibold text-slate-700">{title}</p>
            {children && <div className="mt-1 text-sm text-slate-500">{children}</div>}
        </div>
    );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <button
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            className={clsx(
                'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors',
                checked ? 'bg-emerald-500' : 'bg-slate-300',
            )}
        >
            <span
                className={clsx(
                    'inline-block size-6 rounded-full bg-white shadow transition-transform',
                    checked ? 'translate-x-[22px]' : 'translate-x-0.5',
                )}
            />
        </button>
    );
}
