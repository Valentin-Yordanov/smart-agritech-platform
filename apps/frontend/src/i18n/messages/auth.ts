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
  'auth.register.passwordPlaceholder': ['At least 10 characters', 'Поне 10 символа'],
  'auth.register.fixErrors': ['Please fix the following:', 'Моля, коригирайте следното:'],
  'auth.pw.length': ['10–72 characters', '10–72 символа'],
  'auth.pw.lower': ['One lowercase letter', 'Една малка буква'],
  'auth.pw.upper': ['One uppercase letter', 'Една главна буква'],
  'auth.pw.number': ['One number', 'Една цифра'],
  'auth.pw.special': ['One special character (!@#…)', 'Един специален символ (!@#…)'],
  'auth.pw.weak': ['Weak', 'Слаба'],
  'auth.pw.fair': ['Fair', 'Средна'],
  'auth.pw.good': ['Good', 'Добра'],
  'auth.pw.strong': ['Strong', 'Силна'],
  'auth.register.submit': ['Create Account', 'Създай акаунт'],
  'auth.register.submitting': ['Creating account...', 'Създаване на акаунт...'],
  'auth.register.success': ['Account created successfully', 'Акаунтът е създаден успешно'],
  'auth.register.failed': ['Registration failed', 'Регистрацията е неуспешна'],
  'auth.register.already': ['Already registered?', 'Вече имате акаунт?'],
  'auth.register.signIn': ['Sign in', 'Влезте'],
});
