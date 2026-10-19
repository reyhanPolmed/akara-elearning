import { apiClient } from "./api-client";

export type LearningSidebarItem = {
  id: string;
  title: string;
  type: "lesson" | "quiz" | "task";
  href: string;
  isLocked: boolean;
  isCompleted: boolean;
  chapter: string;
};

export type MahasiswaProfile = {
  id: string;
  fullName: string;
  email: string;
  className: string;
  department: string;
  weeklyProgress: number;
  phone: string;
  bio: string;
  nisn: string;
};

export type MahasiswaModuleSummary = {
  id: string;
  title: string;
  department: string;
  dosenName: string;
  completionRate: number;
  totalItems: number;
  nextItemTitle: string;
  accent?: string;
  bannerLabel?: string;
};

export type MahasiswaModuleDetail = MahasiswaModuleSummary & {
  description: string;
  sections: Array<{
    id: string;
    title: string;
    description: string;
    items: LearningSidebarItem[];
  }>;
};

type MahasiswaModuleResponse = Omit<MahasiswaModuleSummary, "dosenName"> & {
  teacherName?: string;
  dosenName?: string;
};

type MahasiswaModuleDetailResponse = Omit<MahasiswaModuleDetail, "dosenName"> & {
  teacherName?: string;
  dosenName?: string;
};

export type MahasiswaTaskDetail = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueAt: string;
  allowRevision: boolean;
  submitMethod: "link" | "file" | "file_link";
  attachment?: {
    fileName: string;
    mimeType: string;
    url: string;
  };
  currentSubmission?: {
    link?: string;
    file?: {
      fileName: string;
      mimeType: string;
      url: string;
    };
    status: string;
    originalityCheck?: {
      status: string;
      maxSimilarity: number;
      label?: string;
    };
    teacherNote?: string;
    submittedAt: string | null;
  };
  sidebar: LearningSidebarItem[];
};

export type TaskSubmitPayload = {
  submissionLink?: string;
  submissionFile?: {
    fileName: string;
    mimeType: string;
    base64Data: string;
  };
};

export type MahasiswaLessonDetail = {
  id: string;
  courseId: string;
  title: string;
  contentType: string;
  contentUrl: string;
  excerpt: string;
  content: string;
  durationTargetSeconds: number;
  trackedSeconds: number;
  isCompleted: boolean;
  sidebar: LearningSidebarItem[];
  tips: string[];
};

export type MahasiswaQuizAttempt = {
  id: string;
  quizId: string;
  attemptNumber: number;
  status: "in_progress" | "submitted";
  questionOrder: string[];
  answers: Record<string, string>;
  startedAt: string;
  submittedAt: string | null;
  durationSeconds: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  isExpired: boolean;
  submissionTiming: "late" | "on_time" | null;
  score?: number;
  isPassed?: boolean;
  serverNow: string;
};

export type MahasiswaQuizDetail = {
  id: string;
  courseId: string;
  title: string;
  passScore: number;
  durationMinutes: number | null;
  maxAttempts: number;
  attemptsUsed: number;
  attemptsRemaining: number;
  questionOrder: string[];
  questions: Array<{
    id: string;
    prompt: string;
    options: Array<{ key: string; label: string }>;
  }>;
  lastScore?: number;
  activeAttempt: MahasiswaQuizAttempt | null;
  latestSubmittedAttempt?: MahasiswaQuizAttempt | null;
  sidebar: LearningSidebarItem[];
  penaltyNote: string;
};

export type DosenModuleSummary = {
  id: string;
  moduleId: string;
  title: string;
  department: string;
  gradeLevel: string;
  chapters: number;
  lessons: number;
  quizzes: number;
  tasks: number;
  draftItems: number;
  completionRate: number;
  status: string;
};

export type DosenModuleDetail = {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  department: string;
  gradeLevel: string;
  isActive: boolean;
  sections: Array<{
    id: string;
    title: string;
    order: number;
  }>;
  lessons: Array<{
    id: string;
    createdAt: string;
    title: string;
    contentType: "text" | "video" | "pdf" | "link";
    body: string;
    contentUrl: string | null;
    position: number | null;
    status: "draft" | "published";
    availableAt: string | null;
    durationMinutes: number | null;
    sectionId: string | null;
  }>;
  quizzes: Array<{
    id: string;
    createdAt: string;
    title: string;
    position: number | null;
    isActive: boolean;
    availableAt: string | null;
    deadline: string | null;
    passScore: number;
    durationMinutes: number | null;
    questionCount: number;
    sectionId: string | null;
  }>;
  tasks: Array<{
    id: string;
    createdAt: string;
    title: string;
    description: string | null;
    availableAt: string | null;
    deadline: string;
    position: number | null;
    status: "draft" | "published";
    submitMethod: "link" | "file" | "file_link";
    isActive: boolean;
    allowRevision: boolean;
    submissionCount: number;
    lessonId: string | null;
    sectionId: string | null;
    attachment?: {
      fileName: string;
      mimeType: string;
      url: string;
    } | null;
  }>;
};

export type DosenQuestionPayload = {
  pertanyaan: string;
  questionImage?: string;
  opsiA: string;
  opsiB: string;
  opsiC: string;
  opsiD: string;
  opsiBenar: "A" | "B" | "C" | "D";
};

export type DosenLessonPayload = {
  moduleStudentClassId: string;
  sectionId?: string;
  judul: string;
  tipeKonten: "text" | "video" | "pdf" | "link";
  konten: string;
  urlKonten?: string;
  durasi?: number;
  tersediaPada?: string;
  posisi?: number;
  status?: "draft" | "published";
};

export type DosenLessonUpdatePayload = Partial<Omit<DosenLessonPayload, "moduleStudentClassId">>;

export type DosenQuizPayload = {
  moduleStudentClassId: string;
  sectionId?: string;
  lessonId?: string;
  judul: string;
  posisi?: number;
  skorLulus?: number;
  durasiMenit?: number;
  availableAt?: string;
  deadline?: string;
  isAktif?: boolean;
  questions: DosenQuestionPayload[];
};

export type DosenQuizUpdatePayload = Partial<
  Omit<DosenQuizPayload, "moduleStudentClassId" | "questions">
> & {
  questions?: DosenQuestionPayload[];
};

export type DosenTaskPayload = {
  moduleStudentClassId: string;
  lessonId?: string;
  sectionId?: string;
  judul: string;
  deskripsi?: string;
  deadline: string;
  availableAt?: string;
  allowRevision?: boolean;
  isAktif?: boolean;
  status?: "draft" | "published";
  submitMethod?: "link" | "file" | "file_link";
  posisi?: number;
};

export type DosenTaskUpdatePayload = Partial<Omit<DosenTaskPayload, "moduleStudentClassId">>;

export type DosenQuizSummary = {
  id: string;
  title: string;
  moduleName?: string;
  moduleStudentClassId: string;
  questionCount: number;
  passScore: number;
  durationMinutes: number | null;
  isActive: boolean;
  deadline: string | null;
};

export type DosenQuizSubmission = {
  id: string;
  attemptNumber: number;
  studentName: string;
  className: string;
  courseTitle: string;
  assignmentTitle: string;
  score: number | null;
  status: string;
  submittedAt: string | null;
};

export type DosenQuizAttemptDetail = DosenQuizSubmission & {
  attemptHistory: Array<{
    id: string;
    attemptNumber: number;
    score: number | null;
    status: string;
    submittedAt: string | null;
    isLatest: boolean;
  }>;
  questions: Array<{
    id: string;
    type: "multiple-choice";
    question: string;
    studentAnswer: string | null;
    correctAnswer: string;
    isCorrect: boolean | null;
    points: number;
    maxPoints: number;
    teacherNote: string;
  }>;
};

export type GradeQuizAttemptPayload = {
  action: "draft" | "publish" | "retake";
  score?: number;
};

export type OriginalityCheckStatus =
  | "not_requested"
  | "queued"
  | "processing"
  | "completed"
  | "failed";

export type OriginalityCheckSummary = {
  status: OriginalityCheckStatus;
  maxSimilarity: number;
  label?: string;
  errorMessage?: string | null;
};

export type DosenTaskSubmissionSummary = {
  id: string;
  studentName: string;
  className: string;
  submittedAt: string | null;
  status: string;
  score: number | null;
  teacherFeedback: string;
  originalityCheck: OriginalityCheckSummary;
};

export type DosenTaskSubmissionDetail = DosenTaskSubmissionSummary & {
  courseTitle: string;
  assignmentTitle: string;
  submissionLink: string;
  submissionFile: {
    fileName: string;
    mimeType: string;
    url: string;
  } | null;
  teacherNote: string;
  rubrics: Array<{
    id: string;
    name: string;
    maxScore: number;
    score: number | null;
  }>;
};

export type GradeTaskSubmissionPayload = {
  score?: number;
  rubricScores?: Array<{ rubricId: string; score: number }>;
  teacherFeedback?: string;
  action: "draft" | "revision" | "publish";
};

export type IntegrityVisualContext = {
  comparisonId: string;
  similarityScore: number;
  similarityLevel: string | null;
  matchedFingerprintCount: number;
  sourceDocument: IntegrityVisualDocument;
  comparisonDocument: IntegrityVisualDocument;
};

export type IntegrityVisualDocument = {
  id: string | null;
  side: "A" | "B";
  fileName: string | null;
  annotatedPdfUrl: string | null;
  layoutMap: {
    kind: string | null;
    pages: Array<{
      pageIndex: number;
      width: number;
      height: number;
      imageUrl: string | null;
      pdfWidth: number;
      pdfHeight: number;
    }>;
  } | null;
  highlights: Array<{
    pageIndex: number;
    text: string | null;
    bboxNormalized: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    } | null;
  }>;
};

function normalizeMahasiswaModule(module: MahasiswaModuleResponse): MahasiswaModuleSummary {
  const { teacherName, dosenName, ...rest } = module;

  return {
    ...rest,
    dosenName: dosenName ?? teacherName ?? "-",
  };
}

function normalizeMahasiswaModuleDetail(
  module: MahasiswaModuleDetailResponse
): MahasiswaModuleDetail {
  const { teacherName, dosenName, ...rest } = module;

  return {
    ...rest,
    dosenName: dosenName ?? teacherName ?? "-",
  };
}

export async function listMahasiswaModules() {
  const modules = await apiClient.get<MahasiswaModuleResponse[]>("/api/modules");
  return modules.map(normalizeMahasiswaModule);
}

export async function getMahasiswaModule(id: string) {
  const module = await apiClient.get<MahasiswaModuleDetailResponse>(`/api/modules/${id}`);
  return normalizeMahasiswaModuleDetail(module);
}

export async function getMahasiswaTask(id: string) {
  return apiClient.get<MahasiswaTaskDetail>(`/api/tasks/${id}`);
}

export async function submitMahasiswaTask(id: string, payload: TaskSubmitPayload) {
  return apiClient.post<MahasiswaTaskDetail>(`/api/tasks/${id}/submit`, payload);
}

export async function getMahasiswaLesson(id: string) {
  return apiClient.get<MahasiswaLessonDetail>(`/api/lessons/${id}`);
}

export async function completeMahasiswaLesson(id: string) {
  return apiClient.post<MahasiswaLessonDetail>(`/api/lessons/${id}/complete`);
}

export async function trackMahasiswaLessonDuration(id: string, seconds: number) {
  return apiClient.post<MahasiswaLessonDetail>(`/api/lessons/${id}/duration`, {
    seconds,
  });
}

export async function getMahasiswaQuiz(id: string) {
  return apiClient.get<MahasiswaQuizDetail>(`/api/quizzes/${id}`);
}

export async function startMahasiswaQuiz(id: string) {
  return apiClient.post<MahasiswaQuizAttempt>(`/api/quizzes/${id}/start`);
}

export async function saveMahasiswaQuizAttempt(
  id: string,
  payload: { attemptId: string; answers: Record<string, string> }
) {
  return apiClient.put<MahasiswaQuizAttempt>(`/api/quizzes/${id}/attempt`, payload);
}

export async function submitMahasiswaQuizAttempt(
  id: string,
  payload: {
    attemptId: string;
    answers: Record<string, string>;
    fullscreenViolation: boolean;
  }
) {
  return apiClient.post<MahasiswaQuizAttempt>(`/api/quizzes/${id}/submit`, payload);
}

export async function getMahasiswaProfile() {
  return apiClient.get<MahasiswaProfile>("/api/user");
}

export async function updateMahasiswaProfile(payload: {
  fullName: string;
  email: string;
  phone?: string;
  bio?: string;
}) {
  return apiClient.put<MahasiswaProfile>("/api/profile", payload);
}

export async function changeMahasiswaPassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return apiClient.post<{ success: true }>("/api/profile/change-password", payload);
}

export async function listDosenModules() {
  return apiClient.get<DosenModuleSummary[]>("/api/teacher/modules");
}

export async function getDosenModule(id: string) {
  return apiClient.get<DosenModuleDetail>(`/api/teacher/modules/${id}`);
}

export async function createDosenSection(payload: {
  offeringId: string;
  judul: string;
  urutan?: number;
}) {
  return apiClient.post<{ id: string; title: string; order: number }>("/api/teacher/sections", payload);
}

export async function updateDosenSection(
  sectionId: string,
  payload: { judul?: string; urutan?: number }
) {
  return apiClient.put<{ id: string; title: string; order: number }>(
    `/api/teacher/sections/${sectionId}`,
    payload
  );
}

export async function deleteDosenSection(sectionId: string) {
  return apiClient.delete<{ success: true }>(`/api/teacher/sections/${sectionId}`);
}

export async function createDosenLesson(payload: DosenLessonPayload) {
  return apiClient.post<unknown>("/api/teacher/lessons", payload);
}

export async function updateDosenLesson(lessonId: string, payload: DosenLessonUpdatePayload) {
  return apiClient.put<unknown>(`/api/teacher/lessons/${lessonId}`, payload);
}

export async function updateDosenLessonStatus(
  lessonId: string,
  status: NonNullable<DosenLessonPayload["status"]>
) {
  return apiClient.patch<unknown>(`/api/teacher/lessons/${lessonId}/status`, { status });
}

export async function deleteDosenLesson(lessonId: string) {
  return apiClient.delete<{ success: true }>(`/api/teacher/lessons/${lessonId}`);
}

export async function createDosenQuiz(payload: DosenQuizPayload) {
  return apiClient.post<unknown>("/api/teacher/quizzes", payload);
}

export async function updateDosenQuiz(quizId: string, payload: DosenQuizUpdatePayload) {
  return apiClient.put<unknown>(`/api/teacher/quizzes/${quizId}`, payload);
}

export async function updateDosenQuizStatus(quizId: string, isAktif: boolean) {
  return apiClient.patch<unknown>(`/api/teacher/quizzes/${quizId}/status`, { isAktif });
}

export async function deleteDosenQuiz(quizId: string) {
  return apiClient.delete<{ success: true }>(`/api/teacher/quizzes/${quizId}`);
}

export async function createDosenTask(payload: DosenTaskPayload) {
  return apiClient.post<unknown>("/api/teacher/tasks", payload);
}

export async function updateDosenTask(taskId: string, payload: DosenTaskUpdatePayload) {
  return apiClient.put<unknown>(`/api/teacher/tasks/${taskId}`, payload);
}

export async function updateDosenTaskStatus(
  taskId: string,
  payload: { isAktif: boolean; status?: "draft" | "published" }
) {
  return apiClient.patch<unknown>(`/api/teacher/tasks/${taskId}/status`, payload);
}

export async function deleteDosenTask(taskId: string) {
  return apiClient.delete<{ success: true }>(`/api/teacher/tasks/${taskId}`);
}

export async function listDosenQuizzes() {
  return apiClient.get<DosenQuizSummary[]>("/api/teacher/quizzes");
}

export async function listDosenQuizSubmissions(quizId: string) {
  return apiClient.get<DosenQuizSubmission[]>(`/api/teacher/quizzes/${quizId}/submissions`);
}

export async function getDosenQuizAttemptDetail(attemptId: string) {
  return apiClient.get<DosenQuizAttemptDetail>(`/api/teacher/quiz-attempts/${attemptId}`);
}

export async function gradeDosenQuizAttempt(attemptId: string, payload: GradeQuizAttemptPayload) {
  return apiClient.put<DosenQuizAttemptDetail>(
    `/api/teacher/quiz-attempts/${attemptId}/grade`,
    payload
  );
}

export async function listDosenTaskSubmissions(taskId: string) {
  return apiClient.get<DosenTaskSubmissionSummary[]>(`/api/teacher/tasks/${taskId}/submissions`);
}

export async function getDosenTaskSubmissionDetail(submissionId: string) {
  return apiClient.get<DosenTaskSubmissionDetail>(`/api/teacher/task-submissions/${submissionId}`);
}

export async function gradeDosenTaskSubmission(
  submissionId: string,
  payload: GradeTaskSubmissionPayload
) {
  return apiClient.put<DosenTaskSubmissionDetail>(
    `/api/teacher/task-submissions/${submissionId}/grade`,
    payload
  );
}

export async function getDosenTaskSubmissionIntegritySummary(submissionId: string) {
  return apiClient.get<OriginalityCheckSummary>(
    `/api/teacher/task-submissions/${submissionId}/integrity-summary`
  );
}

export async function listDosenTaskSubmissionIntegrityPairs(submissionId: string) {
  return apiClient.get<unknown>(
    `/api/teacher/task-submissions/${submissionId}/integrity-pairs`
  );
}

export async function getDosenTaskSubmissionIntegrityPairDetail(
  submissionId: string,
  comparisonId: string
) {
  return apiClient.get<unknown>(
    `/api/teacher/task-submissions/${submissionId}/integrity-pairs/${comparisonId}`
  );
}

export async function getDosenTaskSubmissionIntegrityPairVisual(
  submissionId: string,
  comparisonId: string
) {
  return apiClient.get<IntegrityVisualContext>(
    `/api/teacher/task-submissions/${submissionId}/integrity-pairs/${comparisonId}/visual`
  );
}

export async function retryDosenTaskSubmissionIntegrity(submissionId: string) {
  return apiClient.post<OriginalityCheckSummary>(
    `/api/teacher/task-submissions/${submissionId}/integrity-retry`
  );
}
