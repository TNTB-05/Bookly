import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import BaseMap, {
    MARKER_ICON_RED_URL,
    MARKER_ICON_2X_RED_URL,
    MARKER_SHADOW_URL,
} from '../../../components/BaseMap';

// Red marker icon for the user's location (local assets via BaseMap exports)
const redUserIcon = new L.Icon({
    iconUrl: MARKER_ICON_RED_URL,
    iconRetinaUrl: MARKER_ICON_2X_RED_URL,
    shadowUrl: MARKER_SHADOW_URL,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Hungary center
const DEFAULT_CENTER = [47.1625, 19.5033];
const DEFAULT_ZOOM = 7;
const USER_ZOOM = 12;

// Haversine formula for client-side distance calculation (km)
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Inner component to recenter the map when user location changes
function RecenterMap({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, { duration: 1.2 });
        }
    }, [center, zoom, map]);
    return null;
}

// Inner component to fit bounds to salon markers
function FitBounds({ salons }) {
    const map = useMap();
    useEffect(() => {
        if (salons.length > 0) {
            const bounds = L.latLngBounds(
                salons.map((s) => [parseFloat(s.latitude), parseFloat(s.longitude)])
            );
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
    }, [salons, map]);
    return null;
}

export default function SalonMap({ salons, userLocation }) {
    const navigate = useNavigate();

    // Filter salons that have valid coordinates
    const validSalons = useMemo(
        () =>
            (salons || []).filter(
                (s) =>
                    s.latitude &&
                    s.longitude &&
                    !isNaN(parseFloat(s.latitude)) &&
                    !isNaN(parseFloat(s.longitude))
            ),
        [salons]
    );

    const mapCenter = userLocation
        ? [userLocation.latitude, userLocation.longitude]
        : DEFAULT_CENTER;

    const mapZoom = userLocation ? USER_ZOOM : DEFAULT_ZOOM;

    return (
        <BaseMap
            center={mapCenter}
            zoom={mapZoom}
            height="500px"
            className="rounded-2xl border border-gray-200 shadow-sm"
        >
            {/* Recenter when user location changes */}
            {userLocation && (
                <RecenterMap
                    center={[userLocation.latitude, userLocation.longitude]}
                    zoom={USER_ZOOM}
                />
            )}

            {/* Fit bounds to markers when no user location */}
            {!userLocation && validSalons.length > 0 && (
                <FitBounds salons={validSalons} />
            )}

            {/* Red marker for user's current location */}
            {userLocation && (
                <Marker
                    position={[userLocation.latitude, userLocation.longitude]}
                    icon={redUserIcon}
                >
                    <Popup>
                        <p className="font-semibold text-sm text-gray-900">A te helyzeted</p>
                    </Popup>
                </Marker>
            )}

            {/* Salon markers */}
            {validSalons.map((salon) => {
                const lat = parseFloat(salon.latitude);
                const lng = parseFloat(salon.longitude);
                const distance =
                    userLocation
                        ? haversineDistance(
                              userLocation.latitude,
                              userLocation.longitude,
                              lat,
                              lng
                          ).toFixed(1)
                        : null;

                return (
                    <Marker key={salon.id} position={[lat, lng]}>
                        <Popup minWidth={240} maxWidth={300}>
                            <div className="space-y-1.5 text-sm">
                                {/* Salon name */}
                                <p className="font-extrabold text-gray-900 text-lg leading-tight pb-1.5 border-b border-gray-200">
                                    {salon.name}
                                </p>

                                {/* Address */}
                                {salon.address && (
                                    <p className="text-gray-600 text-xs">
                                        📍 {salon.address}
                                    </p>
                                )}

                                {/* Opening hours */}
                                {salon.opening_hours && salon.closing_hours && (
                                    <p className="text-gray-600 text-xs">
                                        🕐 {salon.opening_hours} – {salon.closing_hours}
                                    </p>
                                )}

                                {/* Contact */}
                                {salon.phone && (
                                    <p className="text-gray-600 text-xs">
                                        📞 {salon.phone}
                                    </p>
                                )}
                                {salon.email && (
                                    <p className="text-gray-600 text-xs">
                                        ✉️ {salon.email}
                                    </p>
                                )}

                                {/* Distance */}
                                {distance && (
                                    <p className="text-indigo-600 text-xs font-medium">
                                        🚗 {distance} km távolságra
                                    </p>
                                )}

                                {/* Rating */}
                                {salon.average_rating > 0 && (
                                    <p className="text-amber-600 text-xs font-medium">
                                        {'★'.repeat(Math.round(Number(salon.average_rating)))}
                                        {'☆'.repeat(5 - Math.round(Number(salon.average_rating)))}
                                        {' '}
                                        {Number(salon.average_rating).toFixed(1)} ({salon.rating_count})
                                    </p>
                                )}

                                {/* Open salon button */}
                                <button
                                    onClick={() => navigate(`/dashboard/salon/${salon.id}`)}
                                    className="mt-1 w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                                >
                                    Megnyitás
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </BaseMap>
    );
}
