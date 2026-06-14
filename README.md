# Tomoio Local Development

Du an gom 2 phan:

- `36-be-main`: Backend Express + Prisma + PostgreSQL + Socket.IO.
- `36-fe-main`: Frontend Next.js + React + TypeScript.

Tai lieu nay chi phuc vu chay he thong tren local.

## Yeu Cau

- Node.js 20+
- npm
- PostgreSQL local
- pgAdmin 4 de tao/xem database

## Cau Truc

```text
.
├── 36-be-main/
│   ├── src/                 # Backend source
│   ├── prisma/              # Prisma schema, migrations, seed
│   ├── env.example          # Mau .env local
│   └── package.json
└── 36-fe-main/
    ├── app/                 # Next.js app routes/pages
    ├── components/
    ├── lib/
    ├── .env.local.example   # Mau env frontend local
    └── package.json
```

## 1. Tao Database Local Bang pgAdmin 4

1. Mo pgAdmin 4.
2. Ket noi den PostgreSQL local.
3. Tao database moi, vi du:

```text
tomoio_local
```

Neu user/password PostgreSQL cua ban khac `postgres/postgres`, hay sua connection string trong backend `.env`.

## 2. Chay Backend

```bash
cd "/Users/haruoki/学習/大学/ITSS Jap/36-be-main"
npm install
cp env.example .env
```

Mo `.env` va sua neu can:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tomoio_local?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/tomoio_local?schema=public"
PORT=5000
NODE_ENV=development
JWT_SECRET=local-dev-secret-change-me
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:3000
```

Tao schema database:

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

Backend chay tai:

```text
http://localhost:5000
```

Kiem tra ket noi backend/database:

```bash
curl http://localhost:5000/health
```

Ket qua dung:

```json
{"status":"ok","database":"connected"}
```

## 3. Chay Frontend

Mo terminal thu hai:

```bash
cd "/Users/haruoki/学習/大学/ITSS Jap/36-fe-main"
npm install
cp .env.local.example .env.local
```

Noi dung `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Chay frontend:

```bash
npm run dev
```

Frontend chay tai:

```text
http://localhost:3000
```

## Tai Khoan Demo

Sau khi chay `npm run seed`, co the dang nhap bang:

```text
Email: seed.user001@tomoio.local
Password: 123456
```

## Lenh Hay Dung

Backend:

```bash
cd "/Users/haruoki/学習/大学/ITSS Jap/36-be-main"
npm run dev
npm run seed
npx prisma migrate dev
npx prisma studio
```

Frontend:

```bash
cd "/Users/haruoki/学習/大学/ITSS Jap/36-fe-main"
npm run dev
npm run build
npm run lint
```

## Luu Y Local

- Backend phai chay truoc frontend.
- Port backend mac dinh la `5000`.
- Port frontend mac dinh la `3000`.
- Neu port `5000` bi chiem, doi `PORT` trong `36-be-main/.env` va doi ca 2 bien trong `36-fe-main/.env.local`.
- File seed chi tao/xoa lai du lieu mau co prefix `seed.*` / `Seed ...`, khong wipe toan bo database.
- Cac API upload anh/CCCD can Cloudinary. Neu chi chay UI voi seed data thi co the de trong Cloudinary env.
