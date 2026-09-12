import { haptic, openTelegramProfile } from '../telegram.js';

// Diqqat: username shu yerda, ko'rinadigan matnda emas
const ADMIN_USERNAME = 'ArtSherzod';

export default function ContactButton() {
  function handleClick() {
    haptic('medium');
    openTelegramProfile(ADMIN_USERNAME);
  }

  return (
    <button className="contact-btn" onClick={handleClick}>
      ART XIZMATIMIZ UCHUN MUROJAT QILING
    </button>
  );
}
