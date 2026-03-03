import { useState, useRef, useEffect } from 'react';
import CalendarIcon from '../../../icons/CalendarIcon';
import ChevronDownIcon from '../../../icons/ChevronDownIcon';
import GoogleCalendarIcon from '../../../icons/GoogleCalendarIcon';
import AppleCalendarIcon from '../../../icons/AppleCalendarIcon';
import { generateCalendarLinks } from './calendarUtils';

export default function AddToCalendarButton({ appointment }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const { googleUrl, icsContent } = generateCalendarLinks(appointment);

    const handleApple = () => {
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookly-appointment-${appointment.id}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setOpen(false);
    };

    return (
        <div ref={ref} className="relative">
            <button
                onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
            >
                <CalendarIcon className="w-4 h-4" />
                Naptárba
                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute bottom-full mb-2 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-[180px] animate-fade-in">
                    <button
                        onClick={() => { window.open(googleUrl, '_blank', 'noopener,noreferrer'); setOpen(false); }}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl transition-colors"
                    >
                        <GoogleCalendarIcon className="w-4 h-4" />
                        Google Calendar
                    </button>
                    <button
                        onClick={handleApple}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-b-xl transition-colors"
                    >
                        <AppleCalendarIcon className="w-4 h-4" />
                        Apple Calendar
                    </button>
                </div>
            )}
        </div>
    );
}
