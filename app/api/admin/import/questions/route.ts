import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient, createServiceRoleClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";
import { validateQuestionItem } from "@/lib/import-validator";

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
    const duplicates: string[] = [];

    // Check for duplicates by question_text
    const questionTexts = items
      .map((item) => item.question_text as string)
      .filter(Boolean);
    if (questionTexts.length > 0) {
      const { data: existing } = await adminDb
        .from("questions")
        .select("question_text")
        .in("question_text", questionTexts.slice(0, 200));
      if (existing) {
        const existingSet = new Set(existing.map((e: { question_text: string }) => e.question_text));
        for (const text of questionTexts) {
          if (existingSet.has(text)) {
            duplicates.push(text.slice(0, 60));
          }
        }
      }
    }

    // Validate and prepare items
    const validItems: Record<string, unknown>[] = [];
    for (let i = 0; i < items.length; i++) {
      const result = validateQuestionItem(items[i]);
      if (result.valid) {
        validItems.push({
          id: (items[i].id as string) || crypto.randomUUID(),
          section: items[i].section,
          subtype: items[i].subtype,
          difficulty: items[i].difficulty,
          topic: items[i].topic,
          skill_tag: items[i].skill_tag,
          frequency_tier: items[i].frequency_tier,
          question_text: items[i].question_text,
          options: items[i].options,
          correct_answer: items[i].correct_answer,
          explanation_en: items[i].explanation_en,
          explanation_bn: items[i].explanation_bn,
          audio_url: items[i].audio_url || null,
          audio_script: items[i].audio_script || null,
          distractor_logic: items[i].distractor_logic || null,
          source_type: items[i].source_type || "ai_generated",
          validated: validated ?? false,
        });
      } else {
        skipped++;
        errors.push(`Item ${i + 1}: ${result.errors.join("; ")}`);
      }
    }

    // Upsert in batches
    for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
      const chunk = validItems.slice(i, i + BATCH_SIZE);
      const { error } = await adminDb.from("questions").upsert(chunk, {
        onConflict: "id",
      });

      if (error) {
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      } else {
        imported += chunk.length;
      }
    }

    // Log the import
    const batchId = batch_id || `questions_import_${Date.now()}`;
    await adminDb.from("content_import_log").insert({
      batch_id: batchId,
      content_type: "questions",
      items_imported: imported,
      items_skipped: skipped,
      items_errored: errors.length > 0 ? errors.length : 0,
      imported_by: user.id,
      metadata: {
        total_submitted: items.length,
        duplicates_found: duplicates.length,
        errors: errors.slice(0, 20),
      },
    });

    return NextResponse.json({
      imported,
      skipped,
      duplicates: duplicates.slice(0, 20),
      errors: errors.slice(0, 50),
    });
  } catch (error) {
    console.error("Questions import error:", error);
    return NextResponse.json(
      { error: "Import failed" },
      { status: 500 }
    );
  }
}
