const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
};

const getAvatarColor = (name) => {
    if (!name) return 'from-gray-400 to-gray-500';
    const colors = [
        'from-blue-400 to-blue-600',
        'from-purple-400 to-purple-600',
        'from-green-400 to-green-600',
        'from-orange-400 to-orange-600',
        'from-pink-400 to-pink-600',
        'from-teal-400 to-teal-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

const CustomerListItem = ({ customer, onClick }) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Europe/Budapest' }) : '–';
    const formatPrice = (p) => new Intl.NumberFormat('hu-HU').format(p) + ' Ft';

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 p-4 bg-white/40 backdrop-blur-md rounded-xl border border-white/50 hover:bg-white/60 hover:shadow-md transition-all text-left"
        >
            {/* Avatar */}
            <div className="shrink-0">
                {customer.profile_picture_url ? (
                    <img src={`${apiUrl}${customer.profile_picture_url}`} alt={customer.name} className="w-12 h-12 rounded-full object-cover border-2 border-white/50 shadow" />
                ) : (
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(customer.name)} flex items-center justify-center text-white font-bold text-sm shadow`}>
                        {getInitials(customer.name)}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800 truncate">{customer.name || 'Ismeretlen'}</span>
                    {customer.is_guest ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Vendég</span>
                    ) : (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Regisztrált</span>
                    )}
                </div>
                <p className="text-sm text-gray-500 truncate mt-0.5">{customer.email}</p>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                <span className="text-sm font-semibold text-dark-blue">{formatPrice(customer.total_spent)}</span>
                <span className="text-xs text-gray-500">{customer.total_bookings} foglalás</span>
                <span className="text-xs text-gray-400">Utoljára: {formatDate(customer.last_booking_date)}</span>
            </div>
        </button>
    );
};

export default CustomerListItem;
