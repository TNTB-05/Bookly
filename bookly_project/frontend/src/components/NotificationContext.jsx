import { createContext, useContext, useState, useCallback, useRef } from 'react';
import Toast from './Toast';
import ConfirmModal from './ConfirmModal';

const NotificationContext = createContext();

let _globalToastId = 0;

export function useNotification() {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return ctx;
}

export default function NotificationProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [confirmState, setConfirmState] = useState(null);
    const confirmResolveRef = useRef(null);

    const showToast = useCallback((message, type = 'success', duration = 4000) => {
        const id = ++_globalToastId;
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showConfirm = useCallback((message, options = {}) => {
        return new Promise((resolve) => {
            confirmResolveRef.current = resolve;
            setConfirmState({
                message,
                danger: options.danger || false,
                confirmLabel: options.confirmLabel || 'Igen',
                cancelLabel: options.cancelLabel || 'Mégse',
            });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        if (confirmResolveRef.current) {
            confirmResolveRef.current(true);
            confirmResolveRef.current = null;
        }
        setConfirmState(null);
    }, []);

    const handleCancel = useCallback(() => {
        if (confirmResolveRef.current) {
            confirmResolveRef.current(false);
            confirmResolveRef.current = null;
        }
        setConfirmState(null);
    }, []);

    return (
        <NotificationContext.Provider value={{ showToast, showConfirm }}>
            {children}
            <Toast toasts={toasts} onDismiss={dismissToast} />
            <ConfirmModal
                isOpen={!!confirmState}
                message={confirmState?.message || ''}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                confirmLabel={confirmState?.confirmLabel}
                cancelLabel={confirmState?.cancelLabel}
                danger={confirmState?.danger}
            />
        </NotificationContext.Provider>
    );
}
