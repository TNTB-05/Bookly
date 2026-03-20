import { API_URL } from '../../../config';
const apiUrl = API_URL;

const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
};

const StatusBadge = ({ status }) => {
    const styles = {
        active: 'bg-emerald-100 text-emerald-700',
        inactive: 'bg-gray-100 text-gray-500',
        deleted: 'bg-red-100 text-red-500'
    };
    const labels = { active: 'Aktív', inactive: 'Inaktív', deleted: 'Törölve' };
    return (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles[status] || styles.inactive}`}>
            {labels[status] || status}
        </span>
    );
};

const StaffCard = ({ member, isSelected, onClick }) => {
    return (
        <button
            onClick={() => onClick(member)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left
                ${isSelected
                    ? 'bg-dark-blue text-white shadow-lg scale-[1.01]'
                    : 'hover:bg-white/50 text-gray-800'
                }`}
        >
            {/* Avatar */}
            <div className="shrink-0 relative">
                {member.profile_picture_url ? (
                    <img
                        src={`${apiUrl}${member.profile_picture_url}`}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white/60 shadow"
                    />
                ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow border-2 border-white/60
                        ${isSelected ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-dark-blue to-blue-400 text-white'}`}>
                        {getInitials(member.name)}
                    </div>
                )}
                {/* Online dot for active */}
                {member.status === 'active' && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white"></span>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                    {member.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {member.isManager ? (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                            ${isSelected ? 'bg-white/20 text-white' : 'bg-dark-blue/10 text-dark-blue'}`}>
                            Menedzser
                        </span>
                    ) : (
                        <span className={`text-[10px] font-medium ${isSelected ? 'text-white/70' : 'text-gray-500'}`}>
                            Szolgáltató
                        </span>
                    )}
                    {!isSelected && <StatusBadge status={member.status} />}
                </div>
            </div>

            {/* Appointment count */}
            {!isSelected && member.appointment_count > 0 && (
                <span className="shrink-0 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {member.appointment_count}
                </span>
            )}

            {/* Active indicator */}
            {isSelected && (
                <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-white/80"></div>
            )}
        </button>
    );
};

export default StaffCard;
