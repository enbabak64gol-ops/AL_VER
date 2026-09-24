# legacy/ — کد قدیمی Firebase (خارج از استقرار)

این پوشه فقط به‌عنوان مرجع تاریخی نگه داشته شده و «بخشی از اپ PocketBase پروداکشن نیست».

- `firebase-functions-reference/functions/` : توابع Cloud Functions قدیمی (Firestore/Firebase Auth).
- این کد هرگز توسط Dockerfile کپی یا اجرا نمی‌شود و هیچ وابستگی‌ای به آن وجود ندارد.
- عملکرد معادل آن در PocketBase به‌صورت hooks در `pb_hooks/main.pb.js` پیاده شده است.

در صورت عدم نیاز، می‌توانید کل پوشه `legacy/` را پیش از push حذف کنید.
