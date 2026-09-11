import { useState } from 'react';
import { haptic } from '../telegram.js';

const stories = [
  { id: 1, emoji: '🕋', label: 'Yangi', text: 'Makkadan yangi po‘shtlar keldi! Chegirma 15% gacha.' },
  { id: 2, emoji: '🔥', label: 'Chegirma', text: 'Hafta oxirigacha barcha ehromlarga 20% chegirma.' },
  { id: 3, emoji: '🚚', label: 'Yetkazish', text: 'Toshkent bo‘ylab 1 kunda, viloyatlarga 2-3 kunda yetkazamiz.' },
  { id: 4, emoji: '✅', label: 'Kafolat', text: 'O‘lcham to‘g‘ri kelmasa — bepul almashtiramiz.' },
  { id: 5, emoji: '🎁', label: 'Sovg‘a', text: '500 000 so‘mdan yuqori xaridga tasbeh sovg‘a.' },
];

export default function Stories() {
  const [seen, setSeen] = useState([]);
  const [active, setActive] = useState(null);

  function open(story) {
    haptic('light');
    setActive(story);
    setSeen((prev) => (prev.includes(story.id) ? prev : [...prev, story.id]));
  }

  return (
    <>
      <div className="stories">
        {stories.map((story) => (
          <button key={story.id} className="story" onClick={() => open(story)}>
            <div className={`story-ring ${seen.includes(story.id) ? 'seen' : ''}`}>
              <div className="story-inner">{story.emoji}</div>
            </div>
            <span className="story-label">{story.label}</span>
          </button>
        ))}
      </div>

      {active && (
        <>
          <div className="sheet-backdrop" onClick={() => setActive(null)} />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="sheet-scroll" style={{ textAlign: 'center', paddingBottom: 24 }}>
              <div style={{ fontSize: 54, margin: '18px 0 6px' }}>{active.emoji}</div>
              <h2 style={{ marginTop: 4 }}>{active.label}</h2>
              <p className="subtitle">{active.text}</p>
            </div>
            <div className="sheet-footer">
              <button className="btn btn-soft" onClick={() => setActive(null)}>
                Yopish
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
