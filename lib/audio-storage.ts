import { createServiceRoleClient } from "./supabase";

const BUCKET_NAME = "listening-audio";

export async function uploadAudio(
  buffer: ArrayBuffer,
  questionId: string,
  speaker: string
): Promise<string> {
  const supabase = createServiceRoleClient();
  const shortId = questionId.slice(0, 8);
  const timestamp = Math.floor(Date.now() / 1000);
  const path = `L${shortId}_${speaker}_${timestamp}.mp3`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, buffer, {
      contentType: "audio/mpeg",
      upsert: true,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteAudio(path: string): Promise<void> {
  const supabase = createServiceRoleClient();

  // Extract just the file path from the full URL if needed
  let filePath = path;
  const bucketPrefix = `/storage/v1/object/public/${BUCKET_NAME}/`;
  const idx = path.indexOf(bucketPrefix);
  if (idx >= 0) {
    filePath = path.slice(idx + bucketPrefix.length);
  }

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
  if (error) {
    throw new Error(`Storage delete failed: ${error.message}`);
  }
}
