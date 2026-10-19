import type { DosenQuizSubmission, DosenTaskSubmissionDetail, DosenTaskSubmissionSummary } from "./learning-api";
import { getDosenModule, listDosenModules, listDosenTaskSubmissions } from "./learning-api";

export type ReviewMetric = {
  label: string;
  value: number | string;
};

export type ReviewCard = {
  id: string;
  title: string;
  description: string;
  href: string;
  metrics: ReviewMetric[];
};

export type ReviewTaskSubmissionRow = DosenTaskSubmissionSummary & {
  taskId: string;
  taskTitle: string;
  moduleId: string;
  moduleTitle: string;
};

export type TaskSubmissionRow = ReviewTaskSubmissionRow;

export type ReviewTaskClassCard = {
  className: string;
  homeroomName: string;
  studentCount: number;
  subjectCount: number;
  pendingCount: number;
  averageScore: number | null;
};

export type ReviewTaskSubjectCard = {
  subjectName: string;
  submissionCount: number;
  taskCount: number;
  pendingCount: number;
  averageScore: number | null;
};

export type ReviewTaskCard = {
  taskId: string;
  taskTitle: string;
  submissionCount: number;
  studentCount: number;
  pendingCount: number;
  averageScore: number | null;
  latestSubmittedAt: string | null;
};

export function encodeReviewSegment(value: string) {
  return encodeURIComponent(encodeURIComponent(value));
}

export function decodeReviewSegment(value: string | undefined) {
  let decoded = value ?? "";

  for (let index = 0; index < 2; index += 1) {
    try {
      const nextValue = decodeURIComponent(decoded);
      if (nextValue === decoded) break;
      decoded = nextValue;
    } catch {
      break;
    }
  }

  return decoded;
}

export function formatTaskSubmittedAt(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getTaskReviewLabel(submission: ReviewTaskSubmissionRow | DosenTaskSubmissionDetail) {
  if (submission.status === "revised") return "Perlu revisi";
  if (submission.status === "graded" && submission.score !== null) return "Sudah dinilai";
  return "Belum direview";
}

export function getTaskReviewTone(submission: ReviewTaskSubmissionRow | DosenTaskSubmissionDetail) {
  if (submission.status === "revised") return "warning";
  if (submission.status === "graded" && submission.score !== null) return "success";
  return "review";
}

function averageScore(rows: Array<{ score: number | null }>) {
  const scores = rows
    .map((row) => row.score)
    .filter((score): score is number => typeof score === "number");

  if (scores.length === 0) return null;

  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
}

function uniqueCount<T extends object>(rows: T[], key: keyof T) {
  return new Set(rows.map((row) => row[key]).filter(Boolean)).size;
}

function isPendingTask(row: ReviewTaskSubmissionRow) {
  return getTaskReviewLabel(row) !== "Sudah dinilai";
}

function isPendingQuiz(row: DosenQuizSubmission) {
  return row.status === "pending" || row.status === "retake";
}

export function buildTaskClassCards(submissions: ReviewTaskSubmissionRow[]) {
  const grouped = new Map<string, ReviewTaskSubmissionRow[]>();

  submissions.forEach((submission) => {
    const classRows = grouped.get(submission.className) ?? [];
    classRows.push(submission);
    grouped.set(submission.className, classRows);
  });

  return Array.from(grouped.entries())
    .map<ReviewCard>(([className, classRows]) => ({
      id: className,
      title: className,
      description: "Pilih kelas ini untuk melihat mata kuliah dengan pengumpulan tugas.",
      href: `/dosen/review-tugas/kelas/${encodeReviewSegment(className)}`,
      metrics: [
        { label: "Mahasiswa", value: uniqueCount(classRows, "studentName") },
        { label: "Mata kuliah", value: uniqueCount(classRows, "moduleTitle") },
        { label: "Perlu review", value: classRows.filter(isPendingTask).length },
      ],
    }))
    .sort((left, right) => left.title.localeCompare(right.title, "id"));
}

export function buildTaskSubjectCards(submissions: ReviewTaskSubmissionRow[], className: string) {
  const classRows = submissions.filter((row) => row.className === className);
  const subjectNames = [...new Set(classRows.map((row) => row.moduleTitle).filter(Boolean))].sort();

  return subjectNames.map<ReviewCard>((subjectName) => {
    const subjectRows = classRows.filter((row) => row.moduleTitle === subjectName);
    const score = averageScore(subjectRows);

    return {
      id: subjectName,
      title: subjectName,
      description: "Buka mata kuliah ini untuk memilih tugas yang akan direview.",
      href: `/dosen/review-tugas/kelas/${encodeReviewSegment(className)}/mata-kuliah/${encodeReviewSegment(subjectName)}`,
      metrics: [
        { label: "Tugas", value: uniqueCount(subjectRows, "taskTitle") },
        { label: "Pengumpulan", value: subjectRows.length },
        { label: "Rata-rata nilai", value: score ?? "-" },
      ],
    };
  });
}

export function buildTaskAssignmentCards(
  submissions: ReviewTaskSubmissionRow[],
  className: string,
  subjectName: string
) {
  const subjectRows = submissions.filter(
    (row) => row.className === className && row.moduleTitle === subjectName
  );
  const grouped = new Map<string, ReviewTaskSubmissionRow[]>();

  subjectRows.forEach((submission) => {
    const taskRows = grouped.get(submission.taskId) ?? [];
    taskRows.push(submission);
    grouped.set(submission.taskId, taskRows);
  });

  return Array.from(grouped.entries())
    .map<ReviewCard>(([taskId, taskRows]) => {
      const score = averageScore(taskRows);
      const taskTitle = taskRows[0]?.taskTitle ?? "Tugas";

      return {
        id: taskId,
        title: taskTitle,
        description: "Buka daftar pengumpulan untuk review dan cek integritas.",
        href: `/dosen/review-tugas/kelas/${encodeReviewSegment(className)}/mata-kuliah/${encodeReviewSegment(subjectName)}/tugas/${encodeReviewSegment(taskId)}`,
        metrics: [
          { label: "Pengumpulan", value: taskRows.length },
          { label: "Perlu review", value: taskRows.filter(isPendingTask).length },
          { label: "Rata-rata nilai", value: score ?? "-" },
        ],
      };
    })
    .sort((left, right) => left.title.localeCompare(right.title, "id"));
}

export function filterTaskSubmissions(
  rows: ReviewTaskSubmissionRow[],
  className: string,
  subjectName: string,
  taskId: string
) {
  return rows
    .filter(
      (row) =>
        row.className === className &&
        row.moduleTitle === subjectName &&
        row.taskId === taskId
    )
    .sort((left, right) => {
      const leftTime = left.submittedAt ? new Date(left.submittedAt).getTime() : 0;
      const rightTime = right.submittedAt ? new Date(right.submittedAt).getTime() : 0;
      return rightTime - leftTime;
    });
}

export async function loadTaskReviewRows() {
  const modules = await listDosenModules();
  if (modules.length === 0) return [];

  const moduleDetails = await Promise.all(modules.map((module) => getDosenModule(module.id)));
  const submissionGroups = await Promise.all(
    moduleDetails.map(async (moduleDetail) =>
      Promise.all(
        moduleDetail.tasks.map(async (task) => {
          const rows = await listDosenTaskSubmissions(task.id);
          return rows.map<ReviewTaskSubmissionRow>((row) => ({
            ...row,
            taskId: task.id,
            taskTitle: task.title,
            moduleId: moduleDetail.id,
            moduleTitle: moduleDetail.title,
          }));
        })
      )
    )
  );

  return submissionGroups.flat(2).sort((left, right) => {
    const leftTime = left.submittedAt ? new Date(left.submittedAt).getTime() : 0;
    const rightTime = right.submittedAt ? new Date(right.submittedAt).getTime() : 0;
    return rightTime - leftTime;
  });
}

export function buildQuizClassCards(rows: DosenQuizSubmission[]): ReviewCard[] {
  const classNames = [...new Set(rows.map((row) => row.className).filter(Boolean))].sort();

  return classNames.map((className) => {
    const classRows = rows.filter((row) => row.className === className);

    return {
      id: className,
      title: className,
      description: "Pilih kelas ini untuk melihat mata kuliah dengan pengumpulan kuis.",
      href: `/dosen/review-kuis/kelas/${encodeReviewSegment(className)}`,
      metrics: [
        { label: "Mahasiswa", value: uniqueCount(classRows, "studentName") },
        { label: "Kuis", value: uniqueCount(classRows, "assignmentTitle") },
        { label: "Perlu review", value: classRows.filter(isPendingQuiz).length },
      ],
    };
  });
}

export function buildQuizSubjectCards(rows: DosenQuizSubmission[], className: string): ReviewCard[] {
  const classRows = rows.filter((row) => row.className === className);
  const subjectNames = [...new Set(classRows.map((row) => row.courseTitle).filter(Boolean))].sort();

  return subjectNames.map((subjectName) => {
    const subjectRows = classRows.filter((row) => row.courseTitle === subjectName);
    const score = averageScore(subjectRows);

    return {
      id: subjectName,
      title: subjectName,
      description: "Buka mata kuliah ini untuk melihat pengumpulan kuis.",
      href: `/dosen/review-kuis/kelas/${encodeReviewSegment(className)}/mata-kuliah/${encodeReviewSegment(subjectName)}`,
      metrics: [
        { label: "Kuis", value: uniqueCount(subjectRows, "assignmentTitle") },
        { label: "Pengumpulan", value: subjectRows.length },
        { label: "Rata-rata nilai", value: score ?? "-" },
      ],
    };
  });
}

export function filterQuizSubmissions(rows: DosenQuizSubmission[], className: string, subjectName: string) {
  return rows.filter((row) => row.className === className && row.courseTitle === subjectName);
}
