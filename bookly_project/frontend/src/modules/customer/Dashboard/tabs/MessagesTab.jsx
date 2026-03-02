import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { io } from 'socket.io-client';
import { getUserFromToken, authApi } from '../../../auth/auth.js';
import { getConversations, getMessages, startConversation, sendMessage, markRead, deleteConversation } from '../../../../services/messagingService.js';
import ConversationList from '../../../messaging/ConversationList.jsx';
import MessageThread from '../../../messaging/MessageThread.jsx';

export default function MessagesTab({ onUnreadChange }) {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [sending, setSending] = useState(false);
    const [mobileView, setMobileView] = useState('list');
    const [loading, setLoading] = useState(false);
    const [showNewConvModal, setShowNewConvModal] = useState(false);
    const [eligibleProviders, setEligibleProviders] = useState([]);
    const [providerSearch, setProviderSearch] = useState('');

    const socketRef = useRef(null);
    const selectedConversationRef = useRef(null);
    const currentUser = getUserFromToken();

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

        socketRef.current = io(apiUrl, { auth: { token } });

        socketRef.current.on('new_message', ({ conversationId, message, lastMessagePreview }) => {
            setConversations(prev => prev.map(c => {
                if (c.id === conversationId) {
                    const isActive = selectedConversationRef.current?.id === conversationId;
                    return {
                        ...c,
                        last_message_preview: lastMessagePreview,
                        user_unread_count: isActive ? 0 : (c.user_unread_count || 0) + 1
                    };
                }
                return c;
            }));

            if (selectedConversationRef.current?.id === conversationId) {
                setMessages(prev => [...prev, message]);
            }
        });

        loadConversations();

        return () => { socketRef.current?.disconnect(); };
    }, []);

    useEffect(() => {
        if (onUnreadChange) {
            const total = conversations.reduce((sum, c) => sum + (c.user_unread_count || 0), 0);
            onUnreadChange(total);
        }
    }, [conversations]);

    async function loadConversations() {
        try {
            const data = await getConversations();
            setConversations(data);
        } catch (e) {
            console.error('Hiba a beszélgetések betöltésekor:', e);
        }
    }

    async function handleSelectConversation(conversation) {
        setSelectedConversation(conversation);
        selectedConversationRef.current = conversation;
        setMobileView('thread');
        setLoading(true);
        try {
            const msgs = await getMessages(conversation.id);
            setMessages(msgs);
            await markRead(conversation.id);
            setConversations(prev => prev.map(c =>
                c.id === conversation.id ? { ...c, user_unread_count: 0 } : c
            ));
        } catch (e) {
            console.error('Hiba az üzenetek betöltésekor:', e);
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteConversation() {
        if (!selectedConversation) return;
        try {
            await deleteConversation(selectedConversation.id);
            setConversations(prev => prev.filter(c => c.id !== selectedConversation.id));
            setSelectedConversation(null);
            selectedConversationRef.current = null;
            setMessages([]);
            setMobileView('list');
        } catch (e) {
            console.error('Hiba a beszélgetés törlésekor:', e);
        }
    }

    async function handleSend(content) {
        if (!selectedConversation || !content.trim()) return;
        setSending(true);
        try {
            const newMessage = await sendMessage(selectedConversation.id, content);
            setMessages(prev => [...prev, { ...newMessage, content, sender_role: 'user', sender_id: currentUser?.userId }]);
            setConversations(prev => prev.map(c =>
                c.id === selectedConversation.id ? { ...c, last_message_preview: content.substring(0, 100), last_message_at: new Date().toISOString() } : c
            ));
        } catch (e) {
            console.error('Hiba az üzenet küldésekor:', e);
        } finally {
            setSending(false);
        }
    }

    async function loadEligibleProviders() {
        try {
            const response = await authApi.get('/api/user/appointments');
            const data = await response.json();
            if (data.success) {
                const seen = new Set();
                const unique = (data.appointments || []).reduce((acc, apt) => {
                    if (apt.provider_id && !seen.has(apt.provider_id)) {
                        seen.add(apt.provider_id);
                        acc.push({ provider_id: apt.provider_id, provider_name: apt.provider_name, salon_name: apt.salon_name });
                    }
                    return acc;
                }, []);
                setEligibleProviders(unique);
            }
        } catch (e) {
            console.error('Hiba a szolgáltatók betöltésekor:', e);
        }
    }

    async function handleStartConversation(provider) {
        try {
            const conv = await startConversation(provider.provider_id, currentUser.userId);
            setShowNewConvModal(false);
            await loadConversations();
            const fullConv = { ...conv, provider_name: provider.provider_name, salon_name: provider.salon_name, user_unread_count: 0 };
            await handleSelectConversation(fullConv);
        } catch (e) {
            console.error('Hiba a beszélgetés indításakor:', e);
        }
    }

    const filteredProviders = eligibleProviders.filter(p =>
        (p.provider_name || '').toLowerCase().includes(providerSearch.toLowerCase()) ||
        (p.salon_name || '').toLowerCase().includes(providerSearch.toLowerCase())
    );

    return (
        <div className="flex h-full min-h-0">
            {/* Conversation list */}
            <div className={`${mobileView === 'thread' ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 shrink-0`}>
                <ConversationList
                    conversations={conversations}
                    selectedId={selectedConversation?.id}
                    onSelect={handleSelectConversation}
                    role="user"
                    onNewConversation={() => { loadEligibleProviders(); setProviderSearch(''); setShowNewConvModal(true); }}
                />
            </div>

            {/* Message thread */}
            <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-col flex-1 min-w-0`}>
                {selectedConversation ? (
                    <MessageThread
                        messages={messages}
                        otherParty={`${selectedConversation.provider_name} – ${selectedConversation.salon_name}`}
                        currentUserId={currentUser?.userId}
                        currentUserRole="user"
                        onSend={handleSend}
                        onBack={() => setMobileView('list')}
                        onDelete={handleDeleteConversation}
                        sending={sending || loading}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-stone-400 bg-stone-50">
                        <p className="text-sm">Válassz egy beszélgetést</p>
                    </div>
                )}
            </div>

            {/* New conversation modal */}
            {showNewConvModal && createPortal(
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNewConvModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
                            <h3 className="font-semibold text-stone-800">Új üzenet</h3>
                            <button onClick={() => setShowNewConvModal(false)} className="text-stone-400 hover:text-stone-600 transition-colors">✕</button>
                        </div>
                        <div className="px-5 py-3 border-b border-stone-100">
                            <input
                                type="text"
                                placeholder="Keresés..."
                                value={providerSearch}
                                onChange={(e) => setProviderSearch(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {filteredProviders.length === 0 ? (
                                <div className="py-8 text-center text-stone-400 text-sm">
                                    {eligibleProviders.length === 0 ? 'Még nincs foglalásod.' : 'Nincs találat.'}
                                </div>
                            ) : (
                                filteredProviders.map((p) => (
                                    <button
                                        key={p.provider_id}
                                        onClick={() => handleStartConversation(p)}
                                        className="w-full text-left px-5 py-3 hover:bg-amber-50 transition-colors"
                                    >
                                        <p className="text-sm font-semibold text-stone-800">{p.provider_name}</p>
                                        <p className="text-xs text-stone-400">{p.salon_name}</p>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            , document.body)}
        </div>
    );
}
