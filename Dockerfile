# استخدم نسخة Node.js خفيفة
FROM node:20-alpine

# نحدد مجلد العمل
WORKDIR /app

# تثبيت bash و dumb-init لإدارة الإشارات بشكل صحيح
RUN apk add --no-cache dumb-init bash

# نسخ ملفات الحزم
COPY package.json package-lock.json ./

# تثبيت كل dependencies (dev + prod)
RUN npm ci

# نسخ باقي الكود
COPY . .

# عمل build للمشروع (client + server)
RUN npm run build

# فتح المنفذ
EXPOSE 5000

# dumb-init لإدارة الإشارات بشكل صحيح
ENTRYPOINT ["dumb-init", "--"]

# تشغيل نسخة الإنتاج
CMD ["npm", "run", "start"]
