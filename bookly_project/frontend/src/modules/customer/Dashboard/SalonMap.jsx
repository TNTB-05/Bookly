import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's broken default marker icon paths in bundled environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || '';
const TILE_URL = `https://api.maptiler.com/maps/streets-v4/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`;
const TILE_ATTRIBUTION = '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

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
        <div className="h-96 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                className="h-full w-full"
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

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
                            <Popup minWidth={220} maxWidth={280}>
                                <div className="space-y-1.5 text-sm">
                                    {/* Salon name */}
                                    <p className="font-bold text-gray-900 text-base leading-tight">
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
            </MapContainer>
        </div>
    );
}
