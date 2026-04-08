import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface BatchFile {
  type: "vocabulary" | "questions";
  batch_id: string;
  validated: boolean;
  items: Record<string, unknown>[];
}

async function importBatch(filePath: string) {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(absolutePath, "utf-8");
  const batch: BatchFile = JSON.parse(raw);

  console.log(`Importing ${batch.type} batch: ${batch.batch_id}`);
  console.log(`Items: ${batch.items.length}, Validated: ${batch.validated}`);

  const items = batch.items.map((item) => ({
    ...item,
    validated: batch.validated,
  }));

  const table = batch.type === "vocabulary" ? "vocabulary" : "questions";
  let successCount = 0;
  let errorCount = 0;

  // Import in batches of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(table).upsert(chunk, {
      onConflict: "id",
    });

    if (error) {
      console.error(`Error importing chunk ${i / BATCH_SIZE + 1}:`, error.message);
      errorCount += chunk.length;
    } else {
      successCount += chunk.length;
    }
  }

  console.log(`\nImport complete:`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: npx ts-node scripts/import-content.ts <batch_file.json>");
  process.exit(1);
}

importBatch(filePath).catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
