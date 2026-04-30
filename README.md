# Prompt Sphere

A Next.js voice-reactive AI playground. The main view is a 3D orb that pulses
and morphs to the audio of whichever model is speaking via ElevenLabs. Pick a
prompt from your database (or attach reference files instead), choose a model
from Anthropic / OpenAI / Google, and have a conversation by typing or talking.

## Features

- **3D audio-reactive sphere** — react-three-fiber + a custom GLSL shader that
  distorts and shifts color based on a Web Audio `AnalyserNode`.
- **Multiple reasoning models** — switch at runtime between Claude (Opus 4.7,
  Sonnet 4.6, Haiku 4.5), OpenAI (GPT-4o, GPT-4.1) and Gemini (2.5 Pro/Flash).
- **ElevenLabs TTS + STT** — the assistant speaks its replies, and you can hold
  the mic button to talk back. STT uses the `scribe_v1` Speech-to-Text model.
- **Prompt base via Supabase (optional)** — list/create/delete system prompts.
- **File-upload fallback** — if no DB is configured, attach `.txt`, `.md`,
  `.pdf`, `.json` or `.csv` and they'll be passed as context to the model.

## Setup

```bash
npm install
cp .env.example .env.local
# fill in the keys for the providers you want to use
npm run dev
```

Visit `http://localhost:3000`.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude models |
| `OPENAI_API_KEY` | GPT models |
| `GOOGLE_API_KEY` | Gemini models |
| `ELEVENLABS_API_KEY` | TTS + STT (required for voice) |
| `ELEVENLABS_VOICE_ID` | Default voice id (optional) |
| `ELEVENLABS_MODEL_ID` | Default ElevenLabs model id (optional) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (optional) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (optional) |

You only need the keys for the providers you actually plan to use. If
ElevenLabs is missing, voice features will return errors but text chat still
works. If Supabase is missing, the prompt list panel switches to file-upload
mode automatically.

### Supabase schema

If you want the prompt base, create a `prompts` table:

```sql
create table prompts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_at timestamptz default now()
);
```

## Architecture

```
app/
  page.tsx               main 3-pane layout (config / sphere / chat)
  api/
    chat/route.ts        unified chat across Anthropic/OpenAI/Google
    tts/route.ts         ElevenLabs text-to-speech
    stt/route.ts         ElevenLabs speech-to-text (Scribe)
    prompts/route.ts     CRUD for prompts in Supabase
    extract/route.ts     extract text from uploaded files
components/
  Sphere.tsx             react-three-fiber orb with audio-reactive shader
  ChatPanel.tsx          conversation UI + TTS playback
  MicButton.tsx          record-and-transcribe button
  ModelSelector.tsx, PromptPicker.tsx, FileUploader.tsx
lib/
  audio.ts               AudioReactor: AnalyserNode wrapper
  models.ts              provider-agnostic chat function
  db.ts                  Supabase client (lazy, optional)
  extractText.ts         pdf/text extraction
  store.ts               zustand global state
```
