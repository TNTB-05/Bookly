/**
 * Shared provider middleware.
 * Consolidates duplicated middleware from calendarApi, timeBlocksApi, salonApi, and staffApi.
 */

const pool = require('../sql/pool');

/**
 * Verify provider exists and is active in database.
 * Sets req.providerId on success.
 * Used by: calendarApi, timeBlocksApi.
 */
async function verifyProvider(req, res, next) {
    try {
        const providerId = req.user.userId;

        const query = 'SELECT id, status FROM providers WHERE id = ?';
        const [providers] = await pool.execute(query, [providerId]);

        if (providers.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Szolgáltató nem található'
            });
        }

        if (providers[0].status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'A fiók nincs aktív státuszban'
            });
        }

        req.providerId = providerId;
        next();
    } catch (error) {
        console.error('Provider verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Hiba történt a hitelesítés során'
        });
    }
}

/**
 * Verify provider is a manager and set req.salonId.
 * Used by: salonApi (management), staffApi.
 */
async function isManagerMiddleware(req, res, next) {
    try {
        const providerId = req.user.userId;

        const query = 'SELECT isManager, salon_id FROM providers WHERE id = ?';
        const [providers] = await pool.execute(query, [providerId]);

        if (providers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Szolgáltató nem található'
            });
        }

        const provider = providers[0];

        if (!provider.isManager) {
            return res.status(403).json({
                success: false,
                message: 'Csak menedzserek végezhetik el ezt a műveletet'
            });
        }

        req.salonId = provider.salon_id;
        next();
    } catch (error) {
        console.error('Manager check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Szerverhiba'
        });
    }
}

module.exports = {
    verifyProvider,
    isManagerMiddleware
};
