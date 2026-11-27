import { defineMessages } from '@/i18n/config';

export const community = defineMessages({
  'role.USER': ['USER', 'ПОТРЕБИТЕЛ'],
  'role.EXPERT': ['EXPERT', 'ЕКСПЕРТ'],
  'role.ADMIN': ['ADMIN', 'АДМИНИСТРАТОР'],

  'com.title': ['Agronomist Community Hub', 'Общност на агрономите'],
  'com.subtitle': [
    'Share field observations, compare pathology findings, and crowdsource IPM strategies ({total} discussions)',
    'Споделяйте полеви наблюдения, сравнявайте находки за болести и събирайте стратегии за интегрирана защита ({total} дискусии)',
  ],
  'com.newDiscussion': ['New Discussion', 'Нова дискусия'],
  'com.signInToStart': ['Sign in to start a new discussion', 'Влезте, за да започнете нова дискусия'],
  'com.signInToStartShort': ['Please sign in to start a discussion.', 'Моля, влезте, за да започнете дискусия.'],
  'com.searchPlaceholder': [
    'Search field reports by crop, disease, or keyword...',
    'Търсене на полеви доклади по култура, болест или ключова дума...',
  ],
  'com.noneFound': ['No discussions found', 'Не са намерени дискусии'],
  'com.noMatch': [
    'No posts matched "{query}". Try a broader keyword.',
    'Няма публикации, съвпадащи с „{query}“. Опитайте с по-обща ключова дума.',
  ],
  'com.beFirst': [
    'Be the first grower or agronomist to share a field report.',
    'Бъдете първият земеделец или агроном, който споделя полеви доклад.',
  ],
  'com.clearSearch': ['Clear Search', 'Изчисти търсенето'],
  'com.startFirst': ['Start First Discussion', 'Започнете първата дискусия'],
  'com.commentOne': ['{count} comment', '{count} коментар'],
  'com.commentMany': ['{count} comments', '{count} коментара'],
  'com.page': ['Page {page} of {total}', 'Страница {page} от {total}'],
  'com.previous': ['Previous', 'Назад'],
  'com.next': ['Next', 'Напред'],

  'com.dialogTitle': ['Start New Discussion', 'Започване на нова дискусия'],
  'com.dialogText': [
    'Share crop symptoms, field trial results, or pest sightings with the community.',
    'Споделете със общността симптоми по културите, резултати от полеви опити или наблюдения на вредители.',
  ],
  'com.fieldTitle': ['Title', 'Заглавие'],
  'com.titlePlaceholder': [
    'e.g., Early Blight progression in greenhouse tomatoes',
    'напр. Развитие на ранния пригор при оранжерийни домати',
  ],
  'com.fieldDetails': ['Details', 'Подробности'],
  'com.detailsPlaceholder': [
    'Describe symptoms, humidity levels, and treatments already attempted...',
    'Опишете симптомите, нивата на влажност и вече опитаните третирания...',
  ],
  'com.fieldImage': ['Field Image (Optional)', 'Снимка от полето (по желание)'],
  'com.attachPhoto': ['Attach photo', 'Прикачи снимка'],
  'com.previewAlt': ['Attachment preview', 'Преглед на прикачената снимка'],
  'com.removeImage': ['Remove image', 'Премахни снимката'],
  'com.publish': ['Publish Discussion', 'Публикувай дискусията'],

  'com.err.format': ['Please upload a JPEG, PNG, or WebP image.', 'Моля, качете JPEG, PNG или WebP изображение.'],
  'com.err.size': ['Image must be smaller than 10MB.', 'Снимката трябва да е под 10 MB.'],
  'com.err.upload': ['Image upload failed ({status})', 'Качването на снимката е неуспешно ({status})'],
  'com.err.load': ['Failed to load community discussions', 'Дискусиите не можаха да се заредят'],
  'com.err.publish': ['Failed to publish post', 'Публикацията не можа да бъде добавена'],
  'com.published': ['Discussion published to Community Hub', 'Дискусията е публикувана в общността'],

  'thread.back': ['Back to Community Hub', 'Обратно към общността'],
  'thread.notFound': ['Discussion not found', 'Дискусията не е намерена'],
  'thread.deletePost': ['Delete Post', 'Изтрий публикацията'],
  'thread.replies': ['Peer & Specialist Replies ({count})', 'Отговори от колеги и специалисти ({count})'],
  'thread.replyPlaceholder': [
    'Share agronomic feedback, recommended active ingredients, or field experience...',
    'Споделете агрономическо мнение, препоръчани активни вещества или опит от полето...',
  ],
  'thread.postReply': ['Post Reply', 'Изпрати отговор'],
  'thread.signInPrefix': ['Sign in', 'Влезте'],
  'thread.signInSuffix': ['to join this agronomic discussion.', 'за да се включите в тази агрономическа дискусия.'],
  'thread.noReplies': ['No replies yet. Be the first to respond.', 'Все още няма отговори. Бъдете първи.'],
  'thread.deleteComment': ['Delete comment', 'Изтрий коментара'],

  'thread.err.load': ['Failed to load discussion thread', 'Дискусията не можа да се зареди'],
  'thread.err.signIn': ['Please sign in to post a comment.', 'Моля, влезте, за да коментирате.'],
  'thread.err.comment': ['Failed to submit comment', 'Коментарът не можа да бъде изпратен'],
  'thread.err.deleteComment': ['Failed to delete comment', 'Коментарът не можа да бъде изтрит'],
  'thread.err.deletePost': ['Failed to delete post', 'Публикацията не можа да бъде изтрита'],
  'thread.commentAdded': ['Comment added', 'Коментарът е добавен'],
  'thread.commentDeleted': ['Comment deleted', 'Коментарът е изтрит'],
  'thread.postDeleted': ['Discussion deleted', 'Дискусията е изтрита'],
});
