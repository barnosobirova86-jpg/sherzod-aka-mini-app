import { useState } from 'react';
import { haptic } from '../telegram.js';

const slides = [
  {
    emoji: '🕋',
    title: 'Makkadan — to‘g‘ri eshigingizgacha',
    text: 'Original Makka po‘shti, ehrom va namoz anjomlari. Tez va ishonchli yetkazib beramiz.',
  },
  {
    emoji: '🛍',
    title: 'Bu qanday ishlaydi?',
    text: 'Tanlang, o‘lchamingizni belgilang va buyurtma bering. Qolganini biz qilamiz.',
  },
  {
    emoji: '🤝',
    title: '10 000+ mijoz biz bilan',
    text: 'Sifatga kafolat beramiz. Yoqmasa — almashtirib beramiz.',
  },
];

export default function Onboarding({ onFinish }) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const isLast = index === slides.length - 1;

  function next() {
    haptic('light');
    if (isLast) onFinish();
    else setIndex((i) => i + 1);
  }

  return (
    <div className="onboarding">
      <button className="onb-skip" onClick={onFinish}>
        O‘tkazib yuborish
      </button>

      <div className="onb-body">
        <div className="onb-visual">{slide.emoji}</div>
        <h1 className="onb-title">{slide.title}</h1>
        <p className="onb-text">{slide.text}</p>
      </div>

      <div className="onb-dots">
        {slides.map((_, i) => (
          <div key={i} className={`onb-dot ${i === index ? 'active' : ''}`} />
        ))}
      </div>

      <button className="btn btn-accent" onClick={next}>
        {isLast ? 'Boshlash' : 'Keyingisi'}
      </button>
    </div>
  );
}
