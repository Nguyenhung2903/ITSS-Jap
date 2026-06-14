
-- ============================================================
-- Source: backend/prisma/migrations/20260530121644_init/migration.sql
-- ============================================================
-- CreateEnum
CREATE TYPE "ProfileActionType" AS ENUM ('PASS', 'LIKE', 'BLOCK');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'VERIFIED');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportCaseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "verified_users" (
    "user_id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "location" TEXT,
    "bio" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "verified_users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "related_user_id" INTEGER,
    "session_id" INTEGER,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_photos" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "user_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_languages" (
    "id" SERIAL NOT NULL,
    "language" TEXT NOT NULL,
    "type" TEXT,
    "level" TEXT,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "user_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_purposes" (
    "id" SERIAL NOT NULL,
    "purpose" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "user_purposes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_hobbies" (
    "id" SERIAL NOT NULL,
    "hobby_name" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "user_hobbies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "post_id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "group_id" INTEGER,
    "author_id" INTEGER NOT NULL,
    "image" TEXT,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("post_id")
);

-- CreateTable
CREATE TABLE "post_likes" (
    "user_id" INTEGER NOT NULL,
    "post_id" INTEGER NOT NULL,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("user_id","post_id")
);

-- CreateTable
CREATE TABLE "comments" (
    "comment_id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "post_id" INTEGER NOT NULL,
    "author_id" INTEGER NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "match_session" (
    "session_id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_session_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "match_participants" (
    "session_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "match_participants_pkey" PRIMARY KEY ("session_id","user_id")
);

-- CreateTable
CREATE TABLE "messages" (
    "message_id" SERIAL NOT NULL,
    "content" TEXT,
    "send_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "attachment_url" TEXT,
    "deleted_at" TIMESTAMP(3),
    "edited_at" TIMESTAMP(3),
    "is_seen" BOOLEAN NOT NULL DEFAULT false,
    "message_type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "translated_text" JSONB,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "events" (
    "event_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "event_time" TIMESTAMP(3) NOT NULL,
    "format" TEXT NOT NULL,
    "address" TEXT,
    "url_link" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "admin_id" INTEGER NOT NULL,
    "administratorId" INTEGER,
    "status" "EventStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "event_engagements" (
    "event_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "engagement_type" TEXT NOT NULL,
    "engaged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_engagements_pkey" PRIMARY KEY ("event_id","user_id")
);

-- CreateTable
CREATE TABLE "administrators" (
    "admin_id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role_level" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "administrators_pkey" PRIMARY KEY ("admin_id")
);

-- CreateTable
CREATE TABLE "kyc_requests" (
    "request_id" SERIAL NOT NULL,
    "document_image_url" TEXT NOT NULL,
    "reject_reason" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,
    "admin_id" INTEGER,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "kyc_requests_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "report_cases" (
    "case_id" SERIAL NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "admin_id" INTEGER,
    "status" "ReportCaseStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "report_cases_pkey" PRIMARY KEY ("case_id")
);

-- CreateTable
CREATE TABLE "report_parties" (
    "user_id" INTEGER NOT NULL,
    "case_id" INTEGER NOT NULL,
    "party_role" TEXT NOT NULL,

    CONSTRAINT "report_parties_pkey" PRIMARY KEY ("user_id","case_id")
);

-- CreateTable
CREATE TABLE "user_profile_actions" (
    "actor_id" INTEGER NOT NULL,
    "target_id" INTEGER NOT NULL,
    "action" "ProfileActionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_profile_actions_pkey" PRIMARY KEY ("actor_id","target_id","action")
);

-- CreateTable
CREATE TABLE "groups" (
    "group_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "group_avatar" TEXT,
    "group_cover" TEXT,
    "member_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("group_id")
);

-- CreateTable
CREATE TABLE "group_hobby_tags" (
    "group_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "group_hobby_tags_pkey" PRIMARY KEY ("group_id","name")
);

-- CreateTable
CREATE TABLE "group_language_tags" (
    "group_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "group_language_tags_pkey" PRIMARY KEY ("group_id","name")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verified_users_email_key" ON "verified_users"("email");

-- CreateIndex
CREATE INDEX "verified_users_status_idx" ON "verified_users"("status");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "posts_group_id_created_at_idx" ON "posts"("group_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "match_participants_user_id_idx" ON "match_participants"("user_id");

-- CreateIndex
CREATE INDEX "messages_session_id_send_at_idx" ON "messages"("session_id", "send_at");

-- CreateIndex
CREATE INDEX "messages_session_id_is_seen_idx" ON "messages"("session_id", "is_seen");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE UNIQUE INDEX "events_url_link_key" ON "events"("url_link");

-- CreateIndex
CREATE UNIQUE INDEX "administrators_username_key" ON "administrators"("username");

-- CreateIndex
CREATE INDEX "kyc_requests_user_id_status_idx" ON "kyc_requests"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_profile_actions_actor_id_action_idx" ON "user_profile_actions"("actor_id", "action");

-- CreateIndex
CREATE INDEX "user_profile_actions_target_id_action_idx" ON "user_profile_actions"("target_id", "action");

-- CreateIndex
CREATE INDEX "group_hobby_tags_name_idx" ON "group_hobby_tags"("name");

-- CreateIndex
CREATE INDEX "group_language_tags_name_idx" ON "group_language_tags"("name");

-- CreateIndex
CREATE INDEX "group_members_user_id_idx" ON "group_members"("user_id");

-- CreateIndex
CREATE INDEX "group_members_group_id_idx" ON "group_members"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_user_id_group_id_key" ON "group_members"("user_id", "group_id");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "verified_users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_photos" ADD CONSTRAINT "user_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "verified_users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_languages" ADD CONSTRAINT "user_languages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "verified_users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_purposes" ADD CONSTRAINT "user_purposes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "verified_users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_hobbies" ADD CONSTRAINT "user_hobbies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "verified_users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "verified_users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("group_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "verified_users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "verified_users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "match_session"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_participants" ADD CONSTRAINT "match_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "verified_users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "verified_users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "match_session"("session_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "verified_users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_administratorId_fkey" FOREIGN KEY ("administratorId") REFERENCES "administrators"("admin_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_engagements" ADD CONSTRAINT "event_engagements_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_engagements" ADD CONSTRAINT "event_engagements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "verified_users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_requests" ADD CONSTRAINT "kyc_requests_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "administrators"("admin_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_requests" ADD CONSTRAINT "kyc_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "verified_users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cases" ADD CONSTRAINT "report_cases_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "administrators"("admin_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_parties" ADD CONSTRAINT "report_parties_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "report_cases"("case_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_parties" ADD CONSTRAINT "report_parties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "verified_users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile_actions" ADD CONSTRAINT "user_profile_actions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "verified_users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profile_actions" ADD CONSTRAINT "user_profile_actions_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "verified_users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_hobby_tags" ADD CONSTRAINT "group_hobby_tags_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_language_tags" ADD CONSTRAINT "group_language_tags_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("group_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "verified_users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- Source: backend/prisma/migrations/20260601120000_matching_filter_indexes/migration.sql
-- ============================================================
-- CreateIndex
CREATE INDEX "user_hobbies_user_id_idx" ON "user_hobbies"("user_id");

-- CreateIndex
CREATE INDEX "user_hobbies_hobby_name_idx" ON "user_hobbies"("hobby_name");

-- CreateIndex
CREATE INDEX "user_languages_user_id_idx" ON "user_languages"("user_id");

-- CreateIndex
CREATE INDEX "user_languages_language_idx" ON "user_languages"("language");

-- CreateIndex
CREATE INDEX "user_languages_level_idx" ON "user_languages"("level");

-- CreateIndex
CREATE INDEX "user_purposes_user_id_idx" ON "user_purposes"("user_id");

-- CreateIndex
CREATE INDEX "user_purposes_purpose_idx" ON "user_purposes"("purpose");

-- ============================================================
-- Source: backend/prisma/migrations/20260601130000_chat_query_indexes/migration.sql
-- ============================================================
-- Speed up unread counts per session (groupBy sessionId + isSeen filter)
CREATE INDEX "messages_session_unread_idx" ON "messages"("session_id", "is_seen", "sender_id")
WHERE "deleted_at" IS NULL;
-- Tomoio local seed data for pgAdmin 4 / PostgreSQL.
-- Run this after Prisma migrations have created the schema.
--
-- Demo login:
--   Email: seed.user001@tomoio.local
--   Password: 123456
--
-- This file is rerunnable. It only removes previous seed data identified by
-- seed.* / Seed ... prefixes and keeps non-seed data untouched.

BEGIN;

-- =========================
-- Cleanup previous seed data
-- =========================

CREATE TEMP TABLE "_seed_user_ids" ON COMMIT DROP AS
SELECT "user_id"
FROM "verified_users"
WHERE "email" LIKE 'seed.user%@tomoio.local';

CREATE TEMP TABLE "_seed_admin_ids" ON COMMIT DROP AS
SELECT "admin_id"
FROM "administrators"
WHERE "username" LIKE 'seed_admin_%';

CREATE TEMP TABLE "_seed_group_ids" ON COMMIT DROP AS
SELECT "group_id"
FROM "groups"
WHERE "name" LIKE 'Seed Group %'
   OR "name" LIKE '日本語会話クラブ %'
   OR "name" LIKE 'ベトナム語初心者グループ %'
   OR "name" LIKE 'ハノイ生活情報交換 %'
   OR "name" LIKE '東京ベトナム交流会 %'
   OR "name" LIKE 'JLPT N2勉強会 %'
   OR "name" LIKE '旅行好きコミュニティ %'
   OR "name" LIKE 'カフェで言語交換 %'
   OR "name" LIKE '日本文化研究会 %'
   OR "name" LIKE 'ベトナム料理を楽しむ会 %'
   OR "name" LIKE 'IT・エンジニア交流会 %';

CREATE TEMP TABLE "_seed_post_ids" ON COMMIT DROP AS
SELECT "post_id"
FROM "posts"
WHERE "author_id" IN (SELECT "user_id" FROM "_seed_user_ids")
   OR "group_id" IN (SELECT "group_id" FROM "_seed_group_ids");

CREATE TEMP TABLE "_seed_session_ids" ON COMMIT DROP AS
SELECT DISTINCT mp."session_id"
FROM "match_participants" mp
WHERE mp."user_id" IN (SELECT "user_id" FROM "_seed_user_ids");

CREATE TEMP TABLE "_seed_event_ids" ON COMMIT DROP AS
SELECT "event_id"
FROM "events"
WHERE "url_link" LIKE 'https://tomoio.local/events/seed-%'
   OR "admin_id" IN (SELECT "user_id" FROM "_seed_user_ids")
   OR "administratorId" IN (SELECT "admin_id" FROM "_seed_admin_ids");

CREATE TEMP TABLE "_seed_report_ids" ON COMMIT DROP AS
SELECT "case_id"
FROM "report_cases"
WHERE "evidence_url" LIKE '/assets/images/%'
   OR "admin_id" IN (SELECT "admin_id" FROM "_seed_admin_ids")
   OR "reason" = '不適切な表現が含まれている、またはスパム行為の可能性があります。';

DELETE FROM "Notification"
WHERE "userId" IN (SELECT "user_id" FROM "_seed_user_ids")
   OR "related_user_id" IN (SELECT "user_id" FROM "_seed_user_ids")
   OR "session_id" IN (SELECT "session_id" FROM "_seed_session_ids");

DELETE FROM "comments"
WHERE "post_id" IN (SELECT "post_id" FROM "_seed_post_ids")
   OR "author_id" IN (SELECT "user_id" FROM "_seed_user_ids");

DELETE FROM "post_likes"
WHERE "post_id" IN (SELECT "post_id" FROM "_seed_post_ids")
   OR "user_id" IN (SELECT "user_id" FROM "_seed_user_ids");

DELETE FROM "posts"
WHERE "post_id" IN (SELECT "post_id" FROM "_seed_post_ids");

DELETE FROM "event_engagements"
WHERE "event_id" IN (SELECT "event_id" FROM "_seed_event_ids")
   OR "user_id" IN (SELECT "user_id" FROM "_seed_user_ids");

DELETE FROM "events"
WHERE "event_id" IN (SELECT "event_id" FROM "_seed_event_ids");

DELETE FROM "report_parties"
WHERE "case_id" IN (SELECT "case_id" FROM "_seed_report_ids")
   OR "user_id" IN (SELECT "user_id" FROM "_seed_user_ids");

DELETE FROM "report_cases"
WHERE "case_id" IN (SELECT "case_id" FROM "_seed_report_ids");

DELETE FROM "messages"
WHERE "session_id" IN (SELECT "session_id" FROM "_seed_session_ids")
   OR "sender_id" IN (SELECT "user_id" FROM "_seed_user_ids");

DELETE FROM "match_participants"
WHERE "session_id" IN (SELECT "session_id" FROM "_seed_session_ids")
   OR "user_id" IN (SELECT "user_id" FROM "_seed_user_ids");

DELETE FROM "match_session"
WHERE "session_id" IN (SELECT "session_id" FROM "_seed_session_ids");

DELETE FROM "group_members"
WHERE "group_id" IN (SELECT "group_id" FROM "_seed_group_ids")
   OR "user_id" IN (SELECT "user_id" FROM "_seed_user_ids");

DELETE FROM "group_hobby_tags"
WHERE "group_id" IN (SELECT "group_id" FROM "_seed_group_ids");

DELETE FROM "group_language_tags"
WHERE "group_id" IN (SELECT "group_id" FROM "_seed_group_ids");

DELETE FROM "groups"
WHERE "group_id" IN (SELECT "group_id" FROM "_seed_group_ids");

DELETE FROM "user_profile_actions"
WHERE "actor_id" IN (SELECT "user_id" FROM "_seed_user_ids")
   OR "target_id" IN (SELECT "user_id" FROM "_seed_user_ids");

DELETE FROM "kyc_requests"
WHERE "user_id" IN (SELECT "user_id" FROM "_seed_user_ids");

DELETE FROM "user_photos"
WHERE "user_id" IN (SELECT "user_id" FROM "_seed_user_ids");

DELETE FROM "user_languages"
WHERE "user_id" IN (SELECT "user_id" FROM "_seed_user_ids");

DELETE FROM "user_purposes"
WHERE "user_id" IN (SELECT "user_id" FROM "_seed_user_ids");

DELETE FROM "user_hobbies"
WHERE "user_id" IN (SELECT "user_id" FROM "_seed_user_ids");

DELETE FROM "verified_users"
WHERE "user_id" IN (SELECT "user_id" FROM "_seed_user_ids");

DELETE FROM "administrators"
WHERE "admin_id" IN (SELECT "admin_id" FROM "_seed_admin_ids");

-- =========================
-- Base data
-- =========================

INSERT INTO "verified_users" (
    "email",
    "password",
    "first_name",
    "last_name",
    "date_of_birth",
    "location",
    "bio",
    "avatar_url",
    "created_at",
    "status"
)
SELECT
    'seed.user' || LPAD(gs::text, 3, '0') || '@tomoio.local',
    '$2b$10$361ILY2SZ6k69UBr1A4KLu7vlNUrM7srDue4l/0t32708mrohZGtS',
    CASE WHEN gs % 2 = 0 
        THEN (ARRAY['Sora','Haruka','Kota','Kenji','Hiroto','Yuki','Ryouta','Takuya','Kazuki','Aoi','Haruto','Yui','Riku','Mei','Hana'])[(gs % 15) + 1]
        ELSE (ARRAY['Linh','Minh','An','Lan','Vy','Nam','Huong','Tuan','Mai','Dung','Thao','Khanh','Hoang','Trang','Phong'])[(gs % 15) + 1]
    END,
    CASE WHEN gs % 2 = 0
        THEN (ARRAY['Tanaka','Suzuki','Yamamoto','Sato','Takahashi','Ito','Watanabe','Nakamura','Kobayashi','Kato','Yoshida','Yamada','Sasaki','Yamaguchi','Saito'])[(gs % 15) + 1]
        ELSE (ARRAY['Nguyen','Tran','Le','Pham','Hoang','Vu','Vo','Phan','Huynh','Dang'])[(gs % 10) + 1]
    END,
    DATE '1990-01-01' + ((gs % 4380) * INTERVAL '1 day'),
    (ARRAY['東京','大阪','ハノイ','ホーチミン','ダナン','横浜','京都','福岡','名古屋'])[(gs % 9) + 1],
    (ARRAY[
        'はじめまして！東京に住んでいる会社員です。ベトナム旅行が大好きで、ハノイやホーチミンに何度も行ったことがあります。もっとベトナム語を話せるようになりたいので、一緒に練習しましょう！日本のことについても何でも聞いてくださいね。',
        'こんにちは。ダナン出身で、今は東京でITエンジニアとして働いています。日本語はN2ですが、もっと自然な会話ができるようになりたいです。趣味は写真とカフェ巡りです。よろしくお願いします！',
        'ベトナム語を勉強し始めたばかりの初心者です。ベトナムの音楽や料理に興味があります。日本語を勉強しているベトナム人の方と、お互いの言語や文化について楽しくお話ししたいです！',
        'ハノイ在住の学生です。将来日本に留学したいと思っています。JLPT N3の勉強中ですが、特にリスニング và スピーキング力を向上させたいです。アニメや漫画が大好きです！',
        'こんにちは！ベトナム料理を作るのが趣味の日本人です。お互いの母国語を教え合える友達を探しています。週末にオンラインで話せる方、気軽にメッセージしてください。',
        '日本に来て2年になります。日本の文化や歴史が大好きです。ベトナム語を学びたい日本人の方、私のベトナム語と交換で日本語の会話練習をしませんか？',
        '写真と旅行が好きなバックパッカーです。ベトナムのローカルな観光地や美味しいカフェの情報交換をしたいです。日本語とベトナム語の両方で楽しく交流しましょう！',
        'JLPT N1を目指して猛勉強中です！日常会話からビジネス会話まで、幅広いトピックで日本語を話せるようになりたいです。私もベトナム語の学習をサポートします。',
        '週末の空いた時間にカフェで言語交換できる友人を探しています。言語だけでなく、お互いの国の生活や習慣についても話せたら嬉しいです！',
        'プログラミングとガジェットが大好きなエンジニアです。日本語とベトナム語の技術用語や、業界の働き方について情報交換したいです。よろしくお願いします。'
    ])[(gs % 10) + 1],
    '/assets/images/avatars/avatar-' || (((gs - 1) % 10) + 1)::text || '.jpg',
    NOW() - ((60 - gs) * INTERVAL '1 day'),
    CASE WHEN gs % 10 = 0 THEN 'PENDING'::"UserStatus" ELSE 'VERIFIED'::"UserStatus" END
FROM generate_series(1, 60) AS gs;

INSERT INTO "administrators" ("username", "password", "role_level", "created_at")
SELECT
    'seed_admin_' || LPAD(gs::text, 3, '0'),
    '$2b$10$361ILY2SZ6k69UBr1A4KLu7vlNUrM7srDue4l/0t32708mrohZGtS',
    CASE WHEN gs % 5 = 0 THEN 'SUPER_ADMIN' ELSE 'MODERATOR' END,
    NOW() - ((50 - gs) * INTERVAL '1 day')
FROM generate_series(1, 50) AS gs;

INSERT INTO "user_photos" ("url", "isMain", "user_id")
SELECT
    '/assets/images/recommendations/rec-' || ((((photo_no - 1) % 3) + 1)::text) || '.png',
    slot = 1,
    vu."user_id"
FROM (
    SELECT "user_id", ROW_NUMBER() OVER (ORDER BY "user_id") AS rn
    FROM "verified_users"
    WHERE "email" LIKE 'seed.user%@tomoio.local'
) vu
CROSS JOIN LATERAL (
    VALUES
        (1, vu.rn),
        (2, vu.rn + 60)
) AS p(slot, photo_no);

INSERT INTO "user_languages" ("language", "type", "level", "user_id")
SELECT
    CASE slot
        WHEN 1 THEN CASE WHEN rn % 2 = 0 THEN '日本' ELSE 'ベトナム' END
        ELSE CASE WHEN rn % 2 = 0 THEN 'ベトナム' ELSE '日本' END
    END,
    CASE slot WHEN 1 THEN 'native' ELSE 'learning' END,
    CASE slot
        WHEN 1 THEN NULL
        ELSE CASE WHEN rn % 2 = 0 
            THEN (ARRAY['初級','中級','上級'])[(rn % 3) + 1]
            ELSE (ARRAY['N1','N2','N3','N4','N5'])[(rn % 5) + 1]
        END
    END,
    "user_id"
FROM (
    SELECT "user_id", ROW_NUMBER() OVER (ORDER BY "user_id") AS rn
    FROM "verified_users"
    WHERE "email" LIKE 'seed.user%@tomoio.local'
) u
CROSS JOIN generate_series(1, 2) AS slot;

INSERT INTO "user_purposes" ("purpose", "user_id")
SELECT
    (ARRAY['言語交換','文化交流','留学','友達作り','キャリア交流','旅行仲間','JLPT練習','ベトナム語練習'])[((rn + offset_no) % 8) + 1],
    "user_id"
FROM (
    SELECT "user_id", ROW_NUMBER() OVER (ORDER BY "user_id") AS rn
    FROM "verified_users"
    WHERE "email" LIKE 'seed.user%@tomoio.local'
) u
CROSS JOIN generate_series(0, 1) AS offset_no;

INSERT INTO "user_hobbies" ("hobby_name", "user_id")
SELECT
    (ARRAY['アニメ','漫画','料理','旅行','写真','音楽','カフェ','言語交換','テクノロジー','スポーツ','読書','映画'])[((rn + offset_no) % 12) + 1],
    "user_id"
FROM (
    SELECT "user_id", ROW_NUMBER() OVER (ORDER BY "user_id") AS rn
    FROM "verified_users"
    WHERE "email" LIKE 'seed.user%@tomoio.local'
) u
CROSS JOIN generate_series(0, 2) AS offset_no;

INSERT INTO "groups" ("name", "created_at", "description", "group_avatar", "group_cover", "member_count")
SELECT
    (ARRAY[
        '日本語会話クラブ',
        'ベトナム語初心者グループ',
        'ハノイ生活情報交換',
        '東京ベトナム交流会',
        'JLPT N2勉強会',
        '旅行好きコミュニティ',
        'カフェで言語交換',
        '日本文化研究会',
        'ベトナム料理を楽しむ会',
        'IT・エンジニア交流会'
    ])[(gs % 10) + 1] || ' #' || LPAD(gs::text, 3, '0'),
    NOW() - ((50 - gs) * INTERVAL '1 day'),
    (ARRAY[
        '日本語で気軽に日常会話を楽しむグループです。初心者から上級者まで大歓迎！',
        'ベトナム語を学び始めたばかりの人のための勉強会です。基礎からゆっくり学びましょう。',
        'ハノイでの生活情報、おすすめレストラン、家探しなどの役立つ情報をシェアするグループです。',
        '東京近郊に住む日本人とベトナム人の交流コミュニティです。定期的にオフラインイベントを開催します。',
        'JLPT N2合格を目指して、文法や語彙、読解を一緒に勉強するグループです。',
        '日本とベトナムの旅行が大好きな人たちが集まるグループです。おすすめの観光スポットを共有しましょう。',
        '週末にカフェに集まって、コーヒーを飲みながら楽しく日本語とベトナム語で話すグループです。',
        '日本の伝統文化からポップカルチャー、アニメ、お祭りまで幅広く語り合うグループです。',
        'フォー、生春巻き、バインセオなど、美味しいベトナム料理を食べに行ったり一緒に作ったりするグループです。',
        '日本とベトナムのITエンジニア、プログラマーの技術交流・キャリア相談のためのグループです。'
    ])[(gs % 10) + 1],
    '/assets/images/groups/group-' || (((gs - 1) % 4) + 1)::text || '.jpg',
    '/assets/images/groups/group-cover.png',
    0
FROM generate_series(1, 50) AS gs;

INSERT INTO "group_hobby_tags" ("group_id", "name")
SELECT
    g."group_id",
    (ARRAY['言語交換','日本文化','旅行','文化交流','スポーツ','カフェ','アニメ','ベトナム料理','プログラミング'])[((g.rn + offset_no) % 9) + 1]
FROM (
    SELECT "group_id", ROW_NUMBER() OVER (ORDER BY "group_id") AS rn
    FROM "groups"
    WHERE "name" LIKE '% #%'
) g
CROSS JOIN generate_series(0, 1) AS offset_no;

INSERT INTO "group_language_tags" ("group_id", "name")
SELECT
    g."group_id",
    (ARRAY['N1','N2','N3','N4','N5','日本語','ベトナム語','英語'])[((g.rn + offset_no) % 8) + 1]
FROM (
    SELECT "group_id", ROW_NUMBER() OVER (ORDER BY "group_id") AS rn
    FROM "groups"
    WHERE "name" LIKE '% #%'
) g
CROSS JOIN generate_series(0, 1) AS offset_no;

INSERT INTO "group_members" ("user_id", "group_id", "joined_at")
SELECT DISTINCT
    u."user_id",
    g."group_id",
    NOW() - ((g.rn + offset_no) * INTERVAL '1 day')
FROM (
    SELECT "group_id", ROW_NUMBER() OVER (ORDER BY "group_id") AS rn
    FROM "groups"
    WHERE "name" LIKE '% #%'
) g
CROSS JOIN generate_series(0, 11) AS offset_no
JOIN (
    SELECT "user_id", ROW_NUMBER() OVER (ORDER BY "user_id") AS rn
    FROM "verified_users"
    WHERE "email" LIKE 'seed.user%@tomoio.local'
) u ON u.rn = (((g.rn + offset_no - 1) % 60) + 1);

UPDATE "groups" g
SET "member_count" = c.count_members
FROM (
    SELECT "group_id", COUNT(*)::int AS count_members
    FROM "group_members"
    GROUP BY "group_id"
) c
WHERE c."group_id" = g."group_id"
  AND g."name" LIKE '% #%';

-- =========================
-- Posts, chat, events, moderation
-- =========================

INSERT INTO "posts" ("content", "created_at", "group_id", "author_id", "image")
SELECT
    (ARRAY[
        'こんにちは！今週の勉強会用の資料をアップロードしました。参加する方は事前に目を通しておいてくださいね。',
        '皆さん、日本語を勉強するときに一番効果的だと思う方法は何ですか？私は漢字の書き取りとニュースを読むことです。',
        '今週末、東京で集まる予定のオフラインイベントについて、集合場所を変更しました。詳細はイベントページをご確認ください！',
        'ベトナム料理のフォーの作り方を共有します！日本で手に入る材料だけで作れるレシピにアレンジしてみました。',
        'JLPTの聴解テストで高得点を取るためのコツをまとめました。興味がある方はぜひ読んでみてください！',
        '最近ベトナム語の日常会話フレーズを勉強しています。ネイティブの方が使う自然な表現を教えてもらえると嬉しいです！',
        'ハノイのおすすめのカフェ情報をシェアします。静かでWi-Fiも早くて、勉強や作業にぴったりの場所です。',
        '日本の伝統的なマナーについて質問です。お辞儀の角度やタイミングについて、詳しく教えていただけないでしょうか？'
    ])[(((g.rn - 1) * 2 + slot - 1) % 8) + 1],
    NOW() - ((((g.rn - 1) * 2 + slot) % 45) * INTERVAL '1 day'),
    g."group_id",
    u."user_id",
    CASE WHEN slot = 1 THEN '/assets/images/recommendations/rec-' || ((((g.rn - 1) * 2 + slot - 1) % 3) + 1)::text || '.png' ELSE NULL END
FROM (
    SELECT "group_id", "name", ROW_NUMBER() OVER (ORDER BY "group_id") AS rn
    FROM "groups"
    WHERE "name" LIKE '% #%'
) g
CROSS JOIN generate_series(1, 2) AS slot
JOIN (
    SELECT "user_id", ROW_NUMBER() OVER (ORDER BY "user_id") AS rn
    FROM "verified_users"
    WHERE "email" LIKE 'seed.user%@tomoio.local'
) u ON u.rn = (((g.rn + slot - 2) % 60) + 1);

INSERT INTO "comments" ("content", "created_at", "post_id", "author_id")
SELECT
    (ARRAY[
        '有益な情報をありがとうございます！とても参考になりました。',
        '私もその方法で勉強しています！一緒に頑張りましょう。',
        '集合場所の変更了解しました。当日は楽しみにしています！',
        '美味しそうですね！今週末にさっそく作ってみます。',
        '詳細なまとめをありがとうございます。とても分かりやすいです！',
        '私がよく使う日常会話表現を今度メッセージで送りますね。',
        'そのカフェ、私も行ったことがあります！とても素敵な場所ですよね。',
        'お辞儀のマナーについては、次の交流会で実演しながら教えますね！'
    ])[(((p.rn - 1) * 2 + slot - 1) % 8) + 1],
    NOW() - (((p.rn + slot) % 30) * INTERVAL '1 day'),
    p."post_id",
    u."user_id"
FROM (
    SELECT "post_id", ROW_NUMBER() OVER (ORDER BY "post_id") AS rn
    FROM "posts"
) p
CROSS JOIN generate_series(1, 2) AS slot
JOIN (
    SELECT "user_id", ROW_NUMBER() OVER (ORDER BY "user_id") AS rn
    FROM "verified_users"
    WHERE "email" LIKE 'seed.user%@tomoio.local'
) u ON u.rn = (((p.rn + slot + 2) % 60) + 1);

INSERT INTO "post_likes" ("user_id", "post_id")
SELECT DISTINCT
    u."user_id",
    p."post_id"
FROM (
    SELECT "post_id", ROW_NUMBER() OVER (ORDER BY "post_id") AS rn
    FROM "posts"
) p
CROSS JOIN generate_series(1, 3) AS slot
JOIN (
    SELECT "user_id", ROW_NUMBER() OVER (ORDER BY "user_id") AS rn
    FROM "verified_users"
    WHERE "email" LIKE 'seed.user%@tomoio.local'
) u ON u.rn = (((p.rn + slot + 4) % 60) + 1);

CREATE TEMP TABLE "_new_seed_sessions" (
    "session_id" integer NOT NULL,
    "rn" integer NOT NULL
) ON COMMIT DROP;

WITH inserted AS (
    INSERT INTO "match_session" ("status", "created_at")
    SELECT
        CASE WHEN gs % 7 = 0 THEN 'BLOCKED' ELSE 'ACTIVE' END,
        NOW() - ((50 - gs) * INTERVAL '1 day')
    FROM generate_series(1, 50) AS gs
    RETURNING "session_id"
)
INSERT INTO "_new_seed_sessions" ("session_id", "rn")
SELECT
    "session_id",
    ROW_NUMBER() OVER (ORDER BY "session_id") AS rn
FROM inserted;

WITH seed_sessions AS (
    SELECT "session_id", "rn"
    FROM "_new_seed_sessions"
),
seed_users AS (
    SELECT "user_id", ROW_NUMBER() OVER (ORDER BY "user_id") AS rn
    FROM "verified_users"
    WHERE "email" LIKE 'seed.user%@tomoio.local'
)
INSERT INTO "match_participants" ("session_id", "user_id")
SELECT ss."session_id", su."user_id"
FROM seed_sessions ss
JOIN seed_users su ON su.rn = (((ss.rn - 1) % 60) + 1)
UNION ALL
SELECT ss."session_id", su."user_id"
FROM seed_sessions ss
JOIN seed_users su ON su.rn = (((ss.rn + 13 - 1) % 60) + 1);

WITH seed_sessions AS (
    SELECT "session_id", "rn"
    FROM "_new_seed_sessions"
),
participants AS (
    SELECT
        mp."session_id",
        mp."user_id",
        ROW_NUMBER() OVER (PARTITION BY mp."session_id" ORDER BY mp."user_id") AS participant_no
    FROM "match_participants" mp
    JOIN seed_sessions ss ON ss."session_id" = mp."session_id"
)
INSERT INTO "messages" (
    "content",
    "send_at",
    "session_id",
    "sender_id",
    "attachment_url",
    "deleted_at",
    "edited_at",
    "is_seen",
    "message_type",
    "translated_text"
)
SELECT
    CASE WHEN slot = 3 AND ss.rn % 5 = 0 THEN NULL 
         ELSE (ARRAY[
             'はじめまして！マッチングありがとうございます。日本語を勉強されているんですね！',
             'はじめまして！はい、今JLPT N2に向けて勉強しています。会話が苦手なので練習したいです。',
             '素晴らしいですね！私はベトナム語を学び始めたばかりなので、お互いに教え合えたら嬉しいです。',
             'ぜひ！週末に一度オンラインで話してみませんか？',
             'こんにちは！プロフィール写真のハロン湾、すごく綺麗ですね。旅行で行かれたんですか？',
             'ありがとうございます！はい、去年的夏に家族で行きました。ベトナム旅行は初めてでしたか？',
             '実はまだ行ったことがなくて、ずっと行ってみたいと思っているんです。おすすめの場所はありますか？',
             'ハノイの旧市街やホイアンが歴史情緒があっておすすめですよ！今度詳しくお話ししますね。',
             'こんにちは！ベトナム料理が好きなんですね。私もフォーやバインミーが大好きです！',
             'こんにちは！美味しいですよね。東京にもベトナム料理店がたくさんあって嬉しいです。',
             'おすすめの店はありますか？今度一緒に行ってみたいです！',
             '新宿にあるお店が本場の味に近くて美味しいですよ！今度一緒に行きましょう。',
             'マッチありがとうございます！好きなアニメは何ですか？',
             'こちらこそ！最近は『鬼滅の刃』や『進撃の巨人』をよく見ています。日本のアニメは最高ですね！',
             '私もそれ大好きです！最新シーズンは見ましたか？',
             'はい、もちろん見ました！語彙の勉強にもなるので、アニメはよく見ているんです。',
             'こんにちは！JLPTの勉強はどうですか？順調ですか？',
             'こんにちは。漢字の勉強が難しくて苦戦しています。おすすめの勉強法はありますか？',
             '漢字は書いて覚えるのも良いですが、日常の文章をたくさん読むと自然に身につきますよ。',
             'なるほど、参考になります！簡単なニュース記事から読んでみます。ありがとうございます！'
         ])[(((ss.rn - 1) % 5) * 4) + slot]
    END,
    NOW() - (((50 - ss.rn) + slot) * INTERVAL '1 day'),
    ss."session_id",
    CASE WHEN slot % 2 = 1 THEN p1."user_id" ELSE p2."user_id" END,
    CASE WHEN slot = 3 AND ss.rn % 5 = 0 THEN '/assets/images/recommendations/rec-' || (((ss.rn - 1) % 3) + 1)::text || '.png' ELSE NULL END,
    CASE WHEN slot = 4 AND ss.rn % 17 = 0 THEN NOW() - INTERVAL '1 day' ELSE NULL END,
    CASE WHEN slot = 2 AND ss.rn % 9 = 0 THEN NOW() - INTERVAL '1 day' ELSE NULL END,
    slot < 4,
    CASE WHEN slot = 3 AND ss.rn % 5 = 0 THEN 'IMAGE'::"MessageType" ELSE 'TEXT'::"MessageType" END,
    jsonb_build_object(
        'en', (ARRAY[
             'はじめまして！マッチングありがとうございます。日本語を勉強されているんですね！',
             'はじめまして！はい、今JLPT N2に向けて勉強しています。会話が苦手ので練習したいです。',
             '素晴らしいですね！私はベトナム語を学び始めたばかりなので、お互いに教え合えたら嬉しいです。',
             'ぜひ！週末に一度オンラインで話してみませんか？',
             'こんにちは！プロフィール写真のハロン湾、すごく綺麗ですね。旅行で行かれたんですか？',
             'ありがとうございます！はい、去年的夏に家族で行きました。ベトナム旅行は初めてでしたか？',
             '実はまだ行ったことがなくて、ずっと行ってみたいと思っているんです。おすすめの場所はありますか？',
             'ハノイの旧市街やホイアンが歴史情緒があっておすすめですよ！今度詳しくお話ししますね。',
             'こんにちは！ベトナム料理が好きなんですね。私もフォーやバインミーが大好きです！',
             'こんにちは！美味しいですよね。東京にもベトナム料理店がたくさんあって嬉しいです。',
             'おすすめの店はありますか？今度一緒に行ってみたいです！',
             '新宿にあるお店が本場の味に近くて美味しいですよ！今度一緒に行きましょう。',
             'マッチありがとうございます！好きなアニメは何ですか？',
             'こちらこそ！最近は『鬼滅の刃』や『進撃の巨人』をよく見ています。日本のアニメは最高ですね！',
             '私もそれ大好きです！最新シーズンは見ましたか？',
             'はい、もちろん見ました！語彙の勉強にもなるので、アニメはよく見ているんです。',
             'こんにちは！JLPTの勉強はどうですか？順調ですか？',
             'こんにちは。漢字の勉強が難しくて苦戦しています。おすすめの勉強法はありますか？',
             '漢字は書いて覚えるのも良いですが、日常の文章をたくさん読むと自然に身につきますよ。',
             'なるほど、参考になります！簡単なニュース記事から読んでみます。ありがとうございます！'
         ])[(((ss.rn - 1) % 5) * 4) + slot],
        'vi', (ARRAY[
             'Rất vui được làm quen với bạn! Cảm ơn bạn đã match với mình. Bạn đang học tiếng Nhật đúng không?',
             'Chào bạn! Vâng, mình đang ôn thi JLPT N2. Mình giao tiếp chưa tốt nên rất muốn luyện tập thêm.',
             'Tuyệt vời quá! Mình mới bắt đầu học tiếng Việt, hi vọng chúng ta có thể giúp đỡ lẫn nhau.',
             'Nhất trí ạ! Cuối tuần này chúng mình gọi điện nói chuyện online thử nhé?',
             'Chào bạn! Ảnh Vịnh Hạ Long trên trang cá nhân của bạn đẹp quá. Bạn đi du lịch ở đó à?',
             'Cảm ơn bạn! Đúng vậy, mùa hè năm ngoái mình đi cùng gia đình. Đó là lần đầu tiên bạn đến Việt Nam à?',
             'Thật ra mình chưa đi bao giờ, nhưng luôn muốn ghé thăm. Bạn có gợi ý địa điểm nào không?',
             'Phố cổ Hà Nội hay Hội An có không khí cổ kính và rất đáng đi đó! Lần tới mình sẽ kể chi tiết hơn nhé.',
             'Chào bạn! Bạn thích món ăn Việt Nam à. Mình cũng cực kỳ mê phở và bánh mì!',
             'Chào bạn! Công nhận ngon thật. Mình rất vui vì ở Tokyo cũng có nhiều quán ăn Việt Nam.',
             'Bạn có biết quán nào ngon không? Hôm nào chúng mình cùng đi ăn đi!',
             'Có một quán ở Shinjuku vị rất chuẩn và ngon đó! Hôm nào đi cùng nhau nhé.',
             'Cảm ơn bạn đã match! Bộ anime yêu thích của bạn là gì vậy?',
             'Cảm ơn bạn! Dạo này mình hay xem Kimetsu no Yaiba và Attack on Titan. Anime Nhật Bản là đỉnh nhất!',
             'Mình cũng thích mấy bộ đó lắm! Bạn đã xem mùa mới nhất chưa?',
             'Vâng tất nhiên là xem rồi! Mình thường xem anime vừa giải trí vừa học thêm từ vựng.',
             'Chào bạn! Việc học JLPT của bạn thế nào rồi? Có thuận lợi không?',
             'Chào bạn. Học kanji khó quá nên mình đang hơi chật vật. Bạn có phương pháp nào hay không?',
             'Kanji viết đi viết lại cũng tốt, nhưng nếu bạn đọc nhiều văn bản thực tế thì sẽ nhớ tự nhiên hơn đó.',
             'À ra thế, bổ ích quá! Mình sẽ thử đọc các bài báo tin tức đơn giản. Cảm ơn bạn nhé!'
         ])[(((ss.rn - 1) % 5) * 4) + slot],
        'ja', (ARRAY[
             'はじめまして！マッチングありがとうございます。日本語を勉強されているんですね！',
             'はじめまして！はい、今JLPT N2に向けて勉強しています。会話が苦手なので練習したいです。',
             '素晴らしいですね！私はベトナム語を学び始めたばかりなので、お互いに教え合えたら嬉しいです。',
             'ぜひ！週末に一度オンラインで話してみませんか？',
             'こんにちは！プロフィール写真のハロン湾、すごく綺麗ですね。旅行で行かれたんですか？',
             'ありがとうございます！はい、去年的夏に家族で行きました。ベトナム旅行は初めてでしたか？',
             '実はまだ行ったことがなくて、ずっと行ってみたいと思っているんです。おすすめの場所はありますか？',
             'ハノイの旧市街やホイアンが歴史情緒があっておすすめですよ！今度詳しくお話ししますね。',
             'こんにちは！ベトナム料理が好きなんですね。私もフォーやバインミーが大好きです！',
             'こんにちは！美味しいですよね。東京にもベトナム料理店がたくさんあって嬉しいです。',
             'おすすめの店はありますか？今度一緒に行ってみたいです！',
             '新宿にあるお店が本場の味に近くて美味しいですよ！今度一緒に行きましょう。',
             'マッチありがとうございます！好きなアニメは何ですか？',
             'こちらこそ！最近は『鬼滅の刃』や『進撃の巨人』をよく見ています。日本のアニメは最高ですね！',
             '私もそれ大好きです！最新シーズンは見ましたか？',
             'はい、もちろん見ました！語彙の勉強にもなるので、アニメはよく見ているんです。',
             'こんにちは！JLPTの勉強はどうですか？順調ですか？',
             'こんにちは。漢字の勉強が難しくて苦戦しています。おすすめの勉強法はありますか？',
             '漢字は書いて覚えるのも良いですが、日常の文章をたくさん読むと自然に身につきますよ。',
             'なるほど、参考になります！簡単なニュース記事から読んでみます。ありがとうございます！'
         ])[(((ss.rn - 1) % 5) * 4) + slot]
    )
FROM seed_sessions ss
CROSS JOIN generate_series(1, 4) AS slot
JOIN participants p1 ON p1."session_id" = ss."session_id" AND p1.participant_no = 1
JOIN participants p2 ON p2."session_id" = ss."session_id" AND p2.participant_no = 2;

INSERT INTO "events" (
    "title",
    "description",
    "event_time",
    "format",
    "address",
    "url_link",
    "image_url",
    "created_at",
    "admin_id",
    "administratorId",
    "status"
)
SELECT
    (ARRAY[
        'ハノイ日本語交流会',
        '東京ベトナム語カフェ会',
        'JLPT N2 模擬会話練習',
        'ベトナム料理体験イベント',
        '日本文化オンライン交流会',
        '留学経験シェア会',
        '写真好きの散歩交流会',
        'キャリア相談ミートアップ'
    ])[((gs - 1) % 8) + 1] || ' #' || LPAD(gs::text, 3, '0'),
    (ARRAY[
        'ハノイのカフェで日本語のフリートークを楽しむ交流会です。ベトナム人と日本人の参加者をお待ちしています！',
        '東京のカフェに集まって、美味しいコーヒーを飲みながらベトナム語と日本語で交流しましょう。初心者歓迎！',
        'JLPT N2レベルの表現を使って、様々なトピックでディスカッションを行うオンラインの模擬会話練習会です。',
        'みんなで一緒にベトナムの生春巻きやフォーを作る料理体験会です。料理の後は楽しく試食＆おしゃべりタイム！',
        '自宅から参加できるオンラインの文化交流会です。日本のお祭りや四季のイベント、アニメについて楽しく語り合いましょう。',
        '日本への留学やベトナムへの留学を経験した先輩たちが、リアルな体験談やアドバイスをシェアする相談会です。',
        'カメラやスマホを持って街を散策しながら、素敵な写真を撮って交流する散歩イベントです。初心者も大歓迎！',
        '日系企業で働きたいベトナム人の方や、ベトナムで働きたい日本人の方のための情報交換・キャリア相談会です。'
    ])[((gs - 1) % 8) + 1],
    NOW() + (gs * INTERVAL '1 day'),
    (ARRAY['ONLINE','OFFLINE','HYBRID'])[(gs % 3) + 1],
    CASE WHEN (ARRAY['ONLINE','OFFLINE','HYBRID'])[(gs % 3) + 1] = 'ONLINE' THEN NULL ELSE (100 + gs)::text || '番通り, ' || (ARRAY['東京','大阪','ハノイ','ホーチミン','ダナン'])[(gs % 5) + 1] END,
    CASE WHEN (ARRAY['ONLINE','OFFLINE','HYBRID'])[(gs % 3) + 1] = 'ONLINE' THEN 'https://tomoio.local/events/seed-' || LPAD(gs::text, 3, '0') ELSE NULL END,
    '/assets/images/events/event-' || (((gs - 1) % 4) + 1)::text || '.png',
    NOW() - (gs * INTERVAL '1 day'),
    u."user_id",
    a."admin_id",
    ((ARRAY['PENDING','APPROVED','REJECTED'])[(gs % 3) + 1])::"EventStatus"
FROM generate_series(1, 50) AS gs
JOIN (
    SELECT "user_id", ROW_NUMBER() OVER (ORDER BY "user_id") AS rn
    FROM "verified_users"
    WHERE "email" LIKE 'seed.user%@tomoio.local'
) u ON u.rn = ((gs % 60) + 1)
JOIN (
    SELECT "admin_id", ROW_NUMBER() OVER (ORDER BY "admin_id") AS rn
    FROM "administrators"
    WHERE "username" LIKE 'seed_admin_%'
) a ON a.rn = ((gs % 50) + 1);

INSERT INTO "event_engagements" ("event_id", "user_id", "engagement_type", "engaged_at")
SELECT DISTINCT
    e."event_id",
    u."user_id",
    CASE WHEN slot % 3 = 0 THEN 'INTERESTED' ELSE 'JOINED' END,
    NOW() - ((e.rn + slot) * INTERVAL '1 day')
FROM (
    SELECT "event_id", ROW_NUMBER() OVER (ORDER BY "event_id") AS rn
    FROM "events"
    WHERE "url_link" LIKE 'https://tomoio.local/events/seed-%'
) e
CROSS JOIN generate_series(1, 5) AS slot
JOIN (
    SELECT "user_id", ROW_NUMBER() OVER (ORDER BY "user_id") AS rn
    FROM "verified_users"
    WHERE "email" LIKE 'seed.user%@tomoio.local'
) u ON u.rn = (((e.rn + slot + 6) % 60) + 1);

INSERT INTO "kyc_requests" ("document_image_url", "reject_reason", "submitted_at", "reviewed_at", "user_id", "admin_id", "status")
SELECT
    '/assets/images/home/hero-bg.png',
    CASE WHEN u.rn % 3 = 2 THEN '身分証明書の画像が不鮮明です。もう一度アップロードしてください。' ELSE NULL END,
    NOW() - ((60 - u.rn) * INTERVAL '1 day'),
    CASE WHEN u.rn % 3 = 0 THEN NULL ELSE NOW() - ((59 - u.rn) * INTERVAL '1 day') END,
    u."user_id",
    CASE WHEN u.rn % 3 = 0 THEN NULL ELSE a."admin_id" END,
    ((ARRAY['PENDING','APPROVED','REJECTED'])[(u.rn % 3) + 1])::"KycStatus"
FROM (
    SELECT "user_id", ROW_NUMBER() OVER (ORDER BY "user_id") AS rn
    FROM "verified_users"
    WHERE "email" LIKE 'seed.user%@tomoio.local'
) u
LEFT JOIN (
    SELECT "admin_id", ROW_NUMBER() OVER (ORDER BY "admin_id") AS rn
    FROM "administrators"
    WHERE "username" LIKE 'seed_admin_%'
) a ON a.rn = (((u.rn - 1) % 50) + 1);

INSERT INTO "report_cases" ("reason", "evidence_url", "created_at", "admin_id", "status")
SELECT
    '不適切な表現が含まれている、またはスパム行為の可能性があります。',
    '/assets/images/home/hero-bg.png',
    NOW() - ((50 - gs) * INTERVAL '1 day'),
    a."admin_id",
    ((ARRAY['PENDING','APPROVED','REJECTED'])[(gs % 3) + 1])::"ReportCaseStatus"
FROM generate_series(1, 50) AS gs
JOIN (
    SELECT "admin_id", ROW_NUMBER() OVER (ORDER BY "admin_id") AS rn
    FROM "administrators"
    WHERE "username" LIKE 'seed_admin_%'
) a ON a.rn = ((gs % 50) + 1);

WITH reports AS (
    SELECT "case_id", ROW_NUMBER() OVER (ORDER BY "case_id") AS rn
    FROM "report_cases"
    WHERE "evidence_url" = '/assets/images/home/hero-bg.png'
),
users AS (
    SELECT "user_id", ROW_NUMBER() OVER (ORDER BY "user_id") AS rn
    FROM "verified_users"
    WHERE "email" LIKE 'seed.user%@tomoio.local'
)
INSERT INTO "report_parties" ("user_id", "case_id", "party_role")
SELECT u."user_id", r."case_id", 'REPORTER'
FROM reports r
JOIN users u ON u.rn = (((r.rn - 1) % 60) + 1)
UNION ALL
SELECT u."user_id", r."case_id", 'REPORTED'
FROM reports r
JOIN users u ON u.rn = (((r.rn + 19 - 1) % 60) + 1);

WITH users AS (
    SELECT "user_id", ROW_NUMBER() OVER (ORDER BY "user_id") AS rn
    FROM "verified_users"
    WHERE "email" LIKE 'seed.user%@tomoio.local'
),
actions AS (
    SELECT
        actor_no,
        offset_no,
        action_name
    FROM generate_series(1, 50) AS actor_no
    CROSS JOIN generate_series(1, 3) AS offset_no
    CROSS JOIN LATERAL (
        SELECT (ARRAY['LIKE','PASS','BLOCK'])[offset_no] AS action_name
    ) action_pick
)
INSERT INTO "user_profile_actions" ("actor_id", "target_id", "action", "created_at")
SELECT
    actor."user_id",
    target_user."user_id",
    actions.action_name::"ProfileActionType",
    NOW() - (((actions.actor_no + actions.offset_no) % 40) * INTERVAL '1 day')
FROM actions
JOIN users actor ON actor.rn = actions.actor_no
JOIN users target_user ON target_user.rn = (((actions.actor_no + actions.offset_no - 1) % 60) + 1);

WITH users AS (
    SELECT "user_id", ROW_NUMBER() OVER (ORDER BY "user_id") AS rn
    FROM "verified_users"
    WHERE "email" LIKE 'seed.user%@tomoio.local'
),
sessions AS (
    SELECT "session_id", "rn"
    FROM "_new_seed_sessions"
)
INSERT INTO "Notification" ("userId", "type", "message", "related_user_id", "session_id", "isRead", "createdAt")
SELECT
    recipient."user_id",
    (ARRAY['MATCH','MESSAGE','EVENT','GROUP','SYSTEM'])[(gs % 5) + 1],
    (ARRAY[
        '新しいマッチが成立しました！さっそくチャットを送ってみましょう。',
        '新着メッセージが届いています。',
        '参加予定のイベントが明日開催されます。',
        '新しいコミュニティグループが作成されました。',
        '身分証の確認が完了し、アカウントが承認されました。'
    ])[(gs % 5) + 1],
    related_user."user_id",
    sessions."session_id",
    gs % 4 = 0,
    NOW() - ((gs % 35) * INTERVAL '1 day')
FROM generate_series(1, 120) AS gs
JOIN users recipient ON recipient.rn = (((gs - 1) % 60) + 1)
JOIN users related_user ON related_user.rn = (((gs + 8) % 60) + 1)
JOIN sessions ON sessions.rn = (((gs - 1) % 50) + 1);

COMMIT;

-- Quick check
SELECT 'verified_users' AS table_name, COUNT(*) AS seed_count
FROM "verified_users"
WHERE "email" LIKE 'seed.user%@tomoio.local'
UNION ALL
SELECT 'administrators', COUNT(*) FROM "administrators" WHERE "username" LIKE 'seed_admin_%'
UNION ALL
SELECT 'groups', COUNT(*) FROM "groups" WHERE "name" LIKE '% #%'
UNION ALL
SELECT 'posts', COUNT(*) FROM "posts" WHERE "content" LIKE '%！%' OR "content" LIKE '%？%' OR "content" LIKE '%。%'
UNION ALL
SELECT 'match_session', COUNT(*)
FROM "match_session" ms
WHERE EXISTS (
    SELECT 1
    FROM "match_participants" mp
    JOIN "verified_users" vu ON vu."user_id" = mp."user_id"
    WHERE mp."session_id" = ms."session_id"
      AND vu."email" LIKE 'seed.user%@tomoio.local'
)
UNION ALL
SELECT 'events', COUNT(*) FROM "events" WHERE "url_link" LIKE 'https://tomoio.local/events/seed-%'
UNION ALL
SELECT 'report_cases', COUNT(*) FROM "report_cases" WHERE "evidence_url" = '/assets/images/home/hero-bg.png'
UNION ALL
SELECT 'notifications', COUNT(*)
FROM "Notification" n
JOIN "verified_users" vu ON vu."user_id" = n."userId"
WHERE vu."email" LIKE 'seed.user%@tomoio.local';
