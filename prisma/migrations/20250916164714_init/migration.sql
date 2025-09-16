-- CreateTable
CREATE TABLE "public"."users" (
  "id" SERIAL NOT NULL,
  "username" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "profile_image_url" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."posts" (
  "id" SERIAL NOT NULL,
  "author_id" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3),
  CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."post_items" (
  "id" SERIAL NOT NULL,
  "post_id" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "condition" TEXT,
  "image_url" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "post_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."responses" (
  "id" SERIAL NOT NULL,
  "post_id" INTEGER NOT NULL,
  "author_id" INTEGER NOT NULL,
  "message" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."response_items" (
  "id" SERIAL NOT NULL,
  "response_id" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "condition" TEXT,
  "image_url" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "response_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."trades" (
  "id" SERIAL NOT NULL,
  "post_id" INTEGER NOT NULL,
  "response_id" INTEGER NOT NULL,
  "agreed_at" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'completed',
  CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users" ("username");

-- AddForeignKey
ALTER TABLE "public"."posts"
ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."post_items"
ADD CONSTRAINT "post_items_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."responses"
ADD CONSTRAINT "responses_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."responses"
ADD CONSTRAINT "responses_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."response_items"
ADD CONSTRAINT "response_items_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "public"."responses" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trades"
ADD CONSTRAINT "trades_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."trades"
ADD CONSTRAINT "trades_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "public"."responses" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
