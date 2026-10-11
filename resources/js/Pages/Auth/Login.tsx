import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';
import { BaseballMark } from '@/Layouts/AppLayout';
import { route } from '@/lib/route';
import { SharedProps } from '@/types';

export default function Login({ devLogin }: { devLogin: boolean }) {
    const { flash } = usePage<SharedProps>().props;
    const form = useForm({ email: '', password: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('login.password'), { onFinish: () => form.reset('password') });
    };

    return (
        <div className="flex min-h-dvh flex-col bg-navy-800 pt-safe pb-safe text-white">
            <Head title="Sign in" />
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
                <BaseballMark className="mb-6 size-20" />
                <h1 className="text-3xl font-bold tracking-tight">Sit Chart</h1>
                <p className="mt-2 max-w-xs text-navy-100">Track who sits each inning and keep playing time fair across every game, league and tournament.</p>

                {flash.error && <p className="mt-6 rounded-xl bg-stitch-600/90 px-4 py-2 text-sm font-medium">{flash.error}</p>}

                <a
                    href={route('google.redirect')}
                    className="mt-8 flex h-13 w-full max-w-xs items-center justify-center gap-3 rounded-2xl bg-white font-semibold text-slate-800 shadow-lg active:bg-slate-100"
                >
                    <GoogleLogo />
                    Continue with Google
                </a>

                <div className="mt-6 flex w-full max-w-xs items-center gap-3 text-xs text-navy-200 uppercase">
                    <span className="h-px flex-1 bg-white/20" /> or <span className="h-px flex-1 bg-white/20" />
                </div>

                <form onSubmit={submit} className="mt-6 w-full max-w-xs space-y-3 text-left">
                    <input
                        type="email"
                        autoComplete="username"
                        inputMode="email"
                        autoCapitalize="none"
                        placeholder="Email"
                        aria-label="Email"
                        value={form.data.email}
                        onChange={(e) => form.setData('email', e.target.value)}
                        className="block h-12 w-full rounded-2xl border-0 bg-white/10 px-4 text-white ring-1 ring-white/20 placeholder:text-navy-200 focus:ring-2 focus:ring-white focus:outline-none"
                    />
                    <input
                        type="password"
                        autoComplete="current-password"
                        placeholder="Password"
                        aria-label="Password"
                        value={form.data.password}
                        onChange={(e) => form.setData('password', e.target.value)}
                        className="block h-12 w-full rounded-2xl border-0 bg-white/10 px-4 text-white ring-1 ring-white/20 placeholder:text-navy-200 focus:ring-2 focus:ring-white focus:outline-none"
                    />
                    {form.errors.email && <p className="text-sm font-medium text-stitch-100">{form.errors.email}</p>}
                    <button
                        type="submit"
                        disabled={form.processing || !form.data.email || !form.data.password}
                        className="h-12 w-full rounded-2xl bg-stitch-600 font-semibold text-white active:bg-stitch-700 disabled:opacity-50"
                    >
                        Sign in
                    </button>
                </form>

                <p className="mt-6 max-w-xs text-xs text-navy-200">Access is by invitation. Ask your administrator or team owner to add you.</p>

                {devLogin && (
                    <a href={route('dev-login')} className="mt-4 text-sm text-navy-100 underline underline-offset-4">
                        Local dev sign-in
                    </a>
                )}
            </div>
        </div>
    );
}

function GoogleLogo() {
    return (
        <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
    );
}
