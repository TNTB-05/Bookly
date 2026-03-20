import { useEffect, useState } from 'react';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import AlertCircleIcon from '../icons/AlertCircleIcon';
import WarningIcon from '../icons/WarningIcon';
import CloseIcon from '../icons/CloseIcon';

const typeStyles = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
};

const typeIcons = {
    success: CheckCircleIcon,
    error: AlertCircleIcon,
    warning: WarningIcon,
    info: AlertCircleIcon,
};

function ToastItem({ toast, onDismiss }) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const dismissTimer = setTimeout(() => {
            setIsExiting(true);
        }, toast.duration || 10000);

        return () => clearTimeout(dismissTimer);
    }, [toast.duration]);

    useEffect(() => {
        if (isExiting) {
            const removeTimer = setTimeout(() => {
                onDismiss(toast.id);
            }, 300);
            return () => clearTimeout(removeTimer);
        }
    }, [isExiting, toast.id, onDismiss]);

    const handleDismiss = () => {
        setIsExiting(true);
    };

    const Icon = typeIcons[toast.type] || AlertCircleIcon;
    const bgClass = typeStyles[toast.type] || typeStyles.info;

    return (
        <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white max-w-sm ${bgClass} ${
                isExiting ? 'animate-toast-out' : 'animate-toast-in'
            }`}
        >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="flex-1">{toast.message}</span>
            <button
                onClick={handleDismiss}
                className="shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
            >
                <CloseIcon className="w-4 h-4" />
            </button>
        </div>
    );
}

export default function Toast({ toasts, onDismiss }) {
    if (!toasts || toasts.length === 0) return null;

    return (
        <div className="fixed top-6 right-6 z-9999 flex flex-col gap-2">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
}
