const baseUrl = process.env.API_BASE_URL ?? "http://localhost:3001";
const csrfTokenFallback = process.env.TEST_CSRF_TOKEN ?? "dev-csrf-token";

const testData = {
  email: process.env.TEST_EMAIL ?? "andi@akara.test",
  password: process.env.TEST_PASSWORD ?? "Password123!",
  moduleId: process.env.TEST_MODULE_ID ?? "1",
  lessonId: process.env.TEST_LESSON_ID ?? "1",
  quizId: process.env.TEST_QUIZ_ID ?? "1",
  taskId: process.env.TEST_TASK_ID ?? "1"
};

const jar = new Map();
const results = [];

function cookieHeader() {
  return [...jar.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
}

function rememberCookies(headers) {
  const raw = headers.get("set-cookie");
  if (!raw) {
    return;
  }

  const cookiePairs = raw.match(/(?:^|,\s*)([^=;,\s]+)=([^;,]*)/g) ?? [];
  for (const pair of cookiePairs) {
    const normalized = pair.replace(/^,\s*/, "");
    const separator = normalized.indexOf("=");
    if (separator === -1) {
      continue;
    }
    jar.set(normalized.slice(0, separator), normalized.slice(separator + 1));
  }
}

async function request(name, method, path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  const csrfToken = jar.get("XSRF-TOKEN") ?? csrfTokenFallback;

  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers.set("x-csrf-token", csrfToken);
    if (!jar.has("XSRF-TOKEN")) {
      jar.set("XSRF-TOKEN", csrfToken);
    }
  }

  const cookies = cookieHeader();
  if (cookies) {
    headers.set("cookie", cookies);
  }

  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${name} tidak bisa dijalankan: ${message}`);
  }

  rememberCookies(response.headers);
  const text = await response.text();
  let payload = text;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  const expected = options.expectedStatus ?? 200;
  const expectedStatuses = Array.isArray(expected) ? expected : [expected];
  const passed = expectedStatuses.includes(response.status);
  results.push({ name, method, path, status: response.status, passed, payload });

  if (!passed) {
    throw new Error(`${name} expected ${expectedStatuses.join("/")} got ${response.status}: ${text}`);
  }

  return payload;
}

async function main() {
  await request("Health", "GET", "/health");
  await request("CSRF cookie", "GET", "/api/csrf-cookie", { expectedStatus: 204 });
  await request("Login", "POST", "/login", {
    body: {
      email: testData.email,
      password: testData.password
    }
  });
  await request("Current user", "GET", "/api/user");
  await request("Dashboard", "GET", "/api/dashboard");
  await request("List modules", "GET", "/api/modules");
  await request("Module detail", "GET", `/api/modules/${testData.moduleId}`);
  await request("List courses", "GET", "/api/courses");
  await request("Lesson detail", "GET", `/api/lessons/${testData.lessonId}`);
  await request("Track lesson duration", "POST", `/api/lessons/${testData.lessonId}/duration`, {
    body: {
      seconds: 120
    }
  });
  await request("Complete lesson", "POST", `/api/lessons/${testData.lessonId}/complete`, {
    body: {}
  });
  await request("Quiz detail", "GET", `/api/quizzes/${testData.quizId}`);
  await request("Start quiz", "POST", `/api/quizzes/${testData.quizId}/start`, {
    body: {}
  });
  await request("Submit quiz", "POST", `/api/quizzes/${testData.quizId}/submit`, {
    body: {
      answers: {
        "1": "A",
        "2": "B"
      },
      fullscreenViolation: false
    }
  });
  await request("Quiz result", "GET", `/api/quizzes/${testData.quizId}/result`);
  await request("Task detail", "GET", `/api/tasks/${testData.taskId}`);
  await request("Submit task", "POST", `/api/tasks/${testData.taskId}/submit`, {
    body: {
      submission_link: "https://drive.example.com/andi-flowchart-smoke-test"
    }
  });
  await request("Update profile", "PUT", "/api/profile", {
    body: {
      name: "Andi Pratama",
      email: testData.email,
      phone: "081200000001",
      bio: "Smoke test API backend Akara LMS."
    }
  });
  await request("Change password", "POST", "/api/profile/change-password", {
    body: {
      currentPassword: testData.password,
      newPassword: testData.password,
      confirmPassword: testData.password
    }
  });
  await request("Logout", "POST", "/logout", {
    body: {}
  });
}

try {
  await main();
  console.table(results.map(({ name, method, path, status }) => ({ name, method, path, status })));
  console.log(`API smoke test passed: ${results.length} request`);
} catch (error) {
  console.table(results.map(({ name, method, path, status, passed }) => ({ name, method, path, status, passed })));
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
