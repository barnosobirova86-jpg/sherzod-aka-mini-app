import { useEffect, useRef, useState } from 'react';
import { resolveImage } from '../api.js';

const SLIDES = [
  '/uploads/banner-1.jpg',
  '/uploads/banner-2.jpg',
  '/uploads/banner-3.jpg',
  '/uploads/banner-4.jpg',
  '/uploads/banner-5.jpg',
];

// Silliq, cheksiz aylanish uchun oxiriga birinchi rasmning nusxasi qo‘shiladi
const LOOP_SLIDES = [...SLIDES, SLIDES[0]];

const DISPLAY_MS = 3000; // har bir rasm shuncha vaqt to‘liq ko‘rinib turadi

export default function Banner() {
  const [index, setIndex] = useState(0);
  const [withTransition, setWithTransition] = useState(true);
  const trackRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => i + 1);
    }, DISPLAY_MS);
    return () => clearInterval(timer);
  }, []);

  function handleTransitionEnd() {
    if (index === SLIDES.length) {
      // Nusxa rasmga yetganda, ko‘rinmas holda haqiqiy boshiga qaytamiz
      setWithTransition(false);
      setIndex(0);
    }
  }

  useEffect(() => {
    if (!withTransition) {
      const id = requestAnimationFrame(() => setWithTransition(true));
      return () => cancelAnimationFrame(id);
    }
  }, [withTransition]);

  const dotIndex = index % SLIDES.length;

  return (
    <div className="banner">
      <div className="banner-track">
        <div
          ref={trackRef}
          className="banner-strip"
          style={{
            transform: `translateX(-${index * 100}%)`,
            transition: withTransition ? undefined : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {LOOP_SLIDES.map((src, i) => (
            <img key={i} src={resolveImage(src)} alt="" className="banner-slide" />
          ))}
        </div>
      </div>

      <div className="banner-dots">
        {SLIDES.map((src, i) => (
          <span key={src} className={`banner-dot ${i === dotIndex ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  );
}
