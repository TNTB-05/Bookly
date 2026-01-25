//A nominatim OpenStreetMap API pontos cím alapján visszaadja a koordinátákat
/*
https://nominatim.openstreetmap.org/search?street=Akácfa%20utca%2057&city=Budapest&postalcode=1073&country=Hungary&format=json&limit=1
*/

/*
https://nominatim.openstreetmap.org/search?street={utca, hazszam}&city={varos}&postalcode={iranyitoszam}&country={orszag}&format=json&limit=1
*/

// Parse address string into components
function parseAddress(addressString) {
    // Expected format: "Budapest, Istvánmezei út 3, 1146" or "Istvánmezei út 3, Budapest, 1146"
    const parts = addressString.split(',').map(p => p.trim());
    
    let street = '';
    let city = '';
    let postalcode = '';
    
    // Try to identify postal code (4 digits)
    const postalMatch = addressString.match(/\b\d{4}\b/);
    if (postalMatch) {
        postalcode = postalMatch[0];
    }
    
    // Try to identify city (common Hungarian cities)
    const cityPattern = /budapest|debrecen|szeged|miskolc|pécs|győr/i;
    const cityPart = parts.find(p => cityPattern.test(p));
    if (cityPart) {
        city = cityPart.replace(/\d{4}/, '').trim(); // Remove postal code if included
    }
    
    // Remaining part is likely the street
    const streetPart = parts.find(p => !cityPattern.test(p) && !/^\d{4}$/.test(p.trim()));
    if (streetPart) {
        street = streetPart.replace(/\d{4}/, '').trim(); // Remove postal code if included
    }
    
    return { street, city, postalcode };
}

//Átalakítja a helynevet koordinátákká és kiszámítja a távolságot a felhasználó és a szalonok között
async function placeToCoordinate(placeName) {
    try {
        let url;
        
        // Check if the input looks like a structured address (contains comma and possibly postal code)
        if (placeName.includes(',') || /\d{4}/.test(placeName)) {
            const { street, city, postalcode } = parseAddress(placeName);
            
            // Build structured query
            const params = new URLSearchParams();
            if (street) params.append('street', street);
            if (city) params.append('city', city);
            if (postalcode) params.append('postalcode', postalcode);
            params.append('country', 'Hungary');
            params.append('format', 'json');
            params.append('limit', '1');
            
            url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
        } else {
            // Use simple query for city names or simple searches
            url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}&limit=1`;
        }

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
