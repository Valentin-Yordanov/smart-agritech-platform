import { defineMessages } from '@/i18n/config';

export const common = defineMessages({
  'lang.switchTo': ['Switch to Bulgarian', 'Превключи на английски'],

  'nav.overview': ['Overview', 'Табло'],
  'nav.scanner': ['AI Scanner', 'ИИ скенер'],
  'nav.advisor': ['Advisor', 'Съветник'],
  'nav.outbreaks': ['Outbreaks', 'Огнища'],
  'nav.community': ['Community', 'Общност'],
  'nav.knowledge': ['Knowledge Base', 'База знания'],
  'nav.toggleMenu': ['Toggle navigation menu', 'Отвори или затвори менюто'],
  'nav.logout': ['Logout', 'Изход'],
  'nav.signIn': ['Sign In', 'Вход'],
  'nav.register': ['Register', 'Регистрация'],

  'footer.tagline': [
    'Photo-based crop disease diagnosis, agronomy advice and regional outbreak tracking for growers.',
    'Диагностика на болести по културите по снимка, агрономически съвети и проследяване на регионални огнища за земеделци.',
  ],
  'footer.platform': ['Platform', 'Платформа'],
  'footer.advisor': ['Agronomy Advisor', 'Агрономически съветник'],
  'footer.outbreakMap': ['Outbreak Map', 'Карта на огнищата'],
  'footer.encyclopedia': ['Crop Encyclopedia', 'Енциклопедия на културите'],
  'footer.architecture': ['Architecture & Models'],
  'footer.modelLine': [
    '{detector} detector + {classifier} classifier ({version})'],
  'footer.cropsClasses': ['{crops} crops · {classes} classes', '{crops} култури · {classes} класа'],
  'footer.offlineWasm': ['Offline WASM mode in the browser'],
  'footer.certaintyNote': [
    'Answers below {percent}% certainty ask for a new photo.',
    'При сигурност под {percent}% системата ще поиска нова снимка.',
  ],
  'footer.dataCredits': ['Data & Credits', 'Данни и източници'],
  'footer.dataCreditsBody': [
    'Trained on openly licensed datasets (CC BY, CC0, MIT). Full attribution:',
    'Обучен върху набори от данни с отворен лиценз (CC BY, CC0, MIT). Пълни авторства:',
  ],
  'footer.copyright': [
    '© Smart AgriTech · Model release {version}',
    '© Smart AgriTech · Версия на модела {version}',
  ],
  'footer.disclaimer': [
    "AI results support, but do not replace, an agronomist's field inspection.",
    'Резултатите от ИИ подпомагат, но не заместват огледа на място от агроном.',
  ],

  'status.online': ['Cloud pipeline reachable'],
  'status.offline': ['Offline: browser WASM mode'],
  'status.model': [
    '{detector} + {classifier} {version} · {classes} classes'],
  'status.certaintyGate': ['Certainty gate {percent}%'],
  'status.dataCredits': ['Data credits', 'Източници на данни'],

  'common.loading': ['Loading…', 'Зареждане…'],
  'common.cancel': ['Cancel', 'Отказ'],
  'common.save': ['Save', 'Запази'],
  'common.delete': ['Delete', 'Изтрий'],
  'common.retry': ['Try again', 'Опитай отново'],
  'common.back': ['Back', 'Назад'],
  'common.unknown': ['Unknown', 'Неизвестно'],
  'common.anonymous': ['Anonymous', 'Анонимен'],
  'common.errorGeneric': ['Something went wrong. Please try again.', 'Нещо се обърка. Опитайте отново.'],
});
