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

module.exports = function (io) {
    const router = express.Router();

    router.use(AuthMiddleware);

    // GET /api/messages/conversations — list conversations for the logged-in user/provider
    router.get('/conversations', async (req, res) => {
        try {
            const { userId, role } = req.user;
            let conversations;

            if (role === 'provider') {
                conversations = await getConversationsForProvider(userId);
            } else {
                conversations = await getConversationsForUser(userId);
            }

            return res.status(200).json({ success: true, conversations });
        } catch (error) {
            console.error('Conversations list error:', error);
            return res.status(500).json({ success: false, message: 'Hiba az üzenetek betöltésekor' });
        }
    });

    // GET /api/messages/conversations/:id — message history for a conversation
    router.get('/conversations/:id', async (req, res) => {
        try {
            const { userId, role } = req.user;
            const conversationId = parseInt(req.params.id);

            const conversation = await getConversationById(conversationId);
            if (!conversation) {
                return res.status(404).json({ success: false, message: 'A beszélgetés nem található' });
            }

            const isParticipant =
                (role === 'provider' && conversation.provider_id === userId) ||
                (role !== 'provider' && conversation.user_id === userId);

            if (!isParticipant) {
                return res.status(403).json({ success: false, message: 'Nincs hozzáférés ehhez a beszélgetéshez' });
            }

            const messages = await getMessages(conversationId);
            return res.status(200).json({ success: true, messages, conversation });
        } catch (error) {
            console.error('Get messages error:', error);
            return res.status(500).json({ success: false, message: 'Hiba az üzenetek betöltésekor' });
        }
    });

    // POST /api/messages/conversations — start or retrieve a conversation
    router.post('/conversations', async (req, res) => {
        try {
            const { userId, role } = req.user;
            const { provider_id, user_id } = req.body;

            if (!provider_id || !user_id) {
                return res.status(400).json({ success: false, message: 'Hiányzó adatok' });
            }

            // Customers can only message providers they have booked with
            if (role !== 'provider') {
                const hasBooking = await checkBookingExists(userId, provider_id);
                if (!hasBooking) {
                    return res.status(403).json({ success: false, message: 'Csak olyan fodrásszal üzenhetsz, akinél már foglaltál' });
                }
            }

            let conversation = await getConversationByParticipants(provider_id, user_id);
            let isNew = false;

            if (!conversation) {
                const newId = await createConversation(provider_id, user_id);
                conversation = { id: newId };
                isNew = true;
            }

            return res.status(isNew ? 201 : 200).json({ success: true, conversation });
        } catch (error) {
            console.error('Start conversation error:', error);
            return res.status(500).json({ success: false, message: 'Hiba a beszélgetés indításakor' });
        }
    });

    // POST /api/messages/conversations/:id/messages — send a message
    router.post('/conversations/:id/messages', async (req, res) => {
        try {
            const { userId, role } = req.user;
            const conversationId = parseInt(req.params.id);
            const { content, appointment_id } = req.body;

            if (!content || !content.trim()) {
                return res.status(400).json({ success: false, message: 'Az üzenet nem lehet üres' });
            }

            const conversation = await getConversationById(conversationId);
            if (!conversation) {
                return res.status(404).json({ success: false, message: 'A beszélgetés nem található' });
            }

            const isParticipant =
                (role === 'provider' && conversation.provider_id === userId) ||
                (role !== 'provider' && conversation.user_id === userId);

            if (!isParticipant) {
                return res.status(403).json({ success: false, message: 'Nincs hozzáférés ehhez a beszélgetéshez' });
            }

            const senderRole = role === 'provider' ? 'provider' : 'user';
            const newMessage = await insertMessage(conversationId, senderRole, userId, content.trim(), appointment_id);

            // Emit real-time event to recipient
            const recipientRole = senderRole === 'provider' ? 'user' : 'provider';
            const recipientId = recipientRole === 'user' ? conversation.user_id : conversation.provider_id;
            io.to(`${recipientRole}:${recipientId}`).emit('new_message', {
                conversationId,
                message: { ...newMessage, content: content.trim(), sender_role: senderRole, sender_id: userId },
                lastMessagePreview: content.trim().substring(0, 100)
            });

            return res.status(201).json({ success: true, message: newMessage });
        } catch (error) {
            console.error('Send message error:', error);
            return res.status(500).json({ success: false, message: 'Hiba az üzenet küldésekor' });
        }
    });

    // DELETE /api/messages/conversations/:id — delete a conversation
    router.delete('/conversations/:id', async (req, res) => {
        try {
            const { userId, role } = req.user;
            const conversationId = parseInt(req.params.id);

            const conversation = await getConversationById(conversationId);
            if (!conversation) {
                return res.status(404).json({ success: false, message: 'A beszélgetés nem található' });
            }

            const isParticipant =
                (role === 'provider' && conversation.provider_id === userId) ||
                (role !== 'provider' && conversation.user_id === userId);

            if (!isParticipant) {
                return res.status(403).json({ success: false, message: 'Nincs hozzáférés ehhez a beszélgetéshez' });
            }

            await deleteConversation(conversationId);
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Delete conversation error:', error);
            return res.status(500).json({ success: false, message: 'Hiba a beszélgetés törlésekor' });
        }
    });

    // PATCH /api/messages/conversations/:id/read — mark conversation as read
    router.patch('/conversations/:id/read', async (req, res) => {
        try {
            const { userId, role } = req.user;
            const conversationId = parseInt(req.params.id);

            const conversation = await getConversationById(conversationId);
            if (!conversation) {
                return res.status(404).json({ success: false, message: 'A beszélgetés nem található' });
            }

            const isParticipant =
                (role === 'provider' && conversation.provider_id === userId) ||
                (role !== 'provider' && conversation.user_id === userId);

            if (!isParticipant) {
                return res.status(403).json({ success: false, message: 'Nincs hozzáférés ehhez a beszélgetéshez' });
            }

            const readerRole = role === 'provider' ? 'provider' : 'user';
            await markConversationRead(conversationId, readerRole);

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Mark read error:', error);
            return res.status(500).json({ success: false, message: 'Hiba az olvasottság jelzésekor' });
        }
    });

    return router;
};
