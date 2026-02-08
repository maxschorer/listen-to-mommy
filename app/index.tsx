import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import { DEFAULT_CHARACTER, Character } from '../src/characters';
import { processConversationTurn } from '../src/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>(DEFAULT_CHARACTER.greeting);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const character = DEFAULT_CHARACTER;

  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Microphone permission is required!');
        return;
      }

      // Configure audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    setIsRecording(false);
    setIsProcessing(true);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error('No recording URI');

      // Process the conversation turn
      const result = await processConversationTurn(
        uri,
        character,
        conversationHistory
      );

      // Update conversation history
      setConversationHistory((prev) => [
        ...prev,
        { role: 'user', content: result.transcript },
        { role: 'assistant', content: result.text },
      ]);

      setLastResponse(result.text);

      // Play the response
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: result.audioUrl },
        { shouldPlay: true }
      );
      
      soundRef.current = sound;
      
      // Clean up sound after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (err) {
      console.error('Failed to process:', err);
      setLastResponse("Oh gosh, something went wrong! Try again, pal!");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Character Header */}
      <View style={styles.header}>
        <Text style={styles.characterName}>{character.name}</Text>
      </View>

      {/* Response Bubble */}
      <View style={styles.responseContainer}>
        <View style={styles.responseBubble}>
          <Text style={styles.responseText}>{lastResponse}</Text>
        </View>
      </View>

      {/* Push to Talk Button */}
      <View style={styles.buttonContainer}>
        {isProcessing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#FF6B6B" />
            <Text style={styles.processingText}>Thinking...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.talkButton, isRecording && styles.talkButtonActive]}
            onPressIn={startRecording}
            onPressOut={stopRecording}
            activeOpacity={0.8}
          >
            <Text style={styles.talkButtonText}>
              {isRecording ? '🎙️ Listening...' : '🎤 Hold to Talk'}
            </Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.hint}>
          Hold the button and talk to {character.name}!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9E6',
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  characterName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  responseContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  responseBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  responseText: {
    fontSize: 22,
    lineHeight: 32,
    color: '#333',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  talkButton: {
    backgroundColor: '#FF6B6B',
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  talkButtonActive: {
    backgroundColor: '#FF8E8E',
    transform: [{ scale: 1.05 }],
  },
  talkButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  processingContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
  },
  hint: {
    marginTop: 20,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});
