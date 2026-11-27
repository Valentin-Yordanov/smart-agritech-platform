import { defineMessages } from '@/i18n/config';

export const landing = defineMessages({
  'landing.badge': ['Model release {version} · {crops} crops', 'Версия на модела {version} · {crops} култури'],
  'landing.heroTitle': ['Diagnose crop disease from a single photo', 'Диагностицирайте болест по културите от една снимка'],
  'landing.heroText': [
    'Point a phone at a leaf, fruit or ear. Smart AgriTech finds it, names the condition, refuses to guess when unsure, and links you to treatment advice and regional outbreak alerts.',
    'Насочете телефона към лист, плод или клас. Smart AgriTech го намира, определя състоянието, не налучква, когато не е сигурен, и ви насочва към съвети за третиране и регионални предупреждения за огнища.',
  ],
  'landing.goDashboard': ['Go to Dashboard', 'Към таблото'],
  'landing.launchScanner': ['Launch AI Scanner', 'Стартирай ИИ скенера'],
  'landing.login': ['Login', 'Вход'],
  'landing.register': ['Register', 'Регистрация'],
  'landing.browseKnowledge': ['Browse Knowledge Base', 'Разгледай базата знания'],

  'landing.stat.crops': ['crops covered', 'обхванати култури'],
  'landing.stat.classes': ['disease & health classes', 'класа болести и здраве'],
  'landing.stat.gate': ['certainty gate'],
  'landing.stat.offline': ['in-browser WASM mode', 'WASM режим в браузъра'],
  'landing.stat.offlineValue': ['Offline', 'Офлайн'],

  'landing.pipelineEyebrow': ['Live pipeline preview'],
  'landing.pipelineTitle': ['How dual-stage AI works', 'Как работи двуетапният ИИ'],
  'landing.pipelineText': [
    'Step through what happens to a photo, using real numbers from the deployed models.',
    'Проследете какво се случва със снимката, с реални стойности от внедрените модели.',
  ],
  'landing.coverageEyebrow': ['Crop coverage explorer', 'Обхванати култури'],
  'landing.coverageTitle': ['{classes} classes the model can recognise', '{classes} класа, които моделът разпознава'],
  'landing.coverageText': [
    "Loaded live from the deployed model's class list. Filter by crop group or search for a disease.",
    'Зарежда се директно от списъка с класове на внедрения модел. Филтрирайте по група култури или търсете болест.',
  ],

  'landing.feature.inferenceTitle': ['Dual-stage ONNX inference'],
  'landing.feature.inferenceText': [
    '{detector} locates leaves, fruit, ears and pests, then {classifier} names the condition, with an in-browser fallback for fields without signal.',
    '{detector} открива листа, плодове, класове и вредители, а {classifier} определя състоянието. Има и резервен режим в браузъра за полета без сигнал.',
  ],
  'landing.feature.ragTitle': ['Diagnosis-linked RAG advisor'],
  'landing.feature.ragText': [
    'Turn any scan into an agronomy consultation grounded in verified guides and FRAC/IRAC rotation rules.',
    'Превърнете всяко сканиране в агрономическа консултация, базирана на проверени ръководства и правилата за ротация по FRAC/IRAC.',
  ],
  'landing.feature.mapTitle': ['PostGIS outbreak radar'],
  'landing.feature.mapText': [
    'Geotagged detections build a regional map, so growers see active threats before they reach their fields.',
    'Засичанията с геолокация изграждат регионална карта, така че земеделците виждат активните заплахи, преди да стигнат до нивите им.',
  ],

  'pipeline.sampleAlt': [
    'Banana leaf with Sigatoka used in the pipeline demo',
    'Банановен лист със сигатока, използван в демонстрацията на конвейера',
  ],
  'pipeline.diagnosis': ['Diagnosis', 'Диагноза'],
  'pipeline.passes': [
    'Passes the {percent}% certainty gate · total {ms} ms',
    'Преминава прага на сигурност от {percent}% · общо {ms} мс',
  ],
  'pipeline.step1.title': ['Capture', 'Снимане'],
  'pipeline.step1.summary': ['Photo from phone camera or upload', 'Снимка от камерата на телефона или качване'],
  'pipeline.step1.detail': [
    'The image goes straight to object storage through a presigned URL. Without a connection, the classifier runs in the browser with WebAssembly instead.',
    'Снимката отива директно в обектното хранилище през подписан адрес. Без връзка класификаторът работи в браузъра чрез WebAssembly.',
  ],
  'pipeline.step2.title': ['Locate', 'Откриване'],
  'pipeline.step2.summary': ['{detector} finds {classes}', '{detector} открива: {classes}'],
  'pipeline.step2.detail': [
    'The detector draws a box around each leaf, fruit, ear or pest. Here it found one leaf filling the frame at {percent}% in {ms} ms.',
    'Детекторът очертава рамка около всеки лист, плод, клас или вредител. Тук той намира един лист, който заема целия кадър, със сигурност {percent}% за {ms} мс.',
  ],
  'pipeline.step3.title': ['Classify', 'Класификация'],
  'pipeline.step3.summary': ['{classifier} picks 1 of {classes} classes', '{classifier} избира 1 от {classes} класа'],
  'pipeline.step3.detail': [
    'Each region (up to 8) and the full image are classified into crop, plant part and condition. Result: {species} {disease} in {ms} ms.',
    'Всяка област (до 8) и цялата снимка се класифицират по култура, част от растението и състояние. Резултат: {species} {disease} за {ms} мс.',
  ],
  'pipeline.step4.title': ['Certainty gate'],
  'pipeline.step4.summary': ['Below {percent}% → “retake photo”'],
  'pipeline.step4.detail': [
    'Answers under {percent}% certainty, or the “unknown” class, are never shown as a diagnosis. The user is asked for a closer, clearer photo instead.',
    'Отговори със сигурност под {percent}% или класът „неизвестно“ никога не се показват като диагноза. Вместо това потребителят получава молба за по-близка и ясна снимка.',
  ],
  'pipeline.step5.title': ['Advise', 'Съвет'],
  'pipeline.step5.summary': ['RAG agronomist explains treatment', 'RAG агрономът обяснява третирането'],
  'pipeline.step5.detail': [
    'The diagnosis links to the advisor, which answers from verified agronomy guides and FRAC/IRAC rotation rules.',
    'Диагнозата води към съветника, който отговаря на база проверени агрономически ръководства и правилата за ротация по FRAC/IRAC.',
  ],
  'pipeline.previous': ['Previous step', 'Предишна стъпка'],
  'pipeline.next': ['Next step', 'Следваща стъпка'],
  'pipeline.pause': ['Pause', 'Пауза'],
  'pipeline.play': ['Play', 'Пусни'],
  'pipeline.trySample': ['Try it on a sample →', 'Изпробвайте с примерна снимка →'],
  'pipeline.footnote': [
    'Real output of the deployed v2 models on this sample image, recorded on a laptop CPU.',
    'Реален резултат от внедрените модели v2 за тази примерна снимка, записан на процесор на лаптоп.',
  ],
  'pipeline.leafLabel': ['leaf', 'лист'],

  'coverage.all': ['All crops', 'Всички култури'],
  'coverage.cat.orchard': ['Orchard & Plantation', 'Овощни и трайни насаждения'],
  'coverage.cat.orchard.desc': [
    'Tree fruit, nuts, vines and plantation crops',
    'Овощни дървета, черупкови плодове, лозя и плантационни култури',
  ],
  'coverage.cat.field': ['Field Crops', 'Полски култури'],
  'coverage.cat.field.desc': [
    'Cereals, pulses, oilseeds, roots and fibre',
    'Зърнени, бобови, маслодайни, кореноплодни и влакнодайни',
  ],
  'coverage.cat.greenhouse': ['Greenhouse Produce', 'Оранжерийна продукция'],
  'coverage.cat.greenhouse.desc': ['Vegetables, gourds and berries', 'Зеленчуци, тиквови и ягодоплодни'],
  'coverage.cat.pests': ['Pests', 'Вредители'],
  'coverage.cat.pests.desc': [
    'Insect and mite damage the model recognises',
    'Повреди от насекоми и акари, които моделът разпознава',
  ],
  'coverage.search': ['Search crop or disease…', 'Търсене на култура или болест…'],
  'coverage.searchLabel': ['Search supported crops and conditions', 'Търсене в поддържаните култури и състояния'],
  'coverage.clearSearch': ['Clear search', 'Изчисти търсенето'],
  'coverage.loadFailed': ['Could not load the model class list.', 'Списъкът с класове на модела не можа да се зареди.'],
  'coverage.noMatch': ['No supported crop matches “{query}”.', 'Няма поддържана култура, съвпадаща с „{query}“.'],
  'coverage.summary': ['{count} classes across {parts}', '{count} класа за: {parts}'],
  'coverage.summaryPests': ['{count} pest classes across {parts}', '{count} класа вредители за: {parts}'],
});
