import { useState } from 'react';
import { API_URL } from '../../config';

function getRelativeTime(dateString) {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'most';
    if (diffMin < 60) return `${diffMin}p`;
    if (diffHour < 24) return `${diffHour}ó`;
    return `${diffDay}n`;
}


function Avatar({ name, pictureUrl }) {
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    const colors = ['bg-amber-400', 'bg-stone-400', 'bg-amber-600', 'bg-stone-500', 'bg-amber-300'];
    const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;

    if (pictureUrl) {
        return (
            <img
                src={`${API_URL}${pictureUrl}`}
                alt={name || ''}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
        );
    }

    return (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${colors[colorIndex]}`}>
            {initial}
        </div>
    );
}

export default function ConversationList({ conversations = [], selectedId, onSelect, role, onNewConversation }) {
    const [search, setSearch] = useState('');

    const getName = (conv) => (role === 'provider' ? conv.user_name : conv.provider_name);
    const getUnread = (conv) => (role === 'provider' ? conv.provider_unread_count : conv.user_unread_count);
    const getProfilePic = (conv) => (role === 'provider' ? conv.user_profile_picture_url : conv.provider_profile_picture_url);

    const filtered = conversations.filter((conv) => {
        const name = getName(conv) || '';
        const salon = conv.salon_name || '';
        return (
            name.toLowerCase().includes(search.toLowerCase()) ||
            salon.toLowerCase().includes(search.toLowerCase())
        );
    });

    return (
        <div className="flex flex-col h-full bg-white border-r border-stone-200 font-sans">
            <div className="px-4 py-4 border-b border-stone-200">
                <h2 className="text-stone-800 font-semibold text-lg mb-3">Üzenetek</h2>
                <input
                    type="text"
                    placeholder="Keresés..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors duration-150"
                />
            </div>

            <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-stone-400 text-sm px-6 text-center">
                        <span className="text-3xl mb-2">💬</span>
                        <p>{search ? 'Nincs találat.' : 'Még nincsenek beszélgetések.'}</p>
                    </div>
                ) : (
                    <ul>
                        {filtered.map((conv) => {
                            const name = getName(conv);
                            const unread = getUnread(conv);
                            const isSelected = conv.id === selectedId;
                            return (
                                <li key={conv.id}>
                                    <button
                                        type="button"
                                        onClick={() => onSelect(conv)}
                                        className={`w-full text-left px-4 py-3 flex items-start gap-3 border-l-2 transition-colors duration-150 ${
                                            isSelected ? 'bg-amber-50 border-amber-500' : 'border-transparent hover:bg-stone-50'
                                        }`}
                                    >
                                        <Avatar name={name} pictureUrl={getProfilePic(conv)} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`text-sm font-semibold truncate ${unread > 0 ? 'text-stone-900' : 'text-stone-700'}`}>
                                                    {name || 'Ismeretlen'}
                                                </span>
                                                <span className="text-xs text-stone-400 flex-shrink-0">
                                                    {getRelativeTime(conv.last_message_at)}
                                                </span>
                                            </div>
                                            {role === 'user' && conv.salon_name && (
                                                <p className="text-xs text-amber-600 truncate">{conv.salon_name}</p>
                                            )}
                                            <div className="flex items-center justify-between gap-2 mt-0.5">
                                                <p className="text-xs text-stone-400 truncate">
                                                    {conv.last_message_preview || 'Nincs üzenet'}
                                                </p>
                                                {unread > 0 && (
                                                    <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold">
                                                        {unread > 9 ? '9+' : unread}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {onNewConversation && (
                <div className="px-4 pt-3 pb-20 sm:pb-3 border-t border-stone-200">
                    <button
                        type="button"
                        onClick={onNewConversation}
                        className="w-full py-2 px-4 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                        + Új beszélgetés
                    </button>
                </div>
            )}
        </div>
    );
}
