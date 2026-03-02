import { authFetch, authApi } from '../modules/auth/auth.js';

export async function getConversations() {
    const response = await authApi.get('/api/messages/conversations');
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Hiba történt');
    return data.conversations;
}

export async function getMessages(conversationId) {
    const response = await authApi.get(`/api/messages/conversations/${conversationId}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Hiba történt');
    return data.messages;
}

export async function startConversation(providerId, userId) {
    const response = await authApi.post('/api/messages/conversations', { provider_id: providerId, user_id: userId });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Hiba történt');
    return data.conversation;
}

export async function sendMessage(conversationId, content, appointmentId = null) {
    const response = await authApi.post(`/api/messages/conversations/${conversationId}/messages`, {
        content,
        appointment_id: appointmentId
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Hiba történt');
    return data.message;
}

export async function markRead(conversationId) {
    const response = await authFetch(`/api/messages/conversations/${conversationId}/read`, { method: 'PATCH' });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Hiba történt');
    return data;
}

export async function deleteConversation(conversationId) {
    const response = await authFetch(`/api/messages/conversations/${conversationId}`, { method: 'DELETE' });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Hiba történt');
    return data;
}
