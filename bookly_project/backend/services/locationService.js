//Átalakítja a helynevet koordinátákká és kiszámítja a távolságot a felhasználó és a szalonok között
async function placeToCoordinate(placeName) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}&limit=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Bookly-App/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Geocoding hiba: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            throw new Error('Hely nem talalhato');
        }

        return {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon)
        };
    } catch (error) {
        throw new Error(`Geocoding error: ${error.message}`);
    }
}

//Kiszámítja a távolságot két koordináta között (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) + //
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

//Segédfüggvény a fokok radiánokká alakításához
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

//Megtalálja a megadott sugáron belüli szalonokat
function findNearbySalons(salons, userLat, userLon, radiusKm = 50) {
    return salons
        .map((salon) => {
            const distance = calculateDistance(
                userLat,
                userLon,
                parseFloat(salon.latitude),
                parseFloat(salon.longitude)
            );

            return {
                ...salon,
                distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
            };
        })
        .filter((salon) => salon.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);
}

module.exports = {
    placeToCoordinate,
    calculateDistance,
    findNearbySalons
};
