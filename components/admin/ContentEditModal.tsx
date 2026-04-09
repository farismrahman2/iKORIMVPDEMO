"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Question, Vocabulary } from "@/types";

interface ContentEditModalProps {
  type: "vocabulary" | "questions";
  item: Vocabulary | Question;
  onClose: () => void;
  onSave: (updates: Record<string, unknown>) => Promise<void>;
}

export default function ContentEditModal({
  type,
  item,
  onClose,
  onSave,
}: ContentEditModalProps) {
  const [fields, setFields] = useState<Record<string, unknown>>({ ...item });
  const [saving, setSaving] = useState(false);

  function updateField(key: string, value: unknown) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Only send changed fields
      const updates: Record<string, unknown> = {};
      for (const key of Object.keys(fields)) {
        if (JSON.stringify(fields[key]) !== JSON.stringify((item as unknown as Record<string, unknown>)[key])) {
          updates[key] = fields[key];
        }
      }
      if (Object.keys(updates).length > 0) {
        await onSave(updates);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 rounded-ikori-sm bg-ikori-surface border border-ikori-border text-ikori-body text-sm focus:outline-none focus:border-ikori-500";
  const labelClass = "text-xs text-ikori-muted mb-1 block";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto pt-10 pb-10">
      <div className="bg-white rounded-ikori w-full max-w-2xl mx-4 border border-ikori-border">
        <div className="flex items-center justify-between p-4 border-b border-ikori-border">
          <h2 className="text-lg font-bold text-ikori-dark">
            Edit {type === "vocabulary" ? "Vocabulary" : "Question"}
          </h2>
          <button onClick={onClose} className="text-ikori-muted hover:text-ikori-dark">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {type === "vocabulary" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Word</label>
                  <input
                    value={(fields.word as string) || ""}
                    onChange={(e) => updateField("word", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Kana</label>
                  <input
                    value={(fields.kana as string) || ""}
                    onChange={(e) => updateField("kana", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Kanji</label>
                <input
                  value={(fields.kanji as string) || ""}
                  onChange={(e) => updateField("kanji", e.target.value || null)}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Meaning (EN)</label>
                  <input
                    value={(fields.meaning_en as string) || ""}
                    onChange={(e) => updateField("meaning_en", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Meaning (BN)</label>
                  <input
                    value={(fields.meaning_bn as string) || ""}
                    onChange={(e) => updateField("meaning_bn", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Example (JP)</label>
                <input
                  value={(fields.example_sentence_jp as string) || ""}
                  onChange={(e) => updateField("example_sentence_jp", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Category</label>
                  <input
                    value={(fields.category as string) || ""}
                    onChange={(e) => updateField("category", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Difficulty (1-3)</label>
                  <select
                    value={(fields.difficulty as number) || 1}
                    onChange={(e) => updateField("difficulty", parseInt(e.target.value))}
                    className={inputClass}
                  >
                    <option value={1}>1 - Easy</option>
                    <option value={2}>2 - Medium</option>
                    <option value={3}>3 - Hard</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Frequency</label>
                  <select
                    value={(fields.frequency_tier as string) || "high"}
                    onChange={(e) => updateField("frequency_tier", e.target.value)}
                    className={inputClass}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="stretch">Stretch</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className={labelClass}>Question Text</label>
                <textarea
                  value={(fields.question_text as string) || ""}
                  onChange={(e) => updateField("question_text", e.target.value)}
                  className={`${inputClass} min-h-[80px]`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i}>
                    <label className={labelClass}>Option {i + 1} {i === (fields.correct_answer as number) ? "✓" : ""}</label>
                    <input
                      value={((fields.options as string[]) || [])[i] || ""}
                      onChange={(e) => {
                        const opts = [...((fields.options as string[]) || [])];
                        opts[i] = e.target.value;
                        updateField("options", opts);
                      }}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Correct Answer</label>
                  <select
                    value={(fields.correct_answer as number) || 0}
                    onChange={(e) => updateField("correct_answer", parseInt(e.target.value))}
                    className={inputClass}
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <option key={i} value={i}>Option {i + 1}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Section</label>
                  <select
                    value={(fields.section as string) || ""}
                    onChange={(e) => updateField("section", e.target.value)}
                    className={inputClass}
                  >
                    <option value="vocab">Vocab</option>
                    <option value="grammar_reading">Grammar</option>
                    <option value="listening">Listening</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Difficulty</label>
                  <select
                    value={(fields.difficulty as string) || "easy"}
                    onChange={(e) => updateField("difficulty", e.target.value)}
                    className={inputClass}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Skill Tag</label>
                  <input
                    value={(fields.skill_tag as string) || ""}
                    onChange={(e) => updateField("skill_tag", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Subtype</label>
                  <input
                    value={(fields.subtype as string) || ""}
                    onChange={(e) => updateField("subtype", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Explanation (EN)</label>
                <textarea
                  value={(fields.explanation_en as string) || ""}
                  onChange={(e) => updateField("explanation_en", e.target.value)}
                  className={`${inputClass} min-h-[60px]`}
                />
              </div>
              <div>
                <label className={labelClass}>Explanation (BN)</label>
                <textarea
                  value={(fields.explanation_bn as string) || ""}
                  onChange={(e) => updateField("explanation_bn", e.target.value)}
                  className={`${inputClass} min-h-[60px]`}
                />
              </div>
              <div>
                <label className={labelClass}>Audio Script</label>
                <textarea
                  value={(fields.audio_script as string) || ""}
                  onChange={(e) => updateField("audio_script", e.target.value || null)}
                  className={`${inputClass} min-h-[60px]`}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 p-4 border-t border-ikori-border">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-ikori-sm border border-ikori-border text-ikori-muted hover:text-ikori-dark transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-ikori-sm bg-ikori-500 text-white font-semibold hover:bg-ikori-600 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
