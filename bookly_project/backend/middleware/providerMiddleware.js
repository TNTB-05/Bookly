/**
 * Shared provider middleware.
 * Consolidates duplicated middleware from calendarApi, timeBlocksApi, salonApi, and staffApi.
 */

const { getProviderStatus, getProviderManagerInfo } = require('../sql/providerQueries');

/**
 * Verify provider exists and is active in database.
 * Sets request.providerId on success.
 * Used by: calendarApi, timeBlocksApi.
 */
async function verifyProvider(request, response, next) {
    try {
        const providerId = request.user.userId;

        const provider = await getProviderStatus(providerId);

        if (!provider) {
            return response.status(403).json({
                success: false,
                message: 'Szolgáltató nem található'
            });
        }

        if (provider.status !== 'active') {
            return response.status(403).json({
                success: false,
                message: 'A fiók nincs aktív státuszban'
            });
        }

        request.providerId = providerId;
        next();
    } catch (error) {
        console.error('Provider verification error:', error);
        return response.status(500).json({
            success: false,
            message: 'Hiba történt a hitelesítés során'
        });
    }
}

/**
 * Verify provider is a manager and set request.salonId.
 * Used by: salonApi (management), staffApi.
 */
async function isManagerMiddleware(request, response, next) {
    try {
        const providerId = request.user.userId;

        const provider = await getProviderManagerInfo(providerId);

        if (!provider) {
            return response.status(404).json({
                success: false,
                message: 'Szolgáltató nem található'
            });
        }

        if (!provider.isManager) {
            return response.status(403).json({
                success: false,
                message: 'Csak menedzserek végezhetik el ezt a műveletet'
            });
        }

        request.salonId = provider.salon_id;
        next();
    } catch (error) {
        console.error('Manager check error:', error);
        return response.status(500).json({
            success: false,
            message: 'Szerverhiba'
        });
    }
}

module.exports = {
    verifyProvider,
    isManagerMiddleware
};
