"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

type Props = {
  invoiceId: string;
  invoiceNumber: string;
  variant?: "icon" | "full";
};

export function DownloadPdfButton({ invoiceId, invoiceNumber, variant = "icon" }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pdf`);
      if (!res.ok) throw new Error("Failed to generate PDF");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Could not download PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (variant === "full") {
    return (
      <button
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {loading ? "Generating…" : "Download PDF"}
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      title={`Download ${invoiceNumber}.pdf`}
      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-indigo-600 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </button>
  );
}
