# Listen to Mommy

Push-to-talk AI character app for kids. Talk to Mickey (or any character) who gently reinforces good behavior.

## How it works

1. Kid holds the button and talks
2. Speech transcribed via Whisper
3. LLM generates character response
4. Character voice speaks back via ElevenLabs

## Tech Stack

- **App:** React Native (Expo)
- **Speech-to-Text:** OpenAI Whisper
- **LLM:** OpenAI GPT-4o
- **Text-to-Speech:** ElevenLabs (custom Mickey voice)

## Setup

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- OpenAI API key
- ElevenLabs API key

### Install
```bash
npm install
```

### Configure
Create `.env`:
```
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
EXPO_PUBLIC_ELEVENLABS_API_KEY=...
EXPO_PUBLIC_ELEVENLABS_VOICE_ID=...
```

### Run
```bash
npx expo start
```

Scan QR code with Expo Go app on your phone.

## Creating a Mickey Voice (ElevenLabs)

1. Go to [ElevenLabs Voice Lab](https://elevenlabs.io/voice-lab)
2. Click "Add Voice" → "Voice Cloning"
3. Upload 1-3 minutes of Mickey Mouse audio clips
4. Name it "Mickey Mouse"
5. Copy the Voice ID to your `.env`

## Characters

Edit `characters.ts` to add more characters. Each character has:
- `name`: Display name
- `voiceId`: ElevenLabs voice ID
- `systemPrompt`: Personality and behavior instructions

## License

MIT
