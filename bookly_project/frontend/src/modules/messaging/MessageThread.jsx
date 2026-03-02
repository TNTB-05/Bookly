import { useEffect, useRef, useState } from 'react';

function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
}

function SendIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
    );
}

function BackIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z" clipRule="evenodd" />
        </svg>
    );
}

export default function MessageThread({ messages = [], otherParty, currentUserId, currentUserRole, onSend, onBack, sending }) {
    const [input, setInput] = useState('');
    const bottomRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length]);

    const handleInput = (e) => {
        setInput(e.target.value);
        const ta = textareaRef.current;
        if (ta) {
            ta.style.height = 'auto';
            ta.style.height = Math.min(ta.scrollHeight, 96) + 'px';
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed || sending) return;
        onSend(trimmed);
        setInput('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const isOwnMessage = (msg) => msg.sender_role === currentUserRole;

    return (
        <div className="flex flex-col h-full bg-stone-50 font-sans">
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-stone-200 flex-shrink-0">
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="text-stone-500 hover:text-stone-800 transition-colors duration-150 p-1 rounded-lg hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        aria-label="Vissza"
                    >
                        <BackIcon />
                    </button>
                )}
                <div className="flex-1 min-w-0">
                    <h2 className="text-stone-800 font-semibold text-base truncate">{otherParty || 'Beszélgetés'}</h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-stone-400 text-sm text-center">
                        Még nincsenek üzenetek
                    </div>
                ) : (
                    messages.map((msg) => {
                        const own = isOwnMessage(msg);
                        const senderName = own ? null : (msg.user_name || msg.provider_name || otherParty);

                        return (
                            <div key={msg.id} className={`flex flex-col ${own ? 'items-end' : 'items-start'}`}>
                                {!own && senderName && (
                                    <span className="text-xs text-stone-400 mb-1 ml-1">{senderName}</span>
                                )}
                                <div
                                    className={`max-w-xs sm:max-w-md lg:max-w-lg px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                        own ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-800'
                                    }`}
                                >
                                    {msg.content}
                                </div>
                                <div className={`flex items-center gap-2 mt-1 ${own ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <span className="text-xs text-stone-400">{formatTime(msg.created_at)}</span>
                                    {msg.appointment_id && (
                                        <span className="text-xs bg-white border border-stone-200 text-stone-500 px-2 py-0.5 rounded-full">
                                            📅 Időponthoz kapcsolva
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            <div className="flex-shrink-0 bg-white border-t border-stone-200 px-4 py-3">
                <div className="flex items-end gap-2">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Írj üzenetet..."
                        rows={1}
                        disabled={sending}
                        className="flex-1 resize-none rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors duration-150 disabled:opacity-50"
                        style={{ maxHeight: '96px', overflowY: 'auto' }}
                    />
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={sending || !input.trim()}
                        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Küldés"
                    >
                        <SendIcon />
                    </button>
                </div>
            </div>
        </div>
    );
}
