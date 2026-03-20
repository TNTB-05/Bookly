const express = require('express');
const AuthMiddleware = require('./auth/AuthMiddleware.js');
const {
    getConversationsForProvider,
    getConversationsForUser,
    getConversationById,
    getConversationByParticipants,
    getMessages,
    createConversation,
    insertMessage,
    markConversationRead,
    checkBookingExists,
    deleteConversation
} = require('../sql/messagingQueries.js');
const { logEvent } = require('../services/logService.js');

module.exports = function (io) {
    const router = express.Router();

    // Check if the requesting user is a participant of the conversation
    function verifyParticipant(role, userId, conversation) {
        return (role === 'provider' && conversation.provider_id === userId) ||
               (role !== 'provider' && conversation.user_id === userId);
    }

    router.use(AuthMiddleware);

    // GET /api/messages/conversations — list conversations for the logged-in user/provider
    router.get('/conversations', async (request, response) => {
        try {
            const { userId, role } = request.user;
            let conversations;

            if (role === 'provider') {
                conversations = await getConversationsForProvider(userId);
            } else {
                conversations = await getConversationsForUser(userId);
            }

            return response.status(200).json({ success: true, conversations });
        } catch (error) {
            console.error('Conversations list error:', error);
            return response.status(500).json({ success: false, message: 'Hiba az üzenetek betöltésekor' });
        }
    });

    // GET /api/messages/conversations/:id — message history for a conversation
    router.get('/conversations/:id', async (request, response) => {
        try {
            const { userId, role } = request.user;
            const conversationId = parseInt(request.params.id);

            const conversation = await getConversationById(conversationId);
            if (!conversation) {
                return response.status(404).json({ success: false, message: 'A beszélgetés nem található' });
            }

            if (!verifyParticipant(role, userId, conversation)) {
                return response.status(403).json({ success: false, message: 'Nincs hozzáférés ehhez a beszélgetéshez' });
            }

            const messages = await getMessages(conversationId);
            return response.status(200).json({ success: true, messages, conversation });
        } catch (error) {
            console.error('Get messages error:', error);
            return response.status(500).json({ success: false, message: 'Hiba az üzenetek betöltésekor' });
        }
    });

    // POST /api/messages/conversations — start or retrieve a conversation
    router.post('/conversations', async (request, response) => {
        try {
            const { userId, role } = request.user;
            const { provider_id, user_id } = request.body;

            if (!provider_id || !user_id) {
                return response.status(400).json({ success: false, message: 'Hiányzó adatok' });
            }

            // Customers can only message providers they have booked with
            if (role !== 'provider') {
                const hasBooking = await checkBookingExists(userId, provider_id);
                if (!hasBooking) {
                    return response.status(403).json({ success: false, message: 'Csak olyan fodrásszal üzenhetsz, akinél már foglaltál' });
                }
            }

            let conversation = await getConversationByParticipants(provider_id, user_id);
            let isNew = false;

            if (!conversation) {
                const newId = await createConversation(provider_id, user_id);
                conversation = { id: newId };
                isNew = true;
            }

            return response.status(isNew ? 201 : 200).json({ success: true, conversation });
        } catch (error) {
            console.error('Start conversation error:', error);
            return response.status(500).json({ success: false, message: 'Hiba a beszélgetés indításakor' });
        }
    });

    // POST /api/messages/conversations/:id/messages — send a message
    router.post('/conversations/:id/messages', async (request, response) => {
        try {
            const { userId, role } = request.user;
            const conversationId = parseInt(request.params.id);
            const { content, appointment_id } = request.body;

            if (!content || !content.trim()) {
                return response.status(400).json({ success: false, message: 'Az üzenet nem lehet üres' });
            }

            const conversation = await getConversationById(conversationId);
            if (!conversation) {
                return response.status(404).json({ success: false, message: 'A beszélgetés nem található' });
            }

            if (!verifyParticipant(role, userId, conversation)) {
                return response.status(403).json({ success: false, message: 'Nincs hozzáférés ehhez a beszélgetéshez' });
            }

            const senderRole = role === 'provider' ? 'provider' : 'user';
            const newMessage = await insertMessage(conversationId, senderRole, userId, content.trim(), appointment_id);

            logEvent('INFO', 'MESSAGE_SENT', senderRole, userId, 'conversation', conversationId, `${senderRole === 'provider' ? 'Provider' : 'User'} #${userId} sent a message in conversation #${conversationId}`).catch(() => {});

            // Emit real-time event to recipient
            const recipientRole = senderRole === 'provider' ? 'user' : 'provider';
            const recipientId = recipientRole === 'user' ? conversation.user_id : conversation.provider_id;
            io.to(`${recipientRole}:${recipientId}`).emit('new_message', {
                conversationId,
                message: { ...newMessage, content: content.trim(), sender_role: senderRole, sender_id: userId },
                lastMessagePreview: content.trim().substring(0, 100)
            });

            return response.status(201).json({ success: true, message: newMessage });
        } catch (error) {
            console.error('Send message error:', error);
            return response.status(500).json({ success: false, message: 'Hiba az üzenet küldésekor' });
        }
    });

    // DELETE /api/messages/conversations/:id — delete a conversation
    router.delete('/conversations/:id', async (request, response) => {
        try {
            const { userId, role } = request.user;
            const conversationId = parseInt(request.params.id);

            const conversation = await getConversationById(conversationId);
            if (!conversation) {
                return response.status(404).json({ success: false, message: 'A beszélgetés nem található' });
            }

            if (!verifyParticipant(role, userId, conversation)) {
                return response.status(403).json({ success: false, message: 'Nincs hozzáférés ehhez a beszélgetéshez' });
            }

            await deleteConversation(conversationId);
            return response.status(200).json({ success: true });
        } catch (error) {
            console.error('Delete conversation error:', error);
            return response.status(500).json({ success: false, message: 'Hiba a beszélgetés törlésekor' });
        }
    });

    // PATCH /api/messages/conversations/:id/read — mark conversation as read
    router.patch('/conversations/:id/read', async (request, response) => {
        try {
            const { userId, role } = request.user;
            const conversationId = parseInt(request.params.id);

            const conversation = await getConversationById(conversationId);
            if (!conversation) {
                return response.status(404).json({ success: false, message: 'A beszélgetés nem található' });
            }

            if (!verifyParticipant(role, userId, conversation)) {
                return response.status(403).json({ success: false, message: 'Nincs hozzáférés ehhez a beszélgetéshez' });
            }

            const readerRole = role === 'provider' ? 'provider' : 'user';
            await markConversationRead(conversationId, readerRole);

            return response.status(200).json({ success: true });
        } catch (error) {
            console.error('Mark read error:', error);
            return response.status(500).json({ success: false, message: 'Hiba az olvasottság jelzésekor' });
        }
    });

    return router;
};
