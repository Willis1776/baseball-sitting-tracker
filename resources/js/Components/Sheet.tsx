import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Bottom sheet on phones, centered dialog on larger screens.
 */
export default function Sheet({
    open,
    onClose,
    title,
    children,
    footer,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = overflow;
            window.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
            <div className="absolute inset-0 bg-slate-900/50 animate-[fade_150ms_ease-out]" onClick={onClose} />
            <div className="relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white shadow-xl sm:max-w-lg sm:rounded-3xl animate-[rise_200ms_ease-out]">
                <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" />
                <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-2 sm:pt-5">
                    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                    <button onClick={onClose} className="-mr-2 rounded-full p-2 text-slate-500 active:bg-slate-100" aria-label="Close">
                        <X className="size-5" />
                    </button>
                </div>
                <div className="overflow-y-auto px-5 pb-4">{children}</div>
                {footer && <div className="border-t border-slate-100 px-5 pt-3 pb-safe">{footer}</div>}
                {!footer && <div className="pb-safe" />}
            </div>
            <style>{`@keyframes fade{from{opacity:0}}@keyframes rise{from{transform:translateY(24px);opacity:.6}}`}</style>
        </div>,
        document.body,
    );
}

export function ConfirmSheet({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Delete',
    processing,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: ReactNode;
    confirmLabel?: string;
    processing?: boolean;
}) {
    return (
        <Sheet
            open={open}
            onClose={onClose}
            title={title}
            footer={
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onClose} className="h-11 rounded-xl font-semibold text-slate-700 ring-1 ring-slate-300 active:bg-slate-50">
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={processing}
                        className="h-11 rounded-xl bg-stitch-600 font-semibold text-white active:bg-stitch-700 disabled:opacity-60"
                    >
                        {confirmLabel}
                    </button>
                </div>
            }
        >
            <div className="text-slate-600">{message}</div>
        </Sheet>
    );
}
