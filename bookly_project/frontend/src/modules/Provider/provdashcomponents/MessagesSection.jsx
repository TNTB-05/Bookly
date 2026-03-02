import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { getUserFromToken, authApi } from '../../auth/auth.js';
import { getConversations, getMessages, startConversation, sendMessage, markRead } from '../../../services/messagingService.js';
import ConversationList from '../../messaging/ConversationList.jsx';
import MessageThread from '../../messaging/MessageThread.jsx';

export default function MessagesSection({ onUnreadChange }) {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [sending, setSending] = useState(false);
    const [mobileView, setMobileView] = useState('list');
    const [loading, setLoading] = useState(false);
    const [showNewConvModal, setShowNewConvModal] = useState(false);
    const [pastCustomers, setPastCustomers] = useState([]);
    const [customerSearch, setCustomerSearch] = useState('');

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
                        provider_unread_count: isActive ? 0 : (c.provider_unread_count || 0) + 1
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
            const total = conversations.reduce((sum, c) => sum + (c.provider_unread_count || 0), 0);
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
                c.id === conversation.id ? { ...c, provider_unread_count: 0 } : c
            ));
        } catch (e) {
            console.error('Hiba az üzenetek betöltésekor:', e);
        } finally {
            setLoading(false);
        }
    }

    async function handleSend(content) {
        if (!selectedConversation || !content.trim()) return;
        setSending(true);
        try {
            const newMessage = await sendMessage(selectedConversation.id, content);
            setMessages(prev => [...prev, { ...newMessage, content, sender_role: 'provider', sender_id: currentUser?.userId }]);
            setConversations(prev => prev.map(c =>
                c.id === selectedConversation.id ? { ...c, last_message_preview: content.substring(0, 100), last_message_at: new Date().toISOString() } : c
            ));
        } catch (e) {
            console.error('Hiba az üzenet küldésekor:', e);
        } finally {
            setSending(false);
        }
    }

    async function loadPastCustomers() {
        try {
            const response = await authApi.get('/api/provider/calendar/appointments');
            const data = await response.json();
            const appointments = data.appointments || data.data?.appointments || [];
            const seen = new Set();
            const unique = appointments.reduce((acc, apt) => {
                if (apt.user_id && !seen.has(apt.user_id)) {
                    seen.add(apt.user_id);
                    acc.push({ user_id: apt.user_id, user_name: apt.user_name || apt.customer_name || 'Ügyfél' });
                }
                return acc;
            }, []);
            setPastCustomers(unique);
        } catch (e) {
            console.error('Hiba az ügyfelek betöltésekor:', e);
        }
    }

    async function handleStartConversation(customer) {
        try {
            const conv = await startConversation(currentUser.userId, customer.user_id);
            setShowNewConvModal(false);
            await loadConversations();
            const fullConv = { ...conv, user_name: customer.user_name, provider_unread_count: 0 };
            await handleSelectConversation(fullConv);
        } catch (e) {
            console.error('Hiba a beszélgetés indításakor:', e);
        }
    }

    const filteredCustomers = pastCustomers.filter(c =>
        (c.user_name || '').toLowerCase().includes(customerSearch.toLowerCase())
    );

    return (
        <div className="flex h-full min-h-0">
            {/* Conversation list */}
            <div className={`${mobileView === 'thread' ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 shrink-0`}>
                <ConversationList
                    conversations={conversations}
                    selectedId={selectedConversation?.id}
                    onSelect={handleSelectConversation}
                    role="provider"
                    onNewConversation={() => { loadPastCustomers(); setCustomerSearch(''); setShowNewConvModal(true); }}
                />
            </div>

            {/* Message thread */}
            <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-col flex-1 min-w-0`}>
                {selectedConversation ? (
                    <MessageThread
                        messages={messages}
                        otherParty={selectedConversation.user_name}
                        currentUserId={currentUser?.userId}
                        currentUserRole="provider"
                        onSend={handleSend}
                        onBack={() => setMobileView('list')}
                        sending={sending || loading}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-stone-400 bg-stone-50">
                        <p className="text-sm">Válassz egy beszélgetést</p>
                    </div>
                )}
            </div>

            {/* New conversation modal */}
            {showNewConvModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
                            <h3 className="font-semibold text-stone-800">Új üzenet küldése</h3>
                            <button onClick={() => setShowNewConvModal(false)} className="text-stone-400 hover:text-stone-600 transition-colors">✕</button>
                        </div>
                        <div className="px-5 py-3 border-b border-stone-100">
                            <input
                                type="text"
                                placeholder="Ügyfél keresése..."
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {filteredCustomers.length === 0 ? (
                                <div className="py-8 text-center text-stone-400 text-sm">
                                    {pastCustomers.length === 0 ? 'Még nincs ügyfeled.' : 'Nincs találat.'}
                                </div>
                            ) : (
                                filteredCustomers.map((c) => (
                                    <button
                                        key={c.user_id}
                                        onClick={() => handleStartConversation(c)}
                                        className="w-full text-left px-5 py-3 hover:bg-amber-50 transition-colors"
                                    >
                                        <p className="text-sm font-semibold text-stone-800">{c.user_name}</p>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
