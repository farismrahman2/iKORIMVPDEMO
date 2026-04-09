"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, Edit2, Trash2, CheckCircle, XCircle } from "lucide-react";
import StatsCards from "@/components/admin/StatsCards";
import ContentEditModal from "@/components/admin/ContentEditModal";
import type { AdminStats, Question, Vocabulary } from "@/types";

type ContentTab = "vocabulary" | "questions";

export default function ContentPage() {
  const [tab, setTab] = useState<ContentTab>("vocabulary");
  const [items, setItems] = useState<(Vocabulary | Question)[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [validated, setValidated] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [editItem, setEditItem] = useState<(Vocabulary | Question) | null>(null);

  const pageSize = 25;
  const totalPages = Math.ceil(total / pageSize);

  const loadContent = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      type: tab,
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.set("search", search);
    if (section) params.set("section", section);
    if (difficulty) params.set("difficulty", difficulty);
    if (validated) params.set("validated", validated);
    if (category) params.set("category", category);

    try {
      const res = await fetch(`/api/admin/content?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, [tab, page, search, section, difficulty, validated, category]);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      setStats(data);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  useEffect(() => {
    setPage(1);
  }, [tab, search, section, difficulty, validated, category]);

  async function toggleValidated(item: Vocabulary | Question) {
    try {
      await fetch("/api/admin/content/validate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: tab,
          ids: [item.id],
          validated: !item.validated,
        }),
      });
      loadContent();
      loadStats();
    } catch {
      // Silently fail
    }
  }

  async function deleteItem(item: Vocabulary | Question) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await fetch("/api/admin/content/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: tab, id: item.id }),
      });
      loadContent();
      loadStats();
    } catch {
      // Silently fail
    }
  }

  async function handleEditSave(updates: Record<string, unknown>) {
    if (!editItem) return;
    await fetch("/api/admin/content/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: tab, id: editItem.id, updates }),
    });
    loadContent();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Content Browser</h1>

      {stats && <StatsCards stats={stats} />}

      {/* Tabs */}
      <div className="flex gap-2 mt-6 mb-4">
        {(["vocabulary", "questions"] as ContentTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? "bg-accent-orange text-white"
                : "bg-navy-light text-gray-400 hover:text-white"
            }`}
          >
            {t === "vocabulary" ? "Vocabulary" : "Questions"}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-navy-light border border-navy-lighter text-gray-300 text-sm focus:outline-none focus:border-accent-orange"
          />
        </div>

        {tab === "questions" && (
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="px-3 py-2 rounded-lg bg-navy-light border border-navy-lighter text-gray-300 text-sm"
          >
            <option value="">All Sections</option>
            <option value="vocab">Vocab</option>
            <option value="grammar_reading">Grammar</option>
            <option value="listening">Listening</option>
          </select>
        )}

        {tab === "vocabulary" && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-navy-light border border-navy-lighter text-gray-300 text-sm"
          >
            <option value="">All Categories</option>
            {["greetings", "numbers", "time", "family", "food", "verbs", "adjectives", "body", "nature", "daily_life"].map((c) => (
              <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
            ))}
          </select>
        )}

        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="px-3 py-2 rounded-lg bg-navy-light border border-navy-lighter text-gray-300 text-sm"
        >
          <option value="">All Difficulties</option>
          {tab === "vocabulary" ? (
            <>
              <option value="1">1 - Easy</option>
              <option value="2">2 - Medium</option>
              <option value="3">3 - Hard</option>
            </>
          ) : (
            <>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </>
          )}
        </select>

        <select
          value={validated}
          onChange={(e) => setValidated(e.target.value)}
          className="px-3 py-2 rounded-lg bg-navy-light border border-navy-lighter text-gray-300 text-sm"
        >
          <option value="">All Status</option>
          <option value="true">Validated</option>
          <option value="false">Unvalidated</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-navy-light rounded-xl border border-navy-lighter overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Loading content...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No items found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-left border-b border-navy-lighter">
                  {tab === "vocabulary" ? (
                    <>
                      <th className="p-3">Word</th>
                      <th className="p-3">Kana</th>
                      <th className="p-3">English</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Diff</th>
                      <th className="p-3">Valid</th>
                      <th className="p-3">Actions</th>
                    </>
                  ) : (
                    <>
                      <th className="p-3">Question</th>
                      <th className="p-3">Section</th>
                      <th className="p-3">Skill</th>
                      <th className="p-3">Diff</th>
                      <th className="p-3">Audio</th>
                      <th className="p-3">Valid</th>
                      <th className="p-3">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-navy-lighter hover:bg-navy-lighter/30"
                  >
                    {tab === "vocabulary" ? (
                      <>
                        <td className="p-3 text-white font-medium">
                          {(item as Vocabulary).word}
                        </td>
                        <td className="p-3 text-gray-400">
                          {(item as Vocabulary).kana}
                        </td>
                        <td className="p-3 text-gray-400 max-w-[200px] truncate">
                          {(item as Vocabulary).meaning_en}
                        </td>
                        <td className="p-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-navy-lighter text-gray-400">
                            {(item as Vocabulary).category}
                          </span>
                        </td>
                        <td className="p-3 text-gray-400">
                          {(item as Vocabulary).difficulty}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 text-white max-w-[300px] truncate">
                          {(item as Question).question_text}
                        </td>
                        <td className="p-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-navy-lighter text-gray-400">
                            {(item as Question).section}
                          </span>
                        </td>
                        <td className="p-3 text-gray-400 text-xs">
                          {(item as Question).skill_tag}
                        </td>
                        <td className="p-3 text-gray-400">
                          {(item as Question).difficulty}
                        </td>
                        <td className="p-3">
                          {(item as Question).audio_url ? (
                            <span className="text-green-400 text-xs">Yes</span>
                          ) : (
                            <span className="text-gray-600 text-xs">No</span>
                          )}
                        </td>
                      </>
                    )}
                    <td className="p-3">
                      <button
                        onClick={() => toggleValidated(item)}
                        title={item.validated ? "Mark unvalidated" : "Mark validated"}
                      >
                        {item.validated ? (
                          <CheckCircle size={16} className="text-green-400" />
                        ) : (
                          <XCircle size={16} className="text-gray-600" />
                        )}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditItem(item)}
                          className="text-gray-500 hover:text-accent-orange"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteItem(item)}
                          className="text-gray-500 hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-navy-lighter">
            <span className="text-xs text-gray-500">
              {total} items — page {page} of {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-navy-lighter text-gray-400 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-navy-lighter text-gray-400 disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editItem && (
        <ContentEditModal
          type={tab}
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}
