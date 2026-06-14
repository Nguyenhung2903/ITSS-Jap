# Database Local

Thu muc nay chi giu mot file SQL de chay truc tiep bang PostgreSQL extension hoac pgAdmin 4:

```text
tomoio.sql
```

File nay gom ca:

- Cau truc database: enum, table, index, foreign key
- Du lieu demo: users, profiles, groups, posts, chat, events, moderation, notifications

## Cach Chay

1. Tao database local ten `tomoio`.
2. Mo PostgreSQL extension hoac pgAdmin 4 Query Tool.
3. Chon database `tomoio`.
4. Chay file:

```text
database/tomoio.sql
```

Tai khoan demo:

```text
Email: seed.user001@tomoio.local
Password: 123456
```

Du lieu da kiem tra tren database `tomoio` local:

```text
users: 60
admins: 50
groups: 50
events: 50
posts: 100
messages: 200
```

Luu y: file nay tao schema, nen nen chay tren database `tomoio` dang trong. Neu da co table san, hay drop/recreate database truoc khi chay lai.
