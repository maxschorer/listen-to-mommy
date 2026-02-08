import OpenAI from 'openai';
import { Character } from './characters';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Transcribe audio using OpenAI Whisper
 */
export async function transcribeAudio(audioUri: string): Promise<string> {
  // Convert audio URI to blob/file
  const response = await fetch(audioUri);
  const blob = await response.blob();
  
  const formData = new FormData();
  formData.append('file', blob, 'audio.m4a');
  formData.append('model', 'whisper-1');
  
  const transcription = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
    },
    body: formData,
  });
  
  const result = await transcription.json();
  return result.text;
}

/**
 * Generate character response using GPT-4o
 */
export async function generateResponse(
  character: Character,
  userMessage: string,
  conversationHistory: Message[] = []
): Promise<string> {
  const messages: Message[] = [
    { role: 'system', content: character.systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-5.2',
    messages,
    max_tokens: 150,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content || "Oh gosh, I didn't catch that!";
}

/**
 * Convert text to speech using ElevenLabs
 */
export async function textToSpeech(text: string, voiceId: string): Promise<string> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY || '',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to generate speech');
  }

  // Convert to base64 data URL for playback
  const arrayBuffer = await response.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ''
    )
  );
  
  return `data:audio/mpeg;base64,${base64}`;
}

/**
 * Full conversation turn: transcribe → generate → speak
 */
export async function processConversationTurn(
  audioUri: string,
  character: Character,
  conversationHistory: Message[] = []
): Promise<{ text: string; audioUrl: string; transcript: string }> {
  // 1. Transcribe user's speech
  const transcript = await transcribeAudio(audioUri);
  console.log('Transcribed:', transcript);

  // 2. Generate character response
  const responseText = await generateResponse(character, transcript, conversationHistory);
  console.log('Response:', responseText);

  // 3. Convert to speech
  const audioUrl = await textToSpeech(responseText, character.voiceId);

  return {
    text: responseText,
    audioUrl,
    transcript,
  };
}
