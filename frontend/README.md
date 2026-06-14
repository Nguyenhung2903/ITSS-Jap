# Tomoio Frontend Local

Frontend Next.js ket noi backend local.

## Setup

Dam bao backend dang chay tai `http://localhost:5000`, sau do:

```bash
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

Mo:

```text
http://localhost:3000
```

## Tai Khoan Demo

Neu backend da chay seed:

```text
Email: seed.user001@tomoio.local
Password: 123456
```

## Lenh

```bash
npm run dev
npm run build
npm run lint
```
