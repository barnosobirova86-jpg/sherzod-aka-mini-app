import { useEffect, useState } from 'react';
import { resolveImage } from '../api.js';

const SLIDES = [
  '/uploads/banner-1.jpg',
  '/uploads/banner-2.jpg',
  '/uploads/banner-3.jpg',
  '/uploads/banner-4.jpg',
  '/uploads/banner-5.jpg',
];

const INTERVAL_MS = 5000;

export default function Banner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="banner">
      <div className="banner-track">
        {SLIDES.map((src, i) => (
          <img
            key={src}
            src={resolveImage(src)}
            alt=""
            className={`banner-slide ${i === index ? 'active' : ''}`}
          />
        ))}
      </div>

      <div className="banner-dots">
        {SLIDES.map((src, i) => (
          <span key={src} className={`banner-dot ${i === index ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  );
}
