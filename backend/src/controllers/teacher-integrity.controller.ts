import { Readable } from "node:stream";
import type { Request, Response } from "express";
import { z } from "zod";

import {
  getTaskSubmissionIntegrityPairDetail,
  getTaskSubmissionIntegrityPairVisual,
  getTaskSubmissionIntegritySummary,
  getTaskSubmissionIntegrityVisualAsset,
  listTaskSubmissionIntegrityPairs,
  retryTaskSubmissionIntegrity,
} from "../services/teacher-integrity.service.js";
import { idParamSchema } from "../validators/common.validator.js";

const pairParamSchema = idParamSchema.extend({
  comparisonId: z.string().min(1),
});

const pairAssetParamSchema = pairParamSchema.extend({
  side: z.enum(["A", "B"]),
});
const visualAssetQuerySchema = z.object({
  path: z.string().min(1),
});

function writeProxyHeaders(response: Response, upstream: globalThis.Response) {
  const contentType = upstream.headers.get("content-type");
  const contentLength = upstream.headers.get("content-length");
  const cacheControl = upstream.headers.get("cache-control");
  const etag = upstream.headers.get("etag");
  const lastModified = upstream.headers.get("last-modified");

  if (contentType) response.setHeader("Content-Type", contentType);
  if (contentLength) response.setHeader("Content-Length", contentLength);
  if (cacheControl) response.setHeader("Cache-Control", cacheControl);
  if (etag) response.setHeader("ETag", etag);
  if (lastModified) response.setHeader("Last-Modified", lastModified);

  response.setHeader("Content-Disposition", "inline");
}

async function streamAssetResponse(
  response: Response,
  upstream: globalThis.Response
) {
  writeProxyHeaders(response, upstream);
  if (!upstream.body) {
    response.status(204).end();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const stream = Readable.fromWeb(upstream.body as globalThis.ReadableStream);
    stream.on("error", reject);
    response.on("close", resolve);
    response.on("finish", resolve);
    response.on("error", reject);
    stream.pipe(response);
  });
}

export async function getTaskSubmissionIntegritySummaryController(
  request: Request,
  response: Response
) {
  const { id } = idParamSchema.parse(request.params);
  response.json(await getTaskSubmissionIntegritySummary(id, request.authUser!.id));
}

export async function listTaskSubmissionIntegrityPairsController(
  request: Request,
  response: Response
) {
  const { id } = idParamSchema.parse(request.params);
  response.json(await listTaskSubmissionIntegrityPairs(id, request.authUser!.id));
}

export async function getTaskSubmissionIntegrityPairDetailController(
  request: Request,
  response: Response
) {
  const { id, comparisonId } = pairParamSchema.parse(request.params);
  response.json(
    await getTaskSubmissionIntegrityPairDetail(id, comparisonId, request.authUser!.id)
  );
}

export async function getTaskSubmissionIntegrityPairVisualController(
  request: Request,
  response: Response
) {
  const { id, comparisonId } = pairParamSchema.parse(request.params);
  response.json(
    await getTaskSubmissionIntegrityPairVisual(id, comparisonId, request.authUser!.id)
  );
}

export async function getTaskSubmissionIntegrityPairVisualAssetController(
  request: Request,
  response: Response
) {
    const { id, comparisonId, side } = pairAssetParamSchema.parse(request.params);
    const { path } = visualAssetQuerySchema.parse(request.query);
    const upstream = await getTaskSubmissionIntegrityVisualAsset(
      id,
      comparisonId,
      side,
      request.authUser!.id,
      path
    );
    await streamAssetResponse(response, upstream);
}

export async function retryTaskSubmissionIntegrityController(
  request: Request,
  response: Response
) {
  const { id } = idParamSchema.parse(request.params);
  response.json(await retryTaskSubmissionIntegrity(id, request.authUser!.id));
}
