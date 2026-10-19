CREATE TABLE "task_submission_similarity_checks" (
    "id" BIGSERIAL NOT NULL,
    "task_submission_id" BIGINT NOT NULL,
    "tenant_id" VARCHAR(255) NOT NULL,
    "external_id" VARCHAR(255) NOT NULL,
    "similarity_document_id" VARCHAR(255),
    "similarity_job_id" VARCHAR(255),
    "similarity_status" VARCHAR(30) NOT NULL DEFAULT 'not_requested',
    "provider_status" VARCHAR(40),
    "max_similarity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "similarity_level" VARCHAR(20),
    "revision" INTEGER NOT NULL DEFAULT 0,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(0),
    "last_synced_at" TIMESTAMP(0),
    "checked_at" TIMESTAMP(0),
    "similarity_error" TEXT,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL,

    CONSTRAINT "task_submission_similarity_checks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "task_submission_similarity_checks_task_submission_id_key"
ON "task_submission_similarity_checks"("task_submission_id");

CREATE INDEX "task_submission_similarity_checks_status_retry_index"
ON "task_submission_similarity_checks"("similarity_status", "next_retry_at");

ALTER TABLE "task_submission_similarity_checks"
ADD CONSTRAINT "task_submission_similarity_checks_task_submission_id_fkey"
FOREIGN KEY ("task_submission_id") REFERENCES "task_submissions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
