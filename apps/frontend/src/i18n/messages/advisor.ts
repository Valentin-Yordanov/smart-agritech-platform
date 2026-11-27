import { defineMessages } from '@/i18n/config';

export const advisor = defineMessages({
  'advisor.title': ['RAG Agronomic Advisor'],
  'advisor.subtitle': [
    'ChromaDB Knowledge Retrieval + GPT-OSS-120B Clinical Advisory'],
  'advisor.newConsultation': ['New Consultation', 'Нова консултация'],
  'advisor.noThreads': [
    'No past consultations yet. Start a new chat or select a quick prompt.',
    'Все още няма минали консултации. Започнете нов чат или изберете бърз въпрос.',
  ],
  'advisor.deleteThread': ['Delete consultation', 'Изтрий консултацията'],
  'advisor.threadTitle': ['Agronomy Consultation {date}', 'Агрономическа консултация {date}'],
  'advisor.inquiryTitle': ['Agronomy Inquiry', 'Агрономически въпрос'],

  'advisor.q1': ['Organic & biological treatment options?', 'Какви са органичните и биологичните методи за третиране?'],
  'advisor.q2': ['How do I prevent spread to neighboring crops?', 'Как да предотвратя разпространението към съседни култури?'],
  'advisor.q3': ['Safe pre-harvest interval & chemical rotation?', 'Какви са безопасният карантинен срок преди прибиране и ротацията на препаратите?'],

  'advisor.emptyTitle': ['Ask the Senior AI Agronomist', 'Попитайте старшия ИИ агроном'],
  'advisor.emptyText': [
    'Get evidence-based treatment plans, organic biocontrols, FRAC rotations, and pre-harvest intervals grounded in verified guides.',
    'Получете обосновани планове за третиране, органичен биоконтрол, ротации по FRAC и карантинни срокове, базирани на проверени ръководства.',
  ],
  'advisor.sources': ['Sources:', 'Източници:'],
  'advisor.consulting': ['Consulting agronomic knowledge base...', 'Търсене в агрономическата база знания...'],
  'advisor.placeholder': [
    'Ask about organic treatments, fungicide rotation, or symptoms (Enter to send, Shift+Enter for newline)...',
    'Питайте за органични третирания, ротация на фунгициди или симптоми (Enter за изпращане, Shift+Enter за нов ред)...',
  ],
  'advisor.contextActive': [
    'Linked vision scan context active for targeted IPM guidance',
    'Свързаното сканиране е активно за по-прицелени съвети за интегрирана защита',
  ],
  'advisor.confidence': ['{percent}% Confidence'],
  'advisor.clearContext': ['Clear diagnosis context', 'Премахни контекста на диагнозата'],
  'advisor.altCrop': ['Scanned crop specimen', 'Сканиран образец от култура'],
  'advisor.toggleSidebar': ['Toggle consultations', 'Покажи или скрий консултациите'],

  'advisor.err.threads': ['Failed to load chat threads', 'Чатовете не можаха да се заредят'],
  'advisor.err.context': ['Could not load linked diagnosis context', 'Свързаната диагноза не можа да се зареди'],
  'advisor.err.history': ['Failed to load conversation history', 'Историята на разговора не можа да се зареди'],
  'advisor.err.createThread': ['Could not create thread', 'Разговорът не можа да бъде създаден'],
  'advisor.err.delete': ['Failed to delete consultation', 'Консултацията не можа да бъде изтрита'],
  'advisor.err.reach': ['Failed to reach AI Agronomic Advisor', 'ИИ агрономическият съветник не е достъпен'],
  'advisor.deleted': ['Consultation deleted', 'Консултацията е изтрита'],
});
