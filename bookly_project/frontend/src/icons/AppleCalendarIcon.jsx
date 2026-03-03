const AppleCalendarIcon = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
        <rect x="2" y="2" width="20" height="20" rx="3" ry="3" fill="white" stroke="#d1d5db" strokeWidth="1" />
        <rect x="2" y="2" width="20" height="7" rx="3" ry="3" fill="#e53935" />
        <rect x="2" y="6" width="20" height="3" fill="#e53935" />
        <text x="12" y="18" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1f2937" fontFamily="system-ui, sans-serif">31</text>
    </svg>
);

export default AppleCalendarIcon;
