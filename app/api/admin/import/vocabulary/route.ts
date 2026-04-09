import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient, createServiceRoleClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";
import { validateVocabItem } from "@/lib/import-validator";

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
    const { batch_id, validated, items } = body as {
      batch_id?: string;
      validated?: boolean;
      items: Record<string, unknown>[];
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items array is required and must not be empty" },
        { status: 400 }
      );
    }

    const adminDb = createServiceRoleClient();
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Validate all items first
    const validItems: Record<string, unknown>[] = [];
    for (let i = 0; i < items.length; i++) {
      const result = validateVocabItem(items[i]);
      if (result.valid) {
        validItems.push({
          word: items[i].word,
          kana: items[i].kana,
          kanji: items[i].kanji || null,
          meaning_en: items[i].meaning_en,
          meaning_bn: items[i].meaning_bn,
          example_sentence_jp: items[i].example_sentence_jp,
          example_sentence_bn: items[i].example_sentence_bn || null,
          audio_url: items[i].audio_url || null,
          category: items[i].category,
          difficulty: items[i].difficulty,
          frequency_tier: items[i].frequency_tier,
          confusion_set: items[i].confusion_set || null,
          validated: validated ?? false,
        });
      } else {
        skipped++;
        errors.push(`Item ${i + 1} (${items[i].word || "unknown"}): ${result.errors.join("; ")}`);
      }
    }

    // Upsert in batches
    for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
      const chunk = validItems.slice(i, i + BATCH_SIZE);
      const { error } = await adminDb.from("vocabulary").upsert(chunk, {
        onConflict: "word,kana",
      });

      if (error) {
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      } else {
        imported += chunk.length;
      }
    }

    // Log the import
    const batchId = batch_id || `vocab_import_${Date.now()}`;
    await adminDb.from("content_import_log").insert({
      batch_id: batchId,
      content_type: "vocabulary",
      items_imported: imported,
      items_skipped: skipped,
      items_errored: errors.length > 0 ? errors.length : 0,
      imported_by: user.id,
      metadata: { total_submitted: items.length, errors: errors.slice(0, 20) },
    });

    return NextResponse.json({ imported, skipped, errors: errors.slice(0, 50) });
  } catch (error) {
    console.error("Vocabulary import error:", error);
    return NextResponse.json(
      { error: "Import failed" },
      { status: 500 }
    );
  }
}
