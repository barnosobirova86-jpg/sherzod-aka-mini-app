export const tg = window.Telegram?.WebApp;

export function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
  try {
    tg.setHeaderColor('#ffffff');
    tg.setBackgroundColor('#ffffff');
  } catch {
    /* eski versiyalarda mavjud emas */
  }
}

export function getTelegramUser() {
  return tg?.initDataUnsafe?.user || null;
}

export function haptic(type = 'light') {
  try {
    tg?.HapticFeedback?.impactOccurred(type);
  } catch {
    /* qo‘llab-quvvatlanmaydi */
  }
}

export function showAlert(message) {
  if (tg?.showAlert) tg.showAlert(message);
  else alert(message);
}

export function closeApp() {
  if (tg?.close) tg.close();
}

/**
 * Berilgan Telegram username bilan shaxsiy chatni ochadi
 */
export function openTelegramProfile(username) {
  const url = `https://t.me/${username}`;
  if (tg?.openTelegramLink) tg.openTelegramLink(url);
  else window.open(url, '_blank');
}

/**
 * Telegram‘dagi telefon raqamini so‘raydi.
 * Telegram bir martalik ruxsat oynasini ko‘rsatadi — mijoz tasdiqlasa,
 * raqam avtomatik keladi (qo‘lda yozish shart emas).
 * Qo‘llab-quvvatlanmasa yoki rad etilsa — null qaytadi.
 */
export function requestTelegramPhone() {
  return new Promise((resolve) => {
    if (!tg?.requestContact) return resolve(null);

    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      resolve(value);
    };

    // Mijoz oynani umuman yopmasa ham ilova qotib qolmasin
    setTimeout(() => finish(null), 60000);

    try {
      tg.requestContact((granted, response) => {
        if (!granted) return finish(null);
        const phone =
          response?.responseUnsafe?.contact?.phone_number ||
          response?.contact?.phone_number ||
          null;
        finish(phone ? String(phone) : 'shared');
      });
    } catch {
      finish(null);
    }
  });
}

/**
 * Lokatsiyani olish: avval Telegram LocationManager, keyin brauzer GPS
 */
export function requestLocation() {
  return new Promise((resolve, reject) => {
    const lm = tg?.LocationManager;

    if (lm?.init && lm?.getLocation) {
      lm.init(() => {
        if (!lm.isLocationAvailable) return browserLocation(resolve, reject);
        lm.getLocation((location) => {
          if (location) resolve({ latitude: location.latitude, longitude: location.longitude });
          else browserLocation(resolve, reject);
        });
      });
      return;
    }

    browserLocation(resolve, reject);
  });
}

function browserLocation(resolve, reject) {
  if (!navigator.geolocation) {
    return reject(new Error('Qurilmangiz lokatsiyani qo‘llab-quvvatlamaydi'));
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
    () => reject(new Error('Lokatsiyaga ruxsat berilmadi')),
    { enableHighAccuracy: true, timeout: 10000 }
  );
}
