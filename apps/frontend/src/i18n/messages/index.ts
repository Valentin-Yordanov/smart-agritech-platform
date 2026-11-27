import { common } from '@/i18n/messages/common';
import { landing } from '@/i18n/messages/landing';
import { auth } from '@/i18n/messages/auth';
import { dashboard } from '@/i18n/messages/dashboard';
import { scan } from '@/i18n/messages/scan';
import { advisor } from '@/i18n/messages/advisor';
import { outbreaks } from '@/i18n/messages/outbreaks';
import { community } from '@/i18n/messages/community';
import { knowledge } from '@/i18n/messages/knowledge';

export const messages = {
  ...common,
  ...landing,
  ...auth,
  ...dashboard,
  ...scan,
  ...advisor,
  ...outbreaks,
  ...community,
  ...knowledge,
};

export type MessageKey = keyof typeof messages;
