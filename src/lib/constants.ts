export const POPULAR_COUNTRIES = [
  { id: '12', name: 'USA (Virtual)', short: 'USA', flagUrl: 'https://flagcdn.com/w40/us.png', flag: '🇺🇸' },
  { id: '36', name: 'Canada', short: 'CAN', flagUrl: 'https://flagcdn.com/w40/ca.png', flag: '🇨🇦' },
  { id: '187', name: 'USA (Physical)', short: 'USA', flagUrl: 'https://flagcdn.com/w40/us.png', flag: '🇺🇸' },
  { id: '16', name: 'United Kingdom', short: 'GBR', flagUrl: 'https://flagcdn.com/w40/gb.png', flag: '🇬🇧' },
  { id: '33', name: 'Colombia', short: 'COL', flagUrl: 'https://flagcdn.com/w40/co.png', flag: '🇨🇴' },
  { id: '43', name: 'Germany', short: 'DEU', flagUrl: 'https://flagcdn.com/w40/de.png', flag: '🇩🇪' },
  { id: '78', name: 'France', short: 'FRA', flagUrl: 'https://flagcdn.com/w40/fr.png', flag: '🇫🇷' },
  { id: '22', name: 'India', short: 'IND', flagUrl: 'https://flagcdn.com/w40/in.png', flag: '🇮🇳' },
];

export const POPULAR_SERVICES = [
  { code: 'gv', name: 'Google Voice', logo: 'https://img.icons8.com/color/96/google-voice.png' },
  { code: 'go', name: 'Google', logo: 'https://img.icons8.com/color/96/google-logo.png' },
  { code: 'gmail', name: 'Gmail', logo: 'https://img.icons8.com/color/96/gmail-new.png' },
  { code: 'wa', name: 'WhatsApp', logo: 'https://img.icons8.com/color/96/whatsapp--v1.png' },
  { code: 'tg', name: 'Telegram', logo: 'https://img.icons8.com/color/96/telegram-app.png' },
  { code: 'ig', name: 'Instagram', logo: 'https://img.icons8.com/color/96/instagram-new--v1.png' },
  { code: 'fb', name: 'Facebook', logo: 'https://img.icons8.com/color/96/facebook-new.png' }
];

export const getCountry = (id: string) => POPULAR_COUNTRIES.find(c => c.id === id) || { id, name: id, short: id, flagUrl: '', flag: '🏳️' };
export const getService = (code: string) => POPULAR_SERVICES.find(s => s.code === code) || { code, name: code, logo: 'https://img.icons8.com/color/96/phone.png' };
