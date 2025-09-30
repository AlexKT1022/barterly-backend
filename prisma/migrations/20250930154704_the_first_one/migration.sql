-- AlterTable
ALTER TABLE "public"."responses" ADD COLUMN     "child_post_id" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."responses" ADD CONSTRAINT "responses_child_post_id_fkey" FOREIGN KEY ("child_post_id") REFERENCES "public"."posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
