ALTER TABLE "tasks"
ADD COLUMN "submit_method" VARCHAR(20) NOT NULL DEFAULT 'link';

ALTER TABLE "task_submissions"
ALTER COLUMN "submission_link" DROP NOT NULL,
ADD COLUMN "submission_file_path" VARCHAR(255),
ADD COLUMN "submission_file_type" VARCHAR(100);
