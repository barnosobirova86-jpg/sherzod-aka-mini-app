import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { haptic } from '../telegram.js';

// Toshkent markazi — xarita shu yerdan ochiladi
const DEFAULT_CENTER = [41.311081, 69.240562];

function pointIcon(letter, color) {
  return L.divIcon({
    className: 'map-pin-wrap',
    html: `<div class="map-pin" style="background:${color}"><span>${letter}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
}

/**
 * Yandex Go uslubidagi xarita: mijoz A (qayerdan) va B (qayerga)
 * nuqtalarini o'zi belgilaydi.
 */
export default function MapPicker({ pointA, pointB, onChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({ A: null, B: null });
  const activeRef = useRef('B');
  const [active, setActive] = useState('B');

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Xaritani bir marta yaratish
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: pointB ? [pointB.lat, pointB.lng] : DEFAULT_CENTER,
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
      onChange(activeRef.current, { lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapRef.current = map;

    // Telegram ichida o'lcham kech aniqlanishi mumkin
    setTimeout(() => map.invalidateSize(), 250);

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = { A: null, B: null };
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Markerlarni sinxronlash
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const points = { A: pointA, B: pointB };
    const colors = { A: '#147a4f', B: '#c0392b' };

    for (const key of ['A', 'B']) {
      const point = points[key];
      const marker = markersRef.current[key];

      if (!point) {
        if (marker) {
          marker.remove();
          markersRef.current[key] = null;
        }
        continue;
      }

      if (marker) {
        marker.setLatLng([point.lat, point.lng]);
      } else {
        const created = L.marker([point.lat, point.lng], {
          icon: pointIcon(key, colors[key]),
          draggable: true,
        }).addTo(map);

        created.on('dragend', () => {
          const { lat, lng } = created.getLatLng();
          onChange(key, { lat, lng });
        });

        markersRef.current[key] = created;
      }
    }
  }, [pointA, pointB, onChange]);

  function focusPoint(point) {
    if (point && mapRef.current) mapRef.current.setView([point.lat, point.lng], 16);
  }

  return (
    <div className="map-picker">
      <div className="map-tabs">
        <button
          type="button"
          className={`map-tab ${active === 'A' ? 'active' : ''}`}
          onClick={() => {
            setActive('A');
            focusPoint(pointA);
          }}
        >
          <span className="map-tab-dot" style={{ background: '#147a4f' }}>
            A
          </span>
          Qayerdan
        </button>
        <button
          type="button"
          className={`map-tab ${active === 'B' ? 'active' : ''}`}
          onClick={() => {
            setActive('B');
            focusPoint(pointB);
          }}
        >
          <span className="map-tab-dot" style={{ background: '#c0392b' }}>
            B
          </span>
          Qayerga
        </button>
      </div>

      <div className="map-hint">
        Xaritani bosib <b>{active === 'A' ? 'A (qayerdan)' : 'B (qayerga)'}</b> nuqtasini
        belgilang — belgini surib ham to‘g‘rilash mumkin
      </div>

      <div ref={containerRef} className="map-canvas" />
    </div>
  );
}
