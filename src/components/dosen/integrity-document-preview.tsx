import { useEffect, useState } from "react";

import type { IntegrityPreviewAsset } from "../../lib/dosen-task-integrity";

type IntegrityDocumentPreviewProps = {
  label: string;
  studentName: string;
  fileName: string;
  similarityScore: number | null;
  document: IntegrityPreviewAsset;
};

function formatPercent(value: number | null) {
  if (value === null) return null;
  return `${Math.round(value)}%`;
}

function bboxToStyle(box: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}) {
  const left = Math.max(0, Math.min(100, box.x1 * 100));
  const top = Math.max(0, Math.min(100, box.y1 * 100));
  const width = Math.max(0.4, (box.x2 - box.x1) * 100);
  const height = Math.max(0.4, (box.y2 - box.y1) * 100);

  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
  };
}

async function requestPdfBlobUrl(url: string) {
  const response = await fetch(url, {
    credentials: "include",
  });
  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `HTTP ${response.status}`);
  }

  if (!contentType.includes("application/pdf")) {
    throw new Error(`Response bukan PDF (${contentType || "unknown content-type"}).`);
  }

  return URL.createObjectURL(await response.blob());
}

export function IntegrityDocumentPreview({
  label,
  studentName,
  fileName,
  similarityScore,
  document,
}: IntegrityDocumentPreviewProps) {
  const similarityLabel = formatPercent(similarityScore);
  const visualPages = document.layoutMap?.pages.filter((page) => page.imageUrl) ?? [];
  const documentHighlights = Array.isArray(document.highlights) ? document.highlights : [];
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfState, setPdfState] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  const [pdfError, setPdfError] = useState("");
  const resolvedFileName = document.fileName ?? fileName;
  const showPdfPreview = Boolean(
    document.annotatedPdfUrl && resolvedFileName.toLowerCase().endsWith(".pdf")
  );

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    if (!showPdfPreview || !document.annotatedPdfUrl) {
      setPdfBlobUrl(null);
      setPdfState("idle");
      setPdfError("");
      return undefined;
    }

    setPdfState("loading");
    setPdfError("");
    setPdfBlobUrl(null);

    void requestPdfBlobUrl(document.annotatedPdfUrl)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }

        objectUrl = url;
        setPdfBlobUrl(url);
        setPdfState("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setPdfBlobUrl(null);
        setPdfState("failed");
        setPdfError(error instanceof Error ? error.message : "Gagal memuat PDF hasil highlight.");
      });

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [document.annotatedPdfUrl, showPdfPreview]);

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-[12px] border border-[#e5e5e5] bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#eeeeee] px-4 py-4">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>
          <h2 className="mt-1 truncate text-[18px] font-semibold text-slate-950">{fileName}</h2>
          <p className="mt-1 text-[13px] text-slate-500">{studentName}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
            Preview highlight
          </span>
          {similarityLabel ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[12px] font-semibold text-amber-700">
              {similarityLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden bg-[#f5f5f5] p-3">
        <div className="mx-auto h-full min-h-full max-w-[720px] overflow-hidden rounded-[10px] border border-[#dedede] bg-white">
          {showPdfPreview || visualPages.length > 0 ? (
            <div
              className={
                showPdfPreview
                  ? "flex h-full min-h-[720px] flex-col bg-[#f5f5f5] p-3"
                  : "h-full min-h-[720px] overflow-auto bg-[#f5f5f5] p-3"
              }
            >
              <div className={showPdfPreview ? "flex min-h-0 flex-1 flex-col" : "space-y-4"}>
                {showPdfPreview ? (
                  <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-[#dedede] bg-white">
                    <div className="flex items-center justify-between gap-3 border-b border-[#eeeeee] px-4 py-3">
                      <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        PDF Highlight
                      </span>
                      <span className="truncate text-[12px] text-slate-500">{resolvedFileName}</span>
                    </div>
                    <div
                      className={
                        pdfState === "failed"
                          ? "flex min-h-0 flex-1 items-center justify-center bg-red-50 px-6 text-center"
                          : pdfState === "loading"
                            ? "flex min-h-0 flex-1 items-center justify-center bg-[#f5f5f5] px-6 text-center text-[13px] text-slate-500"
                            : "min-h-0 flex-1 bg-white"
                      }
                    >
                      {pdfState === "ready" && pdfBlobUrl ? (
                        <iframe
                          src={pdfBlobUrl}
                          title="PDF hasil highlight"
                          loading="lazy"
                          className="h-full min-h-[720px] w-full border-0"
                        />
                      ) : pdfState === "failed" ? (
                        <p className="text-[13px] text-red-700">
                          {pdfError || "Gagal memuat PDF hasil highlight."}
                        </p>
                      ) : (
                        <p>Memuat PDF hasil highlight...</p>
                      )}
                    </div>
                  </section>
                ) : null}
                {!showPdfPreview
                  ? visualPages.map((page) => {
                      const pageHighlights = documentHighlights.filter(
                        (highlight) =>
                          highlight.bboxNormalized !== null &&
                          highlight.pageIndex === page.pageIndex
                      );

                      return (
                        <section
                          key={`${document.side}-${page.pageIndex}`}
                          className="rounded-[10px] border border-[#dedede] bg-white p-3"
                        >
                          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Halaman {page.pageIndex + 1}
                          </p>
                          <div className="overflow-hidden rounded-[8px] border border-[#e5e5e5] bg-white">
                            <div className="relative">
                              <img
                                src={page.imageUrl!}
                                alt={`${label} highlight preview halaman ${page.pageIndex + 1}`}
                                className="block h-auto w-full"
                              />
                              {pageHighlights.map((highlight, index) => (
                                <span
                                  key={`${document.side}-${page.pageIndex}-${index}`}
                                  className="pointer-events-none absolute border border-transparent bg-[rgba(239,68,68,0.28)]"
                                  style={bboxToStyle(highlight.bboxNormalized!)}
                                  title={highlight.text ?? "Segmen mirip"}
                                />
                              ))}
                            </div>
                          </div>
                        </section>
                      );
                    })
                  : null}
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[720px] items-center justify-center px-6 text-center">
              <div>
                <p className="text-[14px] font-semibold text-slate-950">Preview belum tersedia</p>
                <p className="mt-2 text-[13px] text-slate-500">
                  Provider belum mengirim gambar highlight untuk dokumen ini.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
