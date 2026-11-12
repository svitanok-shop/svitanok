АВТОМАТИЧНЕ ВІДСТЕЖЕННЯ — СВІТАНОК

1. Завантаж усі файли на Netlify (рекомендовано через Git-репозиторій, щоб Netlify встановив npm dependencies і зібрав Functions).
2. Netlify → Site configuration → Environment variables:
   NOVA_POSHTA_API_KEY — API ключ Нової пошти.
   UKRPOSHTA_TRACKING_BEARER — окремий production bearer StatusTracking Укрпошти.
   FIREBASE_SERVICE_ACCOUNT_JSON — JSON ключ сервісного акаунта Firebase Admin SDK, однією строкою. НІКОЛИ не додавати у публічні файли.
3. Виконай Deploy з функціями. Перевір, що функції shipment та shipment-scheduled опубліковані.
4. Адмін → Замовлення → введи ТТН та збережи. У профілі покупця з’явиться поточний статус.
5. Netlify Scheduled Function перевіряє до 40 відправлень кожні 30 хвилин (ліміт прикладу); кнопка Оновити перевіряє вручну.
6. Укрпошта надає bearer для відстеження після оформлення доступу; до реєстрації посилки у відділенні статус може бути відсутнім.

ВАЖЛИВО: без трьох серверних секретів функція відстеження не працюватиме. Firebase Rules не змінювати: запис через Admin SDK іде з сервера.
Перевірити роботу API можна лише після підключення ключів і розгортання Netlify Functions.
