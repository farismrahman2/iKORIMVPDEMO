const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

export async function generateSpeech(
  text: string,
  speaker: "male" | "female" | "dialogue" = "female"
): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY environment variable is not set");
  }

  let voiceId: string;
  if (speaker === "male") {
    voiceId = process.env.ELEVENLABS_VOICE_MALE || "";
  } else {
    // female and dialogue both use the female voice
    voiceId = process.env.ELEVENLABS_VOICE_FEMALE || "";
  }

  if (!voiceId) {
    throw new Error(`No voice ID configured for speaker: ${speaker}. Set ELEVENLABS_VOICE_${speaker === "male" ? "MALE" : "FEMALE"} env var.`);
  }

  const response = await fetch(
    `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.65,
          similarity_boost: 0.78,
          style: 0.15,
        },
        output_format: "mp3_44100_128",
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
  }

  return response.arrayBuffer();
}
