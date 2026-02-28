import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../Context/ThemeContext';
import { Loader2, MapPin } from 'lucide-react';

export default function LeafletMap({ onLocationSelect, initialLocation, triggerLocate, readOnly = false }) {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const tileLayerRef = useRef(null);
    const { isDark } = useTheme();
    const [mapReady, setMapReady] = useState(false);
    const [loadingAddr, setLoadingAddr] = useState(false);

    // Default center (India roughly)
    const defaultCenter = [20.5937, 78.9629];
    const defaultZoom = 5;

    // Initialize Map Logic
    useEffect(() => {
        const initMap = () => {
            if (!window.L || !mapContainerRef.current || mapInstanceRef.current) return;

            const L = window.L;
            const center = initialLocation?.lat && initialLocation?.lng
                ? [parseFloat(initialLocation.lat), parseFloat(initialLocation.lng)]
                : defaultCenter;

            const zoom = initialLocation?.lat ? 15 : defaultZoom;

            const map = L.map(mapContainerRef.current, {
                zoomControl: false, // Custom position if needed
                attributionControl: false,
                dragging: !readOnly,
                touchZoom: !readOnly,
                doubleClickZoom: !readOnly,
                scrollWheelZoom: !readOnly
            }).setView(center, zoom);

            mapInstanceRef.current = map;

            // Add Zoom Control at bottom-right
            if (!readOnly) {
                L.control.zoom({ position: 'bottomright' }).addTo(map);
            }

            // Add Tile Layer
            updateTileLayer(map, isDark);

            // Add Marker if exists
            if (initialLocation?.lat && initialLocation?.lng) {
                updateMarker(parseFloat(initialLocation.lat), parseFloat(initialLocation.lng), map);
            }

            // Click Handler
            if (!readOnly) {
                map.on('click', (e) => {
                    const { lat, lng } = e.latlng;
                    handleMapClick(lat, lng);
                });
            }

            setMapReady(true);
        };

        // Wait for Leaflet to load
        if (window.L) {
            initMap();
        } else {
            const interval = setInterval(() => {
                if (window.L) {
                    clearInterval(interval);
                    initMap();
                }
            }, 100);
            return () => clearInterval(interval);
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Handle Theme Changes
    useEffect(() => {
        if (mapInstanceRef.current && window.L) {
            updateTileLayer(mapInstanceRef.current, isDark);
        }
    }, [isDark]);

    // Handle External Location Updates
    useEffect(() => {
        if (mapInstanceRef.current && window.L && initialLocation?.lat && initialLocation?.lng) {
            const lat = parseFloat(initialLocation.lat);
            const lng = parseFloat(initialLocation.lng);
            updateMarker(lat, lng, mapInstanceRef.current);
            mapInstanceRef.current.setView([lat, lng], 16);
        }
    }, [initialLocation]);

    const updateTileLayer = (map, darkMode) => {
        const L = window.L;
        if (!L) return;

        // Remove old layer
        if (tileLayerRef.current) {
            map.removeLayer(tileLayerRef.current);
        }

        const lightUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
        const darkUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

        tileLayerRef.current = L.tileLayer(darkMode ? darkUrl : lightUrl, {
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);
    };

    const updateMarker = (lat, lng, map) => {
        const L = window.L;
        if (!L) return;

        if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
        } else {
            markerRef.current = L.marker([lat, lng]).addTo(map);
        }
    };

    const handleMapClick = async (lat, lng) => {
        if (!mapInstanceRef.current) return;

        setLoadingAddr(true);
        updateMarker(lat, lng, mapInstanceRef.current);
        mapInstanceRef.current.panTo([lat, lng]); // Smooth pan

        try {
            // Reverse Geocoding via Nominatim
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
                headers: {
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            });

            if (response.ok) {
                const data = await response.json();

                // Construct better address
                const addr = data.address || {};
                const road = addr.road || addr.pedestrian || addr.footway || "";
                const suburb = addr.suburb || addr.neighbourhood || addr.residential || "";
                const city = addr.city || addr.town || addr.village || "";
                const state = addr.state || "";
                const postcode = addr.postcode || "";

                const fullAddress = [road, suburb, city, state, postcode].filter(Boolean).join(", ");
                const areaName = suburb || city || road || "Selected Location";

                if (onLocationSelect) {
                    onLocationSelect({
                        lat: lat.toFixed(6),
                        lng: lng.toFixed(6),
                        address: fullAddress || data.display_name, // Fallback to display_name
                        area: areaName
                    });
                }
            } else {
                if (onLocationSelect) onLocationSelect({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
            }
        } catch (error) {
            console.error("Geocoding failed:", error);
            if (onLocationSelect) onLocationSelect({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
        } finally {
            setLoadingAddr(false);
        }
    };

    return (
        <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-700 z-0 bg-gray-100 dark:bg-gray-800">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Loading Overlay */}
            {(!mapReady || loadingAddr) && (
                <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-[1000] pointer-events-none">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-100 tracking-wider uppercase">
                        {loadingAddr ? "Fetching Address..." : "Loading Map..."}
                    </span>
                </div>
            )}

            {/* Hint Overlay (if no selection) - Hide in ReadOnly */}
            {!markerRef.current && mapReady && !loadingAddr && !readOnly && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-full shadow-lg z-[500] pointer-events-none backdrop-blur-md border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-red-500" />
                        Tap anywhere on map to pin location
                    </p>
                </div>
            )}
        </div>
    );
}
