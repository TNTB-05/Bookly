import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Local marker assets (no CDN dependency)
import markerIcon from '../pics/map/marker-icon.png';
import markerIcon2x from '../pics/map/marker-icon-2x.png';
import markerShadow from '../pics/map/marker-shadow.png';
import markerIconRed from '../pics/map/marker-icon-red.png';
import markerIcon2xRed from '../pics/map/marker-icon-2x-red.png';

// Fix Leaflet broken default icon paths in bundled environments — runs once
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Export local asset paths so wrappers can build custom L.Icon instances
export const MARKER_ICON_URL = markerIcon;
export const MARKER_ICON_2X_URL = markerIcon2x;
export const MARKER_SHADOW_URL = markerShadow;
export const MARKER_ICON_RED_URL = markerIconRed;
export const MARKER_ICON_2X_RED_URL = markerIcon2xRed;

// MapTiler tile configuration
const MAPTILER_KEY = 'aujVd9Kfe6UMcgbKOJkK';
export const TILE_URL = `https://api.maptiler.com/maps/streets-v4/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`;

/**
 * Shared base map component.
 *
 * Props:
 *   center             – [lat, lng]   (required)
 *   zoom               – number        (required)
 *   height             – CSS string, e.g. "500px" or "280px"  (default: "500px")
 *   className          – extra classes on the wrapper div     (default: "")
 *   scrollWheelZoom    – boolean       (default: true)
 *   attributionControl – boolean       (default: false)
 *   children           – rendered inside MapContainer
 */
export default function BaseMap({
    center,
    zoom,
    height = '500px',
    className = '',
    scrollWheelZoom = true,
    attributionControl = false,
    children,
}) {
    return (
        <div style={{ height }} className={`overflow-hidden ${className}`}>
            <MapContainer
                center={center}
                zoom={zoom}
                className="h-full w-full"
                scrollWheelZoom={scrollWheelZoom}
                attributionControl={attributionControl}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer url={TILE_URL} />
                {children}
            </MapContainer>
        </div>
    );
}
