import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import clsx from 'clsx';
import { ChevronLeft, KeyRound, LogOut, Shield } from 'lucide-react';
import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { Button, Field, Input } from '@/Components/ui';
import Sheet from '@/Components/Sheet';
import { route } from '@/lib/route';
import { SharedProps } from '@/types';

export default function AppLayout({
    title,
    subtitle,
    back,
    actions,
    children,
    bottom,
    tight,
}: {
    title: string;
    subtitle?: ReactNode;
    back?: { href: string; label: string };
    actions?: ReactNode;
    children: ReactNode;
    bottom?: ReactNode;
    /** Narrower side gutters for dense screens like the sitting chart. */
    tight?: boolean;
}) {
    const { auth } = usePage<SharedProps>().props;
    const [menu, setMenu] = useState(false);
    const [passwordOpen, setPasswordOpen] = useState(false);

    return (
        <div className="min-h-dvh">
            <Head title={title} />
            <header className="sticky top-0 z-30 bg-navy-800 pt-safe text-white shadow-md">
                <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-3">
                    {back ? (
                        <Link href={back.href} className="-ml-1 flex items-center rounded-lg p-1.5 text-navy-100 active:bg-white/10" aria-label={`Back to ${back.label}`}>
                            <ChevronLeft className="size-6" />
                        </Link>
                    ) : (
                        <BaseballMark />
                    )}
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-[17px] leading-tight font-bold">{title}</h1>
                        {subtitle && <div className="truncate text-xs text-navy-100">{subtitle}</div>}
                    </div>
                    {actions}
                    {auth.user && (
                        <button onClick={() => setMenu(true)} className="ml-1 shrink-0 rounded-full ring-2 ring-white/20" aria-label="Account">
                            {auth.user.avatar ? (
                                <img src={auth.user.avatar} alt="" className="size-8 rounded-full" referrerPolicy="no-referrer" />
                            ) : (
                                <span className="flex size-8 items-center justify-center rounded-full bg-navy-500 text-sm font-bold">
                                    {auth.user.name.charAt(0)}
                                </span>
                            )}
                        </button>
                    )}
                </div>
            </header>

            <main className={clsx('mx-auto max-w-3xl pt-4', tight ? 'px-1.5 sm:px-3' : 'px-3', bottom ? 'pb-28' : 'pb-safe')}>{children}</main>

            {bottom && (
                <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-safe backdrop-blur">
                    <div className="mx-auto max-w-3xl">{bottom}</div>
                </nav>
            )}

            <Flash />

            {auth.user && passwordOpen && <PasswordSheet hasPassword={auth.user.has_password} onClose={() => setPasswordOpen(false)} />}

            {auth.user && (
                <Sheet open={menu} onClose={() => setMenu(false)} title="Account">
                    <div className="mb-4 flex items-center gap-3">
                        {auth.user.avatar && <img src={auth.user.avatar} alt="" className="size-11 rounded-full" referrerPolicy="no-referrer" />}
                        <div className="min-w-0">
                            <div className="truncate font-semibold">{auth.user.name}</div>
                            <div className="truncate text-sm text-slate-500">{auth.user.email}</div>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-200">
                        {auth.user.is_admin && (
                            <a href="/admin" className="flex items-center gap-3 px-4 py-3.5 font-medium active:bg-slate-50">
                                <Shield className="size-5 text-slate-500" /> Admin panel
                            </a>
                        )}
                        <button onClick={() => { setMenu(false); setPasswordOpen(true); }} className="flex w-full items-center gap-3 px-4 py-3.5 text-left font-medium active:bg-slate-50">
                            <KeyRound className="size-5 text-slate-500" /> {auth.user.has_password ? 'Change password' : 'Set a password'}
                        </button>
                        <button
                            onClick={() => router.post(route('logout'))}
                            className="flex w-full items-center gap-3 px-4 py-3.5 text-left font-medium text-stitch-600 active:bg-slate-50"
                        >
                            <LogOut className="size-5" /> Sign out
                        </button>
                    </div>
                </Sheet>
            )}
        </div>
    );
}

function PasswordSheet({ hasPassword, onClose }: { hasPassword: boolean; onClose: () => void }) {
    const form = useForm({ current_password: '', password: '', password_confirmation: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.put(route('password.update'), { preserveScroll: true, onSuccess: onClose, onFinish: () => form.reset() });
    };

    return (
        <Sheet
            open
            onClose={onClose}
            title={hasPassword ? 'Change password' : 'Set a password'}
            footer={
                <Button type="submit" form="password-form" className="w-full" disabled={form.processing}>
                    Save password
                </Button>
            }
        >
            <form id="password-form" onSubmit={submit} className="space-y-4">
                {hasPassword && (
                    <Field label="Current password" error={form.errors.current_password} id="pw-current">
                        <Input id="pw-current" type="password" autoComplete="current-password" value={form.data.current_password} onChange={(e) => form.setData('current_password', e.target.value)} />
                    </Field>
                )}
                <Field label="New password" error={form.errors.password} id="pw-new">
                    <Input id="pw-new" type="password" autoComplete="new-password" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} />
                </Field>
                <Field label="Confirm new password" id="pw-confirm">
                    <Input id="pw-confirm" type="password" autoComplete="new-password" value={form.data.password_confirmation} onChange={(e) => form.setData('password_confirmation', e.target.value)} />
                </Field>
            </form>
        </Sheet>
    );
}

export function BaseballMark({ className = 'size-8' }: { className?: string }) {
    return (
        <svg viewBox="0 0 32 32" className={clsx('shrink-0', className)} aria-hidden="true">
            <circle cx="16" cy="16" r="14" fill="#fff" />
            <path d="M8.5 5.5c3 3 4.5 6.5 4.5 10.5s-1.5 7.5-4.5 10.5M23.5 5.5c-3 3-4.5 6.5-4.5 10.5s1.5 7.5 4.5 10.5" fill="none" stroke="#c8102e" strokeWidth="1.6" strokeDasharray="2 1.6" />
        </svg>
    );
}

function Flash() {
    const { flash } = usePage<SharedProps>().props;
    const [visible, setVisible] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const text = flash.error ?? flash.success;
        if (!text) return;
        setVisible({ text, tone: flash.error ? 'error' : 'success' });
        const timer = setTimeout(() => setVisible(null), 2800);
        return () => clearTimeout(timer);
    }, [flash]);

    if (!visible) return null;

    return (
        <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4rem)] z-40 flex justify-center px-4">
            <div
                className={clsx(
                    'rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg',
                    visible.tone === 'success' ? 'bg-emerald-600' : 'bg-stitch-600',
                )}
            >
                {visible.text}
            </div>
        </div>
    );
}
