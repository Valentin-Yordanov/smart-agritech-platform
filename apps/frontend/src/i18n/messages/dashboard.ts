import { defineMessages } from '@/i18n/config';

export const dashboard = defineMessages({
  'dash.welcome': ['Welcome back', 'Добре дошли отново'],
  'dash.welcomeName': ['Welcome back, {name}', 'Добре дошли отново, {name}'],
  'dash.intro': [
    'Scan crops with the {version} models ({classes} classes, {crops} crops) or consult the AI agronomist.',
    'Сканирайте култури с моделите {version} ({classes} класа, {crops} култури) или се консултирайте с ИИ агронома.',
  ],
  'dash.newScan': ['New Crop Scan', 'Ново сканиране'],

  'dash.stat.all': ['Scans on this device', 'Сканирания на това устройство'],
  'dash.stat.alerts': ['Pathogen alerts', 'Сигнали за патогени'],
  'dash.stat.healthy': ['Healthy results', 'Здрави резултати'],
  'dash.stat.uncertain': ['Retake requests', 'Заявки за нова снимка'],

  'dash.recent': ['Recent scans', 'Последни сканирания'],
  'dash.savedLocal': ['Saved in this browser only', 'Запазени само в този браузър'],
  'dash.clear': ['Clear', 'Изчисти'],
  'dash.noScans': ['No scans yet', 'Все още няма сканирания'],
  'dash.noMatch': ['No scans match this filter', 'Няма сканирания по този филтър'],
  'dash.noScansHint': [
    'Run a scan, or try one of the 1-click test specimens in the Scanner Studio.',
    'Направете сканиране или опитайте някоя от примерните снимки в Скенер студиото.',
  ],
  'dash.noMatchHint': ['Pick another card above to change the filter.', 'Изберете друга карта по-горе, за да смените филтъра.'],
  'dash.openStudio': ['Open Scanner Studio', 'Отвори Скенер студиото'],

  'dash.radar': ['Regional outbreak radar', 'Регионален радар за огнища'],
  'dash.radarUnavailable': ['Outbreak data is unavailable right now.', 'Данните за огнищата в момента не са достъпни.'],
  'dash.radarActive': ['active geotagged alerts across the network', 'активни сигнали с геолокация в мрежата'],
  'dash.radarTop': ['Most reported:', 'Най-често съобщавани:'],
  'dash.radarCrop': ['Crop', 'Култура'],
  'dash.radarAlert': ['alert', 'сигнал'],
  'dash.openMap': ['Open the map', 'Отвори картата'],

  'dash.mod.scan.title': ['AI Scanner', 'ИИ скенер'],
  'dash.mod.scan.text': [
    'Detect diseases, lesions and pests, online or offline.',
    'Откривайте болести, лезии и вредители, онлайн или офлайн.',
  ],
  'dash.mod.scan.cta': ['Open Studio', 'Отвори студиото'],
  'dash.mod.advisor.title': ['RAG Advisor'],
  'dash.mod.advisor.text': [
    'IPM recommendations grounded in verified agronomy guides.',
    'Препоръки за интегрирано управление на вредителите, базирани на проверени агрономически ръководства.',
  ],
  'dash.mod.advisor.cta': ['Start Consultation', 'Започни консултация'],
  'dash.mod.map.title': ['Outbreak Map', 'Карта на огнищата'],
  'dash.mod.map.text': [
    'Geospatial tracking of regional pathogen alerts.',
    'Географско проследяване на регионални сигнали за патогени.',
  ],
  'dash.mod.map.cta': ['View Radar', 'Виж радара'],
  'dash.mod.community.title': ['Community Hub', 'Общност'],
  'dash.mod.community.text': [
    'Exchange field reports and treatment strategies.',
    'Обменяйте полеви наблюдения и стратегии за третиране.',
  ],
  'dash.mod.community.cta': ['Browse Forum', 'Към форума'],
  'dash.mod.knowledge.title': ['Knowledge Base', 'База знания'],
  'dash.mod.knowledge.text': [
    'Symptom checklists and FRAC/IRAC rotations.',
    'Списъци със симптоми и ротации по FRAC/IRAC.',
  ],
  'dash.mod.knowledge.cta': ['Read Guides', 'Прочети ръководствата'],

  'dash.time.now': ['just now', 'току-що'],
  'dash.time.min': ['{n} min ago', 'преди {n} мин'],
  'dash.time.hour': ['{n} h ago', 'преди {n} ч'],
  'dash.time.day': ['{n} d ago', 'преди {n} дни'],
  'dash.mode.cloud': ['Cloud', 'Облак'],
  'dash.mode.offline': ['Offline', 'Офлайн'],
  'dash.discuss': ['Discuss this scan with the AI advisor', 'Обсъдете това сканиране с ИИ съветника'],
});
