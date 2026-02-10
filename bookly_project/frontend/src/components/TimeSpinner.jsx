import { useEffect, useRef, useState } from 'react';

const TimeSpinner = ({ value, onChange, minHour, maxHour }) => {
    const [hours, minutes] = value.split(':').map(Number);
    const [isOpen, setIsOpen] = useState(false);
    const hourListRef = useRef(null);
    const minuteListRef = useRef(null);
    const containerRef = useRef(null);

    // Generate arrays for hours and minutes
    const hourOptions = Array.from({ length: maxHour - minHour }, (_, i) => minHour + i);
    const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

    const handleHourChange = (hour) => {
        const newTime = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        onChange(newTime);
    };

    const handleMinuteChange = (minute) => {
        const newTime = `${hours.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        onChange(newTime);
    };

    // Scroll to selected values when picker opens or value changes
    useEffect(() => {
        if (isOpen) {
            if (hourListRef.current) {
                const selectedHourElement = hourListRef.current.querySelector(`[data-hour="${hours}"]`);
                if (selectedHourElement) {
                    selectedHourElement.scrollIntoView({ block: 'center', behavior: 'auto' });
                }
            }
            if (minuteListRef.current) {
                const selectedMinuteElement = minuteListRef.current.querySelector(`[data-minute="${minutes}"]`);
                if (selectedMinuteElement) {
                    selectedMinuteElement.scrollIntoView({ block: 'center', behavior: 'auto' });
                }
            }
        }
    }, [isOpen, hours, minutes]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Display Input */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left focus:ring-2 focus:ring-dark-blue focus:border-transparent flex items-center justify-between"
            >
                <span className="text-lg font-medium">{value}</span>
                <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Picker */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-xl p-3">
                    <div className="flex items-center justify-center gap-2 relative">
                        {/* Hours Column */}
                        <div className="flex-1 flex flex-col items-center">
                            <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Óra</div>
                            <div 
                                className="h-45 overflow-y-scroll w-full relative scrollbar-none"
                                ref={hourListRef}
                                style={{ scrollSnapType: 'y mandatory' }}
                            >
                                <div className="h-18 shrink-0"></div>
                                {hourOptions.map((hour) => (
                                    <div
                                        key={hour}
                                        data-hour={hour}
                                        className={`h-9 flex items-center justify-center font-medium cursor-pointer transition-all duration-150 select-none ${
                                            hours === hour 
                                                ? 'text-blue-800 font-bold text-xl scale-110' 
                                                : 'text-gray-500 text-lg hover:text-gray-700 hover:bg-blue-50'
                                        }`}
                                        onClick={() => handleHourChange(hour)}
                                        style={{ scrollSnapAlign: 'center' }}
                                    >
                                        {hour.toString().padStart(2, '0')}
                                    </div>
                                ))}
                                <div className="h-18 shrink-0"></div>
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="text-2xl font-bold text-blue-800 mx-1 pt-8">:</div>

                        {/* Minutes Column */}
                        <div className="flex-1 flex flex-col items-center">
                            <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Perc</div>
                            <div 
                                className="h-45 overflow-y-scroll w-full relative scrollbar-none"
                                ref={minuteListRef}
                                style={{ scrollSnapType: 'y mandatory' }}
                            >
                                <div className="h-18 shrink-0"></div>
                                {minuteOptions.map((minute) => (
                                    <div
                                        key={minute}
                                        data-minute={minute}
                                        className={`h-9 flex items-center justify-center font-medium cursor-pointer transition-all duration-150 select-none ${
                                            minutes === minute 
                                                ? 'text-blue-800 font-bold text-xl scale-110' 
                                                : 'text-gray-500 text-lg hover:text-gray-700 hover:bg-blue-50'
                                        }`}
                                        onClick={() => handleMinuteChange(minute)}
                                        style={{ scrollSnapAlign: 'center' }}
                                    >
                                        {minute.toString().padStart(2, '0')}
                                    </div>
                                ))}
                                <div className="h-18 shrink-0"></div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Selection highlight bar */}
                    <div 
                        className="absolute left-0 right-0 h-9 pointer-events-none border-t border-b border-blue-200"
                        style={{
                            top: 'calc(50% + 1rem)',
                            transform: 'translateY(-50%)',
                            background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.1) 50%, rgba(59, 130, 246, 0.05) 100%)'
                        }}
                    ></div>
                </div>
            )}
        </div>
    );
};

export default TimeSpinner;
