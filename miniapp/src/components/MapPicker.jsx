import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { haptic } from '../telegram.js';

// Toshkent markazi — xarita shu yerdan ochiladi
const DEFAULT_CENTER = [41.311081, 69.240562];

const pinIcon = () =>
  L.divIcon({
    className: 'map-pin-wrap',
    html: '<div class="map-pin" style="background:#c0392b"><span>📍</span></div>',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });

/**
 * Yetkazib beriladigan joyni xaritadan belgilash.
 * Mijoz xaritani bosadi yoki belgini surib joyni to'g'rilaydi.
 */
export default function MapPicker({ point, onChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Xaritani bir marta yaratish
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: point ? [point.lat, point.lng] : DEFAULT_CENTER,
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    map.on('click', (e) => {
      haptic('light');
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapRef.current = map;

    // Telegram ichida o'lcham kech aniqlanishi mumkin
    setTimeout(() => map.invalidateSize(), 250);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Belgini sinxronlash
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!point) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([point.lat, point.lng]);
      return;
    }

    const marker = L.marker([point.lat, point.lng], {
      icon: pinIcon(),
      draggable: true,
    }).addTo(map);

    marker.on('dragend', () => {
      const { lat, lng } = marker.getLatLng();
      onChange({ lat, lng });
    });

    markerRef.current = marker;
  }, [point, onChange]);

  return (
    <div className="map-picker">
      <div className="map-hint">
        Xaritani bosib joyni belgilang — belgini surib ham to‘g‘rilash mumkin
      </div>

      <div ref={containerRef} className="map-canvas" />
    </div>
  );
}
