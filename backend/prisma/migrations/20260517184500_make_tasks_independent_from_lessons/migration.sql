ALTER TABLE "tasks"
ADD COLUMN IF NOT EXISTS "section_id" BIGINT;

UPDATE "tasks" AS t
SET "section_id" = l."section_id"
FROM "lessons" AS l
WHERE t."lesson_id" = l."id"
  AND t."section_id" IS NULL;

ALTER TABLE "tasks"
DROP CONSTRAINT IF EXISTS "tasks_lesson_id_fkey";

ALTER TABLE "tasks"
DROP CONSTRAINT IF EXISTS "tasks_section_id_fkey";

ALTER TABLE "tasks"
ALTER COLUMN "lesson_id" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "tasks_section_id_index"
ON "tasks"("section_id");

ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_lesson_id_fkey"
FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_section_id_fkey"
FOREIGN KEY ("section_id") REFERENCES "sections"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
