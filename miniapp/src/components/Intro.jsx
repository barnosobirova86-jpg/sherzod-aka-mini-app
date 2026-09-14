import { useEffect, useRef } from 'react';
import { resolveImage } from '../api.js';

// Ba'zi telefonlarda (ayniqsa Android) .MOV formatini ochib bo'lmasligi
// mumkin — shunday holatda ilova "qotib qolgandek" ko'rinmasligi uchun
// video ishlamasa yoki uzoq yuklanib qolsa, ilovaga avtomatik o'tkazamiz.
const FALLBACK_MS = 6000;

export default function Intro({ onFinish }) {
  const videoRef = useRef(null);
  const doneRef = useRef(false);

  function finish() {
    if (doneRef.current) return;
    doneRef.current = true;
    onFinish();
  }

  useEffect(() => {
    const timer = setTimeout(finish, FALLBACK_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="intro" onClick={finish}>
      <video
        ref={videoRef}
        className="intro-video"
        src={resolveImage('/uploads/IMG_2727.MOV')}
        autoPlay
        muted
        playsInline
        onEnded={finish}
        onError={finish}
      />
    </div>
  );
}
