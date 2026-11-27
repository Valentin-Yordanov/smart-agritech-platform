import { defineMessages } from '@/i18n/config';

export const scan = defineMessages({
  'common.healthy': ['Healthy', 'Здрав'],
  'result.uncertain': ['Uncertain – retake photo', 'Несигурен резултат — направете нова снимка'],

  'scan.title': ['AI Plant Scanner Studio', 'ИИ скенер за растения'],
  'scan.subtitle': [
    'Dual-stage {detector} + {classifier} diagnostics across {crops} crops, with offline WASM fallback',
    'Двуетапна диагностика с {detector} + {classifier} за {crops} култури, с офлайн WASM резервен режим',
  ],
  'scan.modeOffline': ['Offline Field Mode'],
  'scan.modeAuto': ['(Auto)'],
  'scan.modeActive': ['(Active)'],
  'scan.modeCloud': ['Cloud Dual-Stage Mode'],

  'scan.capture': ['Specimen Capture', 'Снимане на образец'],
  'scan.captureHint': [
    'Upload a high-resolution crop photo (leaves, stems, fruits, or pests; JPEG, PNG, WebP up to 10MB)',
    'Качете снимка с висока резолюция (листа, стъбла, плодове или вредители; JPEG, PNG, WebP до 10 MB)',
  ],
  'scan.dropAria': ['Upload or capture a crop photo', 'Качете или направете снимка на културата'],
  'scan.dropRelease': ['Release to load this specimen', 'Пуснете, за да заредите образеца'],
  'scan.dropIdle': ['Drop crop image here or click to browse', 'Пуснете снимка тук или кликнете, за да изберете'],
  'scan.dropSupports': [
    'Supports mobile camera capture & desktop drag-and-drop',
    'Поддържа снимане с камера на телефона и влачене на файлове на компютър',
  ],
  'scan.cameraReady': ['Camera Ready', 'Камерата е готова'],

  'scan.samplesTitle': ['No photo handy? Load a test specimen', 'Нямате снимка? Заредете примерен образец'],
  'scan.sample.banana': ['Banana leaf', 'Банановен лист'],
  'scan.sample.bananaHint': ['Sigatoka', 'Сигатока'],
  'scan.sample.maize': ['Maize leaf', 'Лист от царевица'],
  'scan.sample.maizeHint': ['Streak virus', 'Вирус на ивичестостта'],
  'scan.sample.apple': ['Apple leaf', 'Ябълков лист'],
  'scan.sample.appleHint': ['Alternaria', 'Алтернариоза'],
  'scan.sample.brick': ['Not a plant', 'Не е растение'],
  'scan.sample.brickHint': ['Tests the uncertain fallback', 'Проверява режима „несигурен резултат“'],

  'scan.geoTitle': ['Geotag Outbreak Map', 'Геомаркиране за картата на огнищата'],
  'scan.geoHint': ['Attach GPS coordinates to PostGIS radar', 'Добавете GPS координати към PostGIS радара'],
  'scan.geoAttached': ['Attached', 'Добавени'],
  'scan.geoAttach': ['Attach GPS', 'Добави GPS'],
  'scan.geoUnsupported': ['Geolocation is not supported by this browser.', 'Този браузър не поддържа геолокация.'],
  'scan.geoSuccess': ['GPS coordinates attached for outbreak mapping', 'GPS координатите са добавени за картата на огнищата'],
  'scan.geoFailed': ['Location unavailable: {message}', 'Местоположението не е достъпно: {message}'],

  'scan.runEdge': ['Run Edge WASM Scan'],
  'scan.runCloud': ['Run Cloud Diagnosis', 'Стартирай облачна диагностика'],
  'scan.resetTitle': ['Reset specimen', 'Изчисти образеца'],

  'scan.pipelineActive': ['Inference Pipeline Active', 'Анализът е в ход'],
  'scan.runningOffline': [
    'Running {classifier} ONNX directly in browser WASM...'],
  'scan.step.upload': ['1. Uploading to Edge Storage', '1. Качване в хранилището'],
  'scan.step.localize': ['2. Localizing Specimen & Pests via {detector}'],
  'scan.step.classify': ['3. Classifying Condition via {classifier}'],

  'scan.viewport': ['Diagnostic Viewport & Telemetry'],
  'scan.viewportHint': [
    'Bounding box localization and pathogen confidence scoring',
    'Очертаване на засечените обекти и оценка на сигурността за патогена',
  ],
  'scan.badgeCloud': ['Cloud Dual-Stage ONNX'],
  'scan.badgeOffline': ['Browser WASM Offline'],
  'scan.noSpecimen': ['No specimen loaded', 'Няма зареден образец'],
  'scan.noSpecimenHint': [
    'Upload a photo or pick a test specimen on the left',
    'Качете снимка или изберете примерен образец отляво',
  ],
  'scan.specimen': ['Specimen', 'Образец'],
  'scan.altImage': ['Scanned plant specimen', 'Сканиран образец на растение'],

  'scan.detected': ['Detected Crop & Condition', 'Разпозната култура и състояние'],
  'scan.badgeHealthy': ['Healthy', 'Здрав'],
  'scan.badgeAlert': ['Pathogen Alert', 'Сигнал за патоген'],
  'scan.consult': ['Consult AI Agronomist about this scan', 'Консултирайте се с ИИ агронома за това сканиране'],
  'scan.consultNeedsCloud': [
    'Cloud diagnosis required for RAG consultation',
    'За RAG консултация е нужна облачна диагностика',
  ],
  'scan.consultNeedsCloudHint': [
    'RAG Agronomic Advisor requires an online cloud diagnosis ID. Reconnect and run Cloud Diagnosis to link this scan.',
    'RAG агрономическият съветник изисква идентификатор от онлайн облачна диагностика. Възстановете връзката и стартирайте облачна диагностика, за да свържете това сканиране.',
  ],

  'scan.toast.unsupported': [
    'Unsupported file format. Please upload JPEG, PNG, or WebP.',
    'Неподдържан формат. Моля, качете JPEG, PNG или WebP.',
  ],
  'scan.toast.tooLarge': [
    'Image exceeds 10MB limit. Please select a smaller file.',
    'Снимката надвишава ограничението от 10 MB. Изберете по-малък файл.',
  ],
  'scan.toast.sampleMissing': ['Sample not found ({status})', 'Примерът не е намерен ({status})'],
  'scan.toast.sampleFailed': ['Could not load sample', 'Примерът не можа да се зареди'],
  'scan.toast.noFile': [
    'Please upload or capture a crop or plant image first.',
    'Първо качете или снимайте култура или растение.',
  ],
  'scan.toast.cloudFailed': ['Cloud AI inference failed', 'Облачният ИИ анализ е неуспешен'],
  'scan.toast.cloudDone': ['Dual-stage ONNX diagnosis completed', 'Двуетапната ONNX диагностика е завършена'],
  'scan.toast.offlineDone': ['Offline WASM classification complete', 'Офлайн WASM класификацията е завършена'],
  'scan.toast.offlineFailed': ['Offline WASM inference failed', 'Офлайн WASM анализът е неуспешен'],
  'scan.toast.storageFailed': ['Storage upload failed ({status})', 'Качването в хранилището е неуспешно ({status})'],
  'scan.toast.noId': ['Backend did not return a diagnosis ID', 'Сървърът не върна идентификатор на диагнозата'],
  'scan.toast.pipelineFailed': ['Scan pipeline failed', 'Сканирането е неуспешно'],
  'scan.unknownSpecies': ['Unknown Species', 'Неизвестна култура'],
  'scan.unknownCondition': ['Unknown Condition', 'Неизвестно състояние'],

  'conf.label': ['Model confidence'],
  'conf.gate': ['gate {percent}%'],
  'conf.below': ['Below certainty gate', 'Под прага на сигурност'],
  'conf.belowText': [
    "The model's best guess is under {percent}%, so no diagnosis is shown.",
    'Най-добрата преценка на модела е под {percent}%, затова не се показва диагноза.',
  ],
  'conf.high': ['High certainty', 'Висока сигурност'],
  'conf.highText': [
    'Strong match. Still compare the symptoms with the knowledge base guide before spraying.',
    'Силно съвпадение. Все пак сравнете симптомите с ръководството в базата знания, преди да пръскате.',
  ],
  'conf.moderate': ['Moderate certainty', 'Умерена сигурност'],
  'conf.moderateText': [
    'Passed the gate, but confirm with the symptom checklist or a second photo from another angle.',
    'Премина прага, но потвърдете със списъка със симптоми или с втора снимка от друг ъгъл.',
  ],

  'uncertain.eyebrow': ['Uncertain – retake photo', 'Несигурен резултат — направете нова снимка'],
  'uncertain.title': [
    "The model isn't sure enough to diagnose this",
    'Моделът не е достатъчно сигурен, за да постави диагноза',
  ],
  'uncertain.text': [
    'This is a safety feature, not an error. It happens when the photo is not a supported crop, or the plant part is too small, blurry or mixed with other objects. A clearer photo usually fixes it.',
    'Това е защитен механизъм, а не грешка. Случва се, когато снимката не е на поддържана култура или частта от растението е твърде малка, размазана или смесена с други предмети. Обикновено по-ясна снимка решава проблема.',
  ],
  'uncertain.tip1.title': ['One subject', 'Един обект'],
  'uncertain.tip1.text': [
    'Fill the frame with a single leaf, fruit or ear.',
    'Заемете целия кадър с един лист, плод или клас.',
  ],
  'uncertain.tip2.title': ['Even daylight', 'Равномерна дневна светлина'],
  'uncertain.tip2.text': [
    'Avoid harsh shadows, flash glare and dusk light.',
    'Избягвайте резки сенки, отблясъци от светкавица и здрач.',
  ],
  'uncertain.tip3.title': ['Sharp focus', 'Ясен фокус'],
  'uncertain.tip3.text': [
    'Tap to focus on the lesion and hold still.',
    'Докоснете екрана, за да фокусирате върху лезията, и дръжте телефона неподвижно.',
  ],
  'uncertain.tip4.title': ['Plain background', 'Неутрален фон'],
  'uncertain.tip4.text': [
    'Hold the leaf against soil, a hand or paper.',
    'Дръжте листа пред почва, длан или лист хартия.',
  ],
  'uncertain.retake': ['Retake photo', 'Нова снимка'],
  'uncertain.startOver': ['Start over', 'Започни отначало'],
});
