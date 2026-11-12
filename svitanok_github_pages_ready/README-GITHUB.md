# Світанок — GitHub Pages

## 1. Публікація сайту
1. Створіть **Public** репозиторій GitHub `svitanok-shop`.
2. Завантажте файли **з кореня архіву** (index.html має бути у корені).
3. У Settings → Pages виберіть Deploy from a branch → main → /(root).
4. Дочекайтеся публікації за адресою `https://USERNAME.github.io/svitanok-shop/`.

## 2. Авторизація Firebase (обов'язково)
Firebase Console → Authentication → Settings → Authorized domains → додайте **USERNAME.github.io**.
Перевірте, що Google Sign-in увімкнено. Якщо Google OAuth повертає помилку redirect URI, налаштуйте дозволені URI в Google Cloud для свого Firebase Auth.

## 3. API доставки та ТТН (обов'язково для автоматичних функцій)
GitHub Pages не запускає серверний JavaScript. У папці `netlify/functions` збережено функції, але GitHub Pages їх НЕ виконує.
Для роботи довідника Нової пошти та відстеження:
- Розгорніть **окремий backend** із цього репозиторію на Netlify (через Git) або сумісному хостингу, що підтримує ці функції.
- У налаштуваннях backend задайте `NOVA_POSHTA_API_KEY`, `UKRPOSHTA_TRACKING_BEARER`, `FIREBASE_SERVICE_ACCOUNT_JSON`.
- У `config.js` встановіть `backendOrigin:'https://ВАШ-BACKEND.netlify.app'`.
- Повторно опублікуйте змінений `config.js` на GitHub Pages.
- Відкрийте DevTools → Network та перевірте запити до функцій.

**Важливо:** GitHub Pages не надає прихованих змінних середовища. НЕ записуйте секрети у `config.js`, `app.js` або GitHub репозиторій.
Бекенд Netlify не повинен відображати значок Netlify на сторінці GitHub Pages, оскільки сайт обслуговується GitHub.

## 4. Firebase Rules
Використовуйте `database.rules.json` із цього архіву, але спочатку збережіть поточні правила.
Перевірте, що UID адміністратора правильний. Правила захищають дані незалежно від GitHub Pages.

## 5. Перевірка
- Відкрийте головну, перемикач тем, каталог, кошик, реєстрацію, відгуки, адмінку.
- Перевірте створення тестового замовлення.
- Для API: введіть населений пункт Нової пошти; перевірте список відділень; введіть справжній ТТН у тестове замовлення.
- Укрпошта: адреса оформлення наразі вводиться вручну, навіть коли відстеження ТТН підключене.

Сайт може працювати на GitHub Pages, але **автоматичні API-функції не працюватимуть без окремого бекенду та ключів**.
