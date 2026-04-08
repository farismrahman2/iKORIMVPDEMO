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

async function seedAll() {
  const dataDir = path.join(__dirname, "data");

  const files = [
    path.join(dataDir, "vocab_seed.json"),
    path.join(dataDir, "questions_seed.json"),
  ];

  for (const filePath of files) {
    if (!fs.existsSync(filePath)) {
      console.log(`Skipping ${filePath} — file not found`);
      continue;
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const batch: BatchFile = JSON.parse(raw);

    console.log(`\nSeeding ${batch.type}: ${batch.batch_id}`);
    console.log(`  Items: ${batch.items.length}`);

    const table = batch.type === "vocabulary" ? "vocabulary" : "questions";
    const items = batch.items.map((item) => ({
      ...item,
      validated: batch.validated,
    }));

    const { error, count } = await supabase.from(table).upsert(items, {
      onConflict: "id",
      count: "exact",
    });

    if (error) {
      console.error(`  Error: ${error.message}`);
    } else {
      console.log(`  Upserted: ${count ?? items.length} items`);
    }
  }

  console.log("\nSeed complete!");
}

seedAll().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
