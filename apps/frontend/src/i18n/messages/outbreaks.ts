import { defineMessages } from '@/i18n/config';

export const outbreaks = defineMessages({
  'out.title': ['Epidemiological Outbreak Radar', 'Епидемиологичен радар за огнища'],
  'out.subtitle': [
    'Live PostGIS geospatial monitoring of geotagged crop pathology detections across Bulgaria',
    'Наблюдение на живо с PostGIS на засечени болести по културите с геолокация в България',
  ],
  'out.refresh': ['Refresh Radar', 'Обнови радара'],
  'out.filterPlaceholder': [
    'Filter pins by crop species or disease (e.g., Tomato, Late Blight)...',
    'Филтрирайте маркерите по култура или болест (напр. домат, късен пригор)...',
  ],
  'out.alertsOnlyOn': ['Showing Pathogen Alerts Only', 'Показват се само сигнали за патогени'],
  'out.alertsOnlyOff': ['Active Pathogen Alerts Only', 'Само активни сигнали за патогени'],
  'out.clearFilters': ['Clear Filters', 'Изчисти филтрите'],
  'out.loadFailed': ['Failed to load geospatial outbreak radar', 'Радарът за огнища не можа да се зареди'],

  'out.telemetry': ['Regional Telemetry', 'Регионална статистика'],
  'out.telemetryHint': ['Aggregated from geotagged field scans', 'Обобщено от сканирания с геолокация'],
  'out.geoScans': ['Geotagged Scans', 'Сканирания с геолокация'],
  'out.activeAlerts': ['Active Alerts', 'Активни сигнали'],
  'out.topThreats': ['Top Regional Threats', 'Най-големи регионални заплахи'],
  'out.noThreats': [
    'No active pathogen outbreaks recorded yet. Geotag a scan in the AI Scanner Studio to populate the radar.',
    'Все още няма регистрирани активни огнища. Добавете геолокация към сканиране в ИИ скенера, за да се попълни радарът.',
  ],
  'out.scanGeotag': ['Scan & Geotag a Specimen', 'Сканирайте и геомаркирайте образец'],
  'out.caseOne': ['{count} case', '{count} случай'],
  'out.caseMany': ['{count} cases', '{count} случая'],

  'out.legend': ['Marker Legend', 'Легенда на маркерите'],
  'out.legendConfirmed': ['Confirmed Pathogen (≥ 70% confidence)', 'Потвърден патоген (сигурност ≥ 70%)'],
  'out.legendLow': ['Low-Confidence Alert (< 70% confidence)', 'Сигнал с ниска сигурност (сигурност < 70%)'],
  'out.legendHealthy': ['Healthy Baseline Check', 'Контролна проверка на здрави растения'],

  'out.unknownCrop': ['Unknown Crop', 'Неизвестна култура'],
  'out.pathologyAlert': ['Pathology Alert', 'Сигнал за болест'],

  'map.healthy': ['Healthy Baseline', 'Здрави растения'],
  'map.low': ['Low-Confidence Alert', 'Сигнал с ниска сигурност'],
  'map.confirmed': ['Confirmed Pathogen', 'Потвърден патоген'],
  'map.detected': ['Detected:', 'Засечено:'],
  'map.consult': ['Consult AI Agronomist →', 'Консултация с ИИ агронома →'],
});
