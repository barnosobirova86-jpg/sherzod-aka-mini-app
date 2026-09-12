import { useRef } from 'react';
import { resolveImage } from '../api.js';

export default function Intro({ onFinish }) {
  const videoRef = useRef(null);

  return (
    <div className="intro" onClick={onFinish}>
      <video
        ref={videoRef}
        className="intro-video"
        src={resolveImage('/uploads/IMG_2727.MOV')}
        autoPlay
        muted
        playsInline
        onEnded={onFinish}
      />
    </div>
  );
}
