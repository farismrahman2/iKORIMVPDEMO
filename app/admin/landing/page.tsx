"use client";

import { useEffect, useState, useCallback } from "react";
import { Save } from "lucide-react";

interface ConfigItem {
  key: string;
  value: string;
}

export default function LandingConfigPage() {
  const [config, setConfig] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/landing");
      const data = await res.json();
      if (data.config) setConfig(data.config);
    } catch {
      // Silently fail
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  async function saveItem(key: string, value: string) {
    setSaving(key);
    try {
      await fetch("/api/admin/landing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
    } catch {
      // Silently fail
    }
    setSaving(null);
  }

  function updateValue(key: string, value: string) {
    setConfig((prev) =>
      prev.map((item) => (item.key === key ? { ...item, value } : item))
    );
  }

  if (loading) {
    return <div className="p-8 text-center text-ikori-muted animate-pulse">Loading config...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-ikori-dark mb-6">Landing Page Config</h1>
      <p className="text-sm text-ikori-muted mb-6">
        Edit these values to update the public landing page content instantly.
      </p>

      <div className="space-y-4">
        {config.map((item) => (
          <div key={item.key} className="bg-white rounded-ikori border border-ikori-border p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-ikori-muted uppercase tracking-wide">
                {item.key.replace(/_/g, " ")}
              </label>
              <button
                onClick={() => saveItem(item.key, item.value)}
                disabled={saving === item.key}
                className="flex items-center gap-1 text-xs text-ikori-500 hover:text-ikori-600 disabled:opacity-50"
              >
                <Save size={12} />
                {saving === item.key ? "Saving..." : "Save"}
              </button>
            </div>
            {item.value.length > 80 ? (
              <textarea
                value={item.value}
                onChange={(e) => updateValue(item.key, e.target.value)}
                className="w-full px-3 py-2 rounded-ikori-sm bg-ikori-surface border border-ikori-border text-sm text-ikori-dark focus:outline-none focus:border-ikori-500 min-h-[80px] resize-y"
              />
            ) : (
              <input
                value={item.value}
                onChange={(e) => updateValue(item.key, e.target.value)}
                className="w-full px-3 py-2 rounded-ikori-sm bg-ikori-surface border border-ikori-border text-sm text-ikori-dark focus:outline-none focus:border-ikori-500"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
