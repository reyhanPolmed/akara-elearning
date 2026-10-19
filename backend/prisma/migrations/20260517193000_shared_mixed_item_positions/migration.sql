ALTER TABLE "tasks"
ADD COLUMN IF NOT EXISTS "posisi" INTEGER;

WITH ordered_items AS (
  SELECT
    item_type,
    item_id,
    ROW_NUMBER() OVER (
      PARTITION BY module_student_class_id, section_id
      ORDER BY created_at ASC NULLS LAST, item_type ASC, item_id ASC
    ) AS new_posisi
  FROM (
    SELECT
      'lesson'::text AS item_type,
      id AS item_id,
      module_student_class_id,
      section_id,
      created_at
    FROM lessons
    UNION ALL
    SELECT
      'quiz'::text AS item_type,
      id AS item_id,
      modules_student_class_id AS module_student_class_id,
      section_id,
      created_at
    FROM quizzes
    UNION ALL
    SELECT
      'task'::text AS item_type,
      id AS item_id,
      modules_student_class_id AS module_student_class_id,
      section_id,
      created_at
    FROM tasks
  ) AS mixed
)
UPDATE lessons AS l
SET
  posisi = oi.new_posisi,
  urutan = oi.new_posisi
FROM ordered_items AS oi
WHERE oi.item_type = 'lesson'
  AND oi.item_id = l.id;

WITH ordered_items AS (
  SELECT
    item_type,
    item_id,
    ROW_NUMBER() OVER (
      PARTITION BY module_student_class_id, section_id
      ORDER BY created_at ASC NULLS LAST, item_type ASC, item_id ASC
    ) AS new_posisi
  FROM (
    SELECT
      'lesson'::text AS item_type,
      id AS item_id,
      module_student_class_id,
      section_id,
      created_at
    FROM lessons
    UNION ALL
    SELECT
      'quiz'::text AS item_type,
      id AS item_id,
      modules_student_class_id AS module_student_class_id,
      section_id,
      created_at
    FROM quizzes
    UNION ALL
    SELECT
      'task'::text AS item_type,
      id AS item_id,
      modules_student_class_id AS module_student_class_id,
      section_id,
      created_at
    FROM tasks
  ) AS mixed
)
UPDATE quizzes AS q
SET posisi = oi.new_posisi
FROM ordered_items AS oi
WHERE oi.item_type = 'quiz'
  AND oi.item_id = q.id;

WITH ordered_items AS (
  SELECT
    item_type,
    item_id,
    ROW_NUMBER() OVER (
      PARTITION BY module_student_class_id, section_id
      ORDER BY created_at ASC NULLS LAST, item_type ASC, item_id ASC
    ) AS new_posisi
  FROM (
    SELECT
      'lesson'::text AS item_type,
      id AS item_id,
      module_student_class_id,
      section_id,
      created_at
    FROM lessons
    UNION ALL
    SELECT
      'quiz'::text AS item_type,
      id AS item_id,
      modules_student_class_id AS module_student_class_id,
      section_id,
      created_at
    FROM quizzes
    UNION ALL
    SELECT
      'task'::text AS item_type,
      id AS item_id,
      modules_student_class_id AS module_student_class_id,
      section_id,
      created_at
    FROM tasks
  ) AS mixed
)
UPDATE tasks AS t
SET posisi = oi.new_posisi
FROM ordered_items AS oi
WHERE oi.item_type = 'task'
  AND oi.item_id = t.id;

UPDATE tasks
SET posisi = 1
WHERE posisi IS NULL;

ALTER TABLE "tasks"
ALTER COLUMN "posisi" SET NOT NULL,
ALTER COLUMN "posisi" SET DEFAULT 1;
