import { apiClient } from "./api-client";

export type DashboardMetric = {
  label: string;
  value: number;
  helper: string;
  tone?: string;
};

export type MahasiswaModule = {
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

export type DashboardAgendaItem = {
  id: string;
  title: string;
  type: "quiz" | "task";
  dueAt: string;
  moduleTitle: string;
  status: string;
  href: string;
};

export type DashboardScheduleItem = {
  id: string;
  dayName: string;
  timeRange: string;
  courseTitle: string;
  dosenName: string;
};

export type MahasiswaDashboard = {
  user: {
    id: string;
    fullName: string;
    email: string;
    className: string;
    department: string;
    weeklyProgress: number;
  };
  metrics: DashboardMetric[];
  modules: MahasiswaModule[];
  upcomingQuizzes: DashboardAgendaItem[];
  upcomingTasks: DashboardAgendaItem[];
  scheduleItems: DashboardScheduleItem[];
};

type MahasiswaDashboardResponse = Omit<MahasiswaDashboard, "modules" | "scheduleItems"> & {
  modules: Array<Omit<MahasiswaModule, "dosenName"> & { teacherName?: string; dosenName?: string }>;
  scheduleItems?: DashboardScheduleItem[];
};

export type DosenDashboard = {
  dosen: {
    id: string;
    name: string;
    nip: string;
    department: string;
  };
  kpi: {
    activeModules: number;
    activeClasses: number;
    draftItems: number;
    needReview: number;
    pendingRevision: number;
  };
  modules: Array<{
    id: string;
    title: string;
    department: string;
    gradeLevel: string;
    chapters: number;
    lessons: number;
    quizzes: number;
    tasks: number;
    status: string;
    completionRate: number;
  }>;
  recentSubmissions: Array<{
    id: string;
    mahasiswaName: string;
    className: string;
    courseTitle: string;
    assignmentTitle: string;
    submittedAt: string | null;
    status: string;
    score: number | null;
    similarityPercent: number;
    similarityStatus: string;
  }>;
  integrity: {
    checked: number;
    pending: number;
    highSimilarity: number;
    maxSimilarity: number;
  };
};

type DosenDashboardResponse = Omit<DosenDashboard, "dosen" | "recentSubmissions"> & {
  teacher: DosenDashboard["dosen"];
  recentSubmissions: Array<
    Omit<DosenDashboard["recentSubmissions"][number], "mahasiswaName"> & {
      studentName?: string;
      mahasiswaName?: string;
    }
  >;
};

export async function getMahasiswaDashboard() {
  const dashboard = await apiClient.get<MahasiswaDashboardResponse>("/api/dashboard");

  return {
    ...dashboard,
    modules: dashboard.modules.map(({ teacherName, dosenName, ...module }) => ({
      ...module,
      dosenName: dosenName ?? teacherName ?? "-",
    })),
    scheduleItems: dashboard.scheduleItems ?? [],
  } satisfies MahasiswaDashboard;
}

export async function getDosenDashboard() {
  const dashboard = await apiClient.get<DosenDashboardResponse>("/api/teacher/dashboard");
  const { recentSubmissions, teacher, ...rest } = dashboard;

  return {
    ...rest,
    dosen: teacher,
    recentSubmissions: recentSubmissions.map(({ studentName, mahasiswaName, ...submission }) => ({
      ...submission,
      mahasiswaName: mahasiswaName ?? studentName ?? "-",
    })),
  } satisfies DosenDashboard;
}
