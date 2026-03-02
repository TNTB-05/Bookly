const { pool } = require('../sql/database.js');

async function getConversationsForProvider(providerId) {
    const [rows] = await pool.execute(
        `SELECT conversations.id,
                conversations.last_message_preview,
                conversations.last_message_at,
                conversations.provider_unread_count,
                users.name AS user_name,
                users.profile_picture_url AS user_profile_picture_url
         FROM conversations
         JOIN users ON conversations.user_id = users.id
         WHERE conversations.provider_id = ?
         ORDER BY COALESCE(conversations.last_message_at, conversations.created_at) DESC`,
        [providerId]
    );
    return rows;
}

async function getConversationsForUser(userId) {
    const [rows] = await pool.execute(
        `SELECT conversations.id,
                conversations.last_message_preview,
                conversations.last_message_at,
                conversations.user_unread_count,
                providers.name AS provider_name,
                salons.name AS salon_name
         FROM conversations
         JOIN providers ON conversations.provider_id = providers.id
         JOIN salons ON providers.salon_id = salons.id
         WHERE conversations.user_id = ?
         ORDER BY COALESCE(conversations.last_message_at, conversations.created_at) DESC`,
        [userId]
    );
    return rows;
}

async function getConversationById(conversationId) {
    const [rows] = await pool.execute(
        'SELECT * FROM conversations WHERE id = ?',
        [conversationId]
    );
    return rows[0] || null;
}

async function getConversationByParticipants(providerId, userId) {
    const [rows] = await pool.execute(
        'SELECT id FROM conversations WHERE provider_id = ? AND user_id = ?',
        [providerId, userId]
    );
    return rows[0] || null;
}

async function getMessages(conversationId, limit = 50) {
    const safeLimit = parseInt(limit, 10) || 50;
    const [rows] = await pool.execute(
        `SELECT messages.*,
                users.name AS user_name,
                providers.name AS provider_name
         FROM messages
         LEFT JOIN users ON (messages.sender_role = 'user' AND messages.sender_id = users.id)
         LEFT JOIN providers ON (messages.sender_role = 'provider' AND messages.sender_id = providers.id)
         WHERE messages.conversation_id = ?
         ORDER BY messages.created_at ASC
         LIMIT ${safeLimit}`,
        [conversationId]
    );
    return rows;
}

async function createConversation(providerId, userId) {
    const [result] = await pool.execute(
        'INSERT INTO conversations (provider_id, user_id) VALUES (?, ?)',
        [providerId, userId]
    );
    return result.insertId;
}

async function insertMessage(conversationId, senderRole, senderId, content, appointmentId) {
    const [insertResult] = await pool.execute(
        'INSERT INTO messages (conversation_id, sender_role, sender_id, content, appointment_id) VALUES (?, ?, ?, ?, ?)',
        [conversationId, senderRole, senderId, content, appointmentId || null]
    );
    const messageId = insertResult.insertId;

    await pool.execute(
        `UPDATE conversations
         SET last_message_at = NOW(),
             last_message_preview = LEFT(?, 100),
             provider_unread_count = CASE WHEN ? = 'user' THEN provider_unread_count + 1 ELSE provider_unread_count END,
             user_unread_count = CASE WHEN ? = 'provider' THEN user_unread_count + 1 ELSE user_unread_count END
         WHERE id = ?`,
        [content, senderRole, senderRole, conversationId]
    );

    const [rows] = await pool.execute(
        'SELECT id, created_at, sender_role, sender_id, content, appointment_id, is_read FROM messages WHERE id = ?',
        [messageId]
    );
    return rows[0];
}

async function markConversationRead(conversationId, role) {
    await pool.execute(
        `UPDATE conversations
         SET provider_unread_count = CASE WHEN ? = 'provider' THEN 0 ELSE provider_unread_count END,
             user_unread_count = CASE WHEN ? = 'user' THEN 0 ELSE user_unread_count END
         WHERE id = ?`,
        [role, role, conversationId]
    );
}

async function checkBookingExists(userId, providerId) {
    const [rows] = await pool.execute(
        'SELECT id FROM appointments WHERE user_id = ? AND provider_id = ? LIMIT 1',
        [userId, providerId]
    );
    return rows.length > 0;
}

module.exports = {
    getConversationsForProvider,
    getConversationsForUser,
    getConversationById,
    getConversationByParticipants,
    getMessages,
    createConversation,
    insertMessage,
    markConversationRead,
    checkBookingExists
};
