/**
 * Messaging SQL queries.
 * Covers: conversations CRUD, messages, unread counts.
 * Moved from api/messagingQueries.js → sql/messagingQueries.js
 */

const pool = require('./pool');

// ==================== CONVERSATIONS ====================

async function getConversationsForProvider(providerId) {
    const query = `
        SELECT conversations.id,
               conversations.last_message_preview,
               conversations.last_message_at,
               conversations.provider_unread_count,
               users.name AS user_name,
               users.profile_picture_url AS user_profile_picture_url
        FROM conversations
        JOIN users ON conversations.user_id = users.id
        WHERE conversations.provider_id = ?
        ORDER BY COALESCE(conversations.last_message_at, conversations.created_at) DESC
    `;
    const [rows] = await pool.execute(query, [providerId]);
    return rows;
}

async function getConversationsForUser(userId) {
    const query = `
        SELECT conversations.id,
               conversations.last_message_preview,
               conversations.last_message_at,
               conversations.user_unread_count,
               providers.name AS provider_name,
               providers.profile_picture_url AS provider_profile_picture_url,
               salons.name AS salon_name
        FROM conversations
        JOIN providers ON conversations.provider_id = providers.id
        JOIN salons ON providers.salon_id = salons.id
        WHERE conversations.user_id = ?
        ORDER BY COALESCE(conversations.last_message_at, conversations.created_at) DESC
    `;
    const [rows] = await pool.execute(query, [userId]);
    return rows;
}

async function getConversationById(conversationId) {
    const query = `SELECT * FROM conversations WHERE id = ?`;
    const [rows] = await pool.execute(query, [conversationId]);
    return rows[0] || null;
}

async function getConversationByParticipants(providerId, userId) {
    const query = `SELECT id FROM conversations WHERE provider_id = ? AND user_id = ?`;
    const [rows] = await pool.execute(query, [providerId, userId]);
    return rows[0] || null;
}

async function createConversation(providerId, userId) {
    const query = `INSERT INTO conversations (provider_id, user_id) VALUES (?, ?)`;
    const [result] = await pool.execute(query, [providerId, userId]);
    return result.insertId;
}

async function deleteConversation(conversationId) {
    const query = `DELETE FROM conversations WHERE id = ?`;
    await pool.execute(query, [conversationId]);
}

async function markConversationRead(conversationId, role) {
    const query = `
        UPDATE conversations
        SET provider_unread_count = CASE WHEN ? = 'provider' THEN 0 ELSE provider_unread_count END,
            user_unread_count = CASE WHEN ? = 'user' THEN 0 ELSE user_unread_count END
        WHERE id = ?
    `;
    await pool.execute(query, [role, role, conversationId]);
}

// ==================== MESSAGES ====================

async function getMessages(conversationId, limit = 50) {
    const safeLimit = Math.max(1, Math.min(parseInt(limit, 10) || 50, 200));
    const query = `
        SELECT messages.*,
               users.name AS user_name,
               providers.name AS provider_name
        FROM messages
        LEFT JOIN users ON (messages.sender_role = 'user' AND messages.sender_id = users.id)
        LEFT JOIN providers ON (messages.sender_role = 'provider' AND messages.sender_id = providers.id)
        WHERE messages.conversation_id = ?
        ORDER BY messages.created_at ASC
        LIMIT ?
    `;
    const [rows] = await pool.execute(query, [conversationId, String(safeLimit)]);
    return rows;
}

async function insertMessage(conversationId, senderRole, senderId, content, appointmentId) {
    const insertQuery = `
        INSERT INTO messages (conversation_id, sender_role, sender_id, content, appointment_id) VALUES (?, ?, ?, ?, ?)
    `;
    const [insertResult] = await pool.execute(insertQuery, [conversationId, senderRole, senderId, content, appointmentId || null]);
    const messageId = insertResult.insertId;

    const updateConversationQuery = `
        UPDATE conversations
        SET last_message_at = NOW(),
            last_message_preview = LEFT(?, 100),
            provider_unread_count = CASE WHEN ? = 'user' THEN provider_unread_count + 1 ELSE provider_unread_count END,
            user_unread_count = CASE WHEN ? = 'provider' THEN user_unread_count + 1 ELSE user_unread_count END
        WHERE id = ?
    `;
    await pool.execute(updateConversationQuery, [content, senderRole, senderRole, conversationId]);

    const selectMessageQuery = `
        SELECT id, created_at, sender_role, sender_id, content, appointment_id, is_read FROM messages WHERE id = ?
    `;
    const [rows] = await pool.execute(selectMessageQuery, [messageId]);
    return rows[0];
}

// ==================== BOOKING CHECK ====================

async function checkBookingExists(userId, providerId) {
    const query = `SELECT id FROM appointments WHERE user_id = ? AND provider_id = ? LIMIT 1`;
    const [rows] = await pool.execute(query, [userId, providerId]);
    return rows.length > 0;
}

module.exports = {
    getConversationsForProvider,
    getConversationsForUser,
    getConversationById,
    getConversationByParticipants,
    createConversation,
    deleteConversation,
    markConversationRead,
    getMessages,
    insertMessage,
    checkBookingExists
};
