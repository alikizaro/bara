# برا السالفة — Android

تطبيق حفلات عربي أصلي مبني بـReact Native وExpo، وليس WebView. ينشئ المضيف غرفة، يدخل الأصدقاء بالرمز، ويحصل لاعب واحد سرًا على دور «برا السالفة» بينما يرى الباقون الشخصية أو العنصر الصحيح.

## ما الذي يتضمنه التطبيق؟

- غرف لحظية من 3 إلى 10 لاعبين عبر Convex.
- 8 أصناف: الحيوانات، الأنمي، الدول، المدن، الأكلات، المشاهير، كرة القدم، والمنوّع.
- 12 حزمة أنمي مستقلة، بالإضافة إلى «كل الأنميات»، بإجمالي 1,078 اسمًا فريدًا.
- ناروتو مستقل عن بوروتو.
- 168 حيوانًا، ولكل واحد صورة مراجعة؛ 167 صورة مرتبطة بالصفحة الإنجليزية المحددة وواحدة بصفحتها العربية الصحيحة.
- مراحل كاملة: أسئلة تلقائية، أسئلة حرة، تصويت، أربعة خيارات لبرا السالفة، نتيجة، نقاط، وجولات متتابعة.
- صوت مباشر عبر LiveKit: يسمع الجميع، ولا يفتح التطبيق الميكروفون إلا للسائل والمجيب.
- أسرار LiveKit تبقى داخل Convex ولا تدخل في حزمة Android.
- معرّف الجهاز محفوظ داخل `expo-secure-store`، وكل إجراء حساس يُراجع على الخادم.

## البنية

- `src/`: واجهة Android وحالة التطبيق.
- `convex/`: مخطط البيانات، الغرف، مراحل اللعب، الصلاحيات، وإصدار رموز LiveKit.
- `convex/data/catalog/`: قوائم اللعب وكتالوجات الصور المراجعة.
- `app.json`: إعدادات Android والصلاحيات والإضافات الأصلية.
- `eas.json`: ملفات بناء Development وAPK تجريبي وAAB إنتاجي.

## تشغيل التطوير

يتطلب الصوت Development Build؛ لن يعمل داخل Expo Go لأنه يعتمد على WebRTC أصلي.

1. ثبّت الحزم:

   ```bash
   npm ci
   ```

2. سجّل الدخول إلى Convex وأنشئ/اربط المشروع:

   ```bash
   npx convex dev
   ```

   يكتب الأمر `EXPO_PUBLIC_CONVEX_URL` تلقائيًا في `.env.local`.

3. من LiveKit Cloud أنشئ مشروعًا، ثم خزّن القيم في Convex. يمكن حذف القيمة من الأمر لإدخال السر تفاعليًا دون حفظه في سجل الطرفية:

   ```bash
   npx convex env set LIVEKIT_URL
   npx convex env set LIVEKIT_API_KEY
   npx convex env set LIVEKIT_API_SECRET
   ```

4. شغّل Development Build:

   ```bash
   npx eas-cli build --platform android --profile development
   npm run android
   ```

## إخراج APK تجريبي

1. انشر وظائف Convex إلى الإنتاج:

   ```bash
   npx convex deploy
   ```

2. أضف متغيرات LiveKit إلى نشر Convex الإنتاجي باستخدام الخيار `--prod`.
3. أضف `EXPO_PUBLIC_CONVEX_URL` إلى بيئة `preview` في EAS.
4. ابنِ ملف APK:

   ```bash
   npx eas-cli build --platform android --profile preview
   ```

ملف `production` في `eas.json` يخرج AAB لمتجر Google Play بدل APK.

## التحقق

```bash
npm run verify
npx expo-doctor
npx expo export --platform android
```

الاختبارات تتحقق أيضًا من استقلال ناروتو عن بوروتو، عدد حزم الأنمي، واكتمال صور الحيوانات الـ168.
