"use client";

import { useEffect, useState, useCallback } from "react";
import { Upload, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import {
  parseBatchFormat,
  detectContentType,
  validateVocabItem,
  validateQuestionItem,
} from "@/lib/import-validator";
import type { ContentImportLog } from "@/types";

interface ValidationSummary {
  type: "vocabulary" | "questions";
  batch_id: string;
  validated: boolean;
  totalItems: number;
  validCount: number;
  errorCount: number;
  errors: string[];
}

export default function ImportPage() {
  const [jsonInput, setJsonInput] = useState("");
  const [validation, setValidation] = useState<ValidationSummary | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [history, setHistory] = useState<ContentImportLog[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/import/history");
      const data = await res.json();
      if (data.history) setHistory(data.history);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!jsonInput.trim()) {
      setValidation(null);
      setParseError(null);
      setImportResult(null);
      return;
    }

    const timeout = setTimeout(() => {
      try {
        const parsed = JSON.parse(jsonInput);
        const detectedType = detectContentType(parsed);

        if (detectedType === "unknown") {
          setParseError("Could not detect content type. Expected vocabulary or questions format.");
          setValidation(null);
          return;
        }

        const batch = parseBatchFormat(parsed);
        if (!batch) {
          setParseError("Invalid format. Expected { type, batch_id, items } or a raw array.");
          setValidation(null);
          return;
        }

        const errors: string[] = [];
        let validCount = 0;

        for (let i = 0; i < batch.items.length; i++) {
          const result =
            batch.type === "vocabulary"
              ? validateVocabItem(batch.items[i])
              : validateQuestionItem(batch.items[i]);

          if (result.valid) {
            validCount++;
          } else {
            errors.push(
              `Item ${i + 1}: ${result.errors.join("; ")}`
            );
          }
        }

        setValidation({
          type: batch.type,
          batch_id: batch.batch_id,
          validated: batch.validated,
          totalItems: batch.items.length,
          validCount,
          errorCount: errors.length,
          errors: errors.slice(0, 20),
        });
        setParseError(null);
      } catch {
        setParseError("Invalid JSON. Please check your input.");
        setValidation(null);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [jsonInput]);

  async function handleImport() {
    if (!validation || validation.validCount === 0) return;
    setImporting(true);
    setImportResult(null);

    try {
      const parsed = JSON.parse(jsonInput);
      const res = await fetch("/api/admin/import/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      const data = await res.json();
      if (res.ok) {
        setImportResult({
          imported: data.imported,
          skipped: data.skipped,
          errors: data.errors || [],
        });
        loadHistory();
      } else {
        setImportResult({
          imported: 0,
          skipped: 0,
          errors: [data.error || "Import failed"],
        });
      }
    } catch {
      setImportResult({
        imported: 0,
        skipped: 0,
        errors: ["Network error during import"],
      });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Content Import</h1>

      {/* JSON Input */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">
            Paste JSON Content
          </label>
          {validation && (
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                validation.type === "vocabulary"
                  ? "bg-band-probable/20 text-band-probable"
                  : "bg-accent-gold/20 text-accent-gold"
              }`}
            >
              {validation.type === "vocabulary" ? "Vocabulary" : "Questions"} detected
            </span>
          )}
        </div>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder='Paste your JSON here...\n\nExpected format:\n{\n  "type": "vocabulary" | "questions",\n  "batch_id": "batch_001",\n  "validated": true,\n  "items": [...]\n}'
          className="w-full min-h-[400px] px-4 py-3 rounded-lg bg-navy-light border border-navy-lighter text-gray-300 font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-accent-orange resize-y"
        />
      </div>

      {/* Parse Error */}
      {parseError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-6">
          <XCircle size={16} />
          {parseError}
        </div>
      )}

      {/* Validation Panel */}
      {validation && (
        <div className="bg-navy-light rounded-xl p-4 mb-6 space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Validation Summary
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-navy-lighter text-center">
              <p className="text-2xl font-bold text-white">{validation.totalItems}</p>
              <p className="text-xs text-gray-500">Total Items</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 text-center">
              <p className="text-2xl font-bold text-green-400">{validation.validCount}</p>
              <p className="text-xs text-gray-500">Valid</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 text-center">
              <p className="text-2xl font-bold text-red-400">{validation.errorCount}</p>
              <p className="text-xs text-gray-500">Errors</p>
            </div>
          </div>

          {validation.validated && (
            <div className="flex items-center gap-2 text-sm text-accent-gold">
              <AlertTriangle size={14} />
              Items will be imported as validated (visible to users immediately)
            </div>
          )}

          {validation.errors.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {validation.errors.map((err, i) => (
                <p key={i} className="text-xs text-red-400">
                  {err}
                </p>
              ))}
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={importing || validation.validCount === 0}
            className="w-full py-3 rounded-lg bg-accent-orange text-white font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {importing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload size={18} />
                Import {validation.validCount} items
              </>
            )}
          </button>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div
          className={`p-4 rounded-lg mb-6 ${
            importResult.errors.length === 0
              ? "bg-green-500/10 border border-green-500/30"
              : "bg-accent-gold/10 border border-accent-gold/30"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={18} className="text-green-400" />
            <span className="text-white font-medium">Import Complete</span>
          </div>
          <p className="text-sm text-gray-300">
            {importResult.imported} imported, {importResult.skipped} skipped
          </p>
          {importResult.errors.length > 0 && (
            <div className="mt-2 space-y-1">
              {importResult.errors.slice(0, 5).map((err, i) => (
                <p key={i} className="text-xs text-red-400">{err}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Import History */}
      <div className="bg-navy-light rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Import History
        </h3>

        {history.length === 0 ? (
          <p className="text-sm text-gray-600">No imports yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left">
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Batch ID</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Imported</th>
                  <th className="pb-2 pr-4">Skipped</th>
                  <th className="pb-2">Errors</th>
                </tr>
              </thead>
              <tbody>
                {history.map((log) => (
                  <tr key={log.id} className="border-t border-navy-lighter">
                    <td className="py-2 pr-4 text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(log.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-2 pr-4 text-gray-300 font-mono text-xs">
                      {log.batch_id}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          log.content_type === "vocabulary"
                            ? "bg-band-probable/20 text-band-probable"
                            : "bg-accent-gold/20 text-accent-gold"
                        }`}
                      >
                        {log.content_type}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-green-400">{log.items_imported}</td>
                    <td className="py-2 pr-4 text-gray-500">{log.items_skipped}</td>
                    <td className="py-2 text-red-400">{log.items_errored}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
