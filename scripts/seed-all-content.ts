import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BATCH_SIZE = 50;

interface BatchFile {
  type: "vocabulary" | "questions";
  batch_id: string;
  validated: boolean;
  items: Record<string, unknown>[];
}

async function importBatch(filePath: string): Promise<{ success: number; errors: number }> {
  if (!fs.existsSync(filePath)) {
    console.log(`  Skipping ${path.basename(filePath)} — file not found`);
    return { success: 0, errors: 0 };
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const batch: BatchFile = JSON.parse(raw);
  const table = batch.type === "vocabulary" ? "vocabulary" : "questions";

  console.log(`\n  Importing: ${batch.batch_id} (${batch.type})`);
  console.log(`  Items: ${batch.items.length}`);

  let success = 0;
  let errors = 0;

  for (let i = 0; i < batch.items.length; i += BATCH_SIZE) {
    const chunk = batch.items.slice(i, i + BATCH_SIZE).map((item) => ({
      ...item,
      validated: batch.validated,
    }));

    if (batch.type === "vocabulary") {
      const { error } = await supabase.from(table).upsert(chunk, {
        onConflict: "word,kana",
      });
      if (error) {
        console.error(`  Batch error: ${error.message}`);
        errors += chunk.length;
      } else {
        success += chunk.length;
      }
    } else {
      // Questions: assign IDs if missing
      const withIds = chunk.map((item) => {
        const rec = item as Record<string, unknown>;
        return { ...rec, id: (rec.id as string) || crypto.randomUUID() };
      });
      const { error } = await supabase.from(table).upsert(withIds, {
        onConflict: "id",
      });
      if (error) {
        console.error(`  Batch error: ${error.message}`);
        errors += chunk.length;
      } else {
        success += chunk.length;
      }
    }
  }

  console.log(`  Result: ${success} imported, ${errors} errors`);
  return { success, errors };
}

async function seedAll() {
  console.log("=== iKORI Content Seed ===\n");

  const dataDir = path.join(__dirname, "data");
  const files = [
    "vocab_all.json",
    "grammar_all.json",
    "listening_all.json",
    // Fallback to existing seed files if the above don't exist
    "vocab_seed.json",
    "questions_seed.json",
  ];

  let totalSuccess = 0;
  let totalErrors = 0;

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
      const result = await importBatch(filePath);
      totalSuccess += result.success;
      totalErrors += result.errors;
    }
  }

  console.log(`\n=== Seed Complete ===`);
  console.log(`Total imported: ${totalSuccess}`);
  console.log(`Total errors: ${totalErrors}`);
}

seedAll().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
