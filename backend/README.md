# Tomoio Backend Local

Backend Express + Prisma + PostgreSQL + Socket.IO.

## Setup

Tao database `tomoio_local` bang pgAdmin 4, sau do chay:

```bash
npm install
cp env.example .env
```

Sua `.env` theo thong tin PostgreSQL local:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tomoio_local?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/tomoio_local?schema=public"
PORT=5000
NODE_ENV=development
JWT_SECRET=local-dev-secret-change-me
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:3000
```

Tao schema va Prisma client:

```bash
npx prisma migrate dev
npx prisma generate
```

Nap du lieu mau:

```bash
npm run seed
```

Chay backend:

```bash
npm run dev
```

Kiem tra:

```bash
curl http://localhost:5000/health
```

## Tai Khoan Demo

```text
Email: seed.user001@tomoio.local
Password: 123456
```

## Lenh

```bash
npm run dev
npm start
npm run build
npm run seed
npx prisma migrate dev
npx prisma studio
```
