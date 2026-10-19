# Generals Mobile V10 — نشر Vercel

ارفع **محتويات هذا المجلد مباشرة إلى جذر مستودع GitHub**؛ يجب أن يظهر index.html و vercel.json بجانب بعضهما.

في Vercel: Framework Preset = Other؛ Root Directory = ./؛ Build Command = فارغ؛ Output Directory = فارغ. ثم Redeploy.

النسخة الفردية تعمل من Vercel بدون خادم. اللعب مع الأصدقاء عبر WebSocket لا يعمل على استضافة Vercel الثابتة وحدها؛ يوجد كود الخادم في multiplayer-server/ ويحتاج استضافة Node.js مستقلة أو خدمة آنية.

المجسمات GLB في models/، لكن نسخة المعركة الحالية تستخدم Canvas ولا تعرض GLB بعد.

إذا ظهر 404 بعد النشر تأكد من أن الملف اسمه بالضبط vercel.json (وليس vercal.json) وأن index.html في جذر المشروع.
