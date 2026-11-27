import { defineMessages } from '@/i18n/config';

export const auth = defineMessages({
  'auth.backHome': ['Back to Home', 'Към началната страница'],
  'auth.email': ['Email', 'Имейл'],
  'auth.password': ['Password', 'Парола'],
  'auth.fullName': ['Full Name', 'Име и фамилия'],

  'auth.login.title': ['Sign in to Smart AgriTech', 'Вход в Smart AgriTech'],
  'auth.login.description': [
    'Access AI crop diagnostics, RAG advisory, and outbreak maps',
    'Достъп до ИИ диагностика на културите, RAG съветник и карти на огнищата',
  ],
  'auth.login.submit': ['Sign In', 'Вход'],
  'auth.login.submitting': ['Signing in...', 'Влизане...'],
  'auth.login.welcome': ['Welcome back to Smart AgriTech', 'Добре дошли отново в Smart AgriTech'],
  'auth.login.invalid': ['Invalid email or password', 'Грешен имейл или парола'],
  'auth.login.noAccount': ["Don't have an account?", 'Нямате акаунт?'],
  'auth.login.createOne': ['Create one', 'Създайте'],

  'auth.register.title': ['Create AgriTech Account', 'Създаване на акаунт в AgriTech'],
  'auth.register.description': [
    'Join agronomists and growers using AI-assisted crop protection',
    'Присъединете се към агрономи и земеделци, които ползват ИИ за защита на културите',
  ],
  'auth.register.passwordPlaceholder': ['Min 8 characters', 'Минимум 8 символа'],
  'auth.register.submit': ['Create Account', 'Създай акаунт'],
  'auth.register.submitting': ['Creating account...', 'Създаване на акаунт...'],
  'auth.register.success': ['Account created successfully', 'Акаунтът е създаден успешно'],
  'auth.register.failed': ['Registration failed', 'Регистрацията е неуспешна'],
  'auth.register.already': ['Already registered?', 'Вече имате акаунт?'],
  'auth.register.signIn': ['Sign in', 'Влезте'],
});
