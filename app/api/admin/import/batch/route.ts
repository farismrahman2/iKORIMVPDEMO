import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient, createServiceRoleClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";
import { parseBatchFormat, validateVocabItem, validateQuestionItem } from "@/lib/import-validator";

const BATCH_SIZE = 50;

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = parseBatchFormat(body);

    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid batch format. Expected { type, batch_id, validated, items } or a raw array." },
        { status: 400 }
      );
    }

    const adminDb = createServiceRoleClient();
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    if (parsed.type === "vocabulary") {
      const validItems: Record<string, unknown>[] = [];
      for (let i = 0; i < parsed.items.length; i++) {
        const result = validateVocabItem(parsed.items[i]);
        if (result.valid) {
          validItems.push({
            word: parsed.items[i].word,
            kana: parsed.items[i].kana,
            kanji: parsed.items[i].kanji || null,
            meaning_en: parsed.items[i].meaning_en,
            meaning_bn: parsed.items[i].meaning_bn,
            example_sentence_jp: parsed.items[i].example_sentence_jp,
            example_sentence_bn: parsed.items[i].example_sentence_bn || null,
            audio_url: parsed.items[i].audio_url || null,
            category: parsed.items[i].category,
            difficulty: parsed.items[i].difficulty,
            frequency_tier: parsed.items[i].frequency_tier,
            confusion_set: parsed.items[i].confusion_set || null,
            validated: parsed.validated,
          });
        } else {
          skipped++;
          errors.push(`Vocab item ${i + 1}: ${result.errors.join("; ")}`);
        }
      }

      for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
        const chunk = validItems.slice(i, i + BATCH_SIZE);
        const { error } = await adminDb.from("vocabulary").upsert(chunk, {
          onConflict: "word,kana",
        });
        if (error) {
          errors.push(`Vocab batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
        } else {
          imported += chunk.length;
        }
      }
    } else {
      const validItems: Record<string, unknown>[] = [];
      for (let i = 0; i < parsed.items.length; i++) {
        const result = validateQuestionItem(parsed.items[i]);
        if (result.valid) {
          validItems.push({
            id: (parsed.items[i].id as string) || crypto.randomUUID(),
            section: parsed.items[i].section,
            subtype: parsed.items[i].subtype,
            difficulty: parsed.items[i].difficulty,
            topic: parsed.items[i].topic,
            skill_tag: parsed.items[i].skill_tag,
            frequency_tier: parsed.items[i].frequency_tier,
            question_text: parsed.items[i].question_text,
            options: parsed.items[i].options,
            correct_answer: parsed.items[i].correct_answer,
            explanation_en: parsed.items[i].explanation_en,
            explanation_bn: parsed.items[i].explanation_bn,
            audio_url: parsed.items[i].audio_url || null,
            audio_script: parsed.items[i].audio_script || null,
            distractor_logic: parsed.items[i].distractor_logic || null,
            source_type: parsed.items[i].source_type || "ai_generated",
            validated: parsed.validated,
          });
        } else {
          skipped++;
          errors.push(`Question item ${i + 1}: ${result.errors.join("; ")}`);
        }
      }

      for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
        const chunk = validItems.slice(i, i + BATCH_SIZE);
        const { error } = await adminDb.from("questions").upsert(chunk, {
          onConflict: "id",
        });
        if (error) {
          errors.push(`Questions batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
        } else {
          imported += chunk.length;
        }
      }
    }

    // Log the import
    await adminDb.from("content_import_log").insert({
      batch_id: parsed.batch_id,
      content_type: parsed.type,
      items_imported: imported,
      items_skipped: skipped,
      items_errored: errors.length > 0 ? errors.length : 0,
      imported_by: user.id,
      metadata: { total_submitted: parsed.items.length, errors: errors.slice(0, 20) },
    });

    return NextResponse.json({
      type: parsed.type,
      batch_id: parsed.batch_id,
      imported,
      skipped,
      errors: errors.slice(0, 50),
    });
  } catch (error) {
    console.error("Batch import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
