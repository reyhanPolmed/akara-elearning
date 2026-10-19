import type { Response as ExpressResponse } from "express";

export async function sendWebResponse(response: Response, expressResponse: ExpressResponse) {
  response.headers.forEach((value, key) => {
    expressResponse.append(key, value);
  });

  expressResponse.status(response.status);

  const contentType = response.headers.get("content-type") ?? "";
  const payload = await response.text();

  if (!payload) {
    expressResponse.end();
    return;
  }

  if (contentType.includes("application/json")) {
    expressResponse.json(JSON.parse(payload) as unknown);
    return;
  }

  expressResponse.send(payload);
}
