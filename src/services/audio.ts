// Speech Synthesis (Text to Speech)
let currentUtterance: SpeechSynthesisUtterance | null = null;

export const speakText = (text: string, onStart?: () => void, onEnd?: () => void): void => {
  if (!('speechSynthesis' in window)) {
    console.warn("Speech synthesis is not supported in this browser.");
    return;
  }

  // Cancel any running speech
  window.speechSynthesis.cancel();

  // Create utterance
  currentUtterance = new SpeechSynthesisUtterance(text);
  
  // Choose a nice premium sounding voice if available
  const voices = window.speechSynthesis.getVoices();
  const premiumVoice = voices.find(v => 
    v.name.includes('Google US English') || 
    v.name.includes('Natural') || 
    v.lang === 'en-US'
  );
  if (premiumVoice) {
    currentUtterance.voice = premiumVoice;
  }

  currentUtterance.rate = 0.95; // Slightly slower for clear, professional motivation delivery
  currentUtterance.pitch = 1.0;

  if (onStart) currentUtterance.onstart = onStart;
  if (onEnd) {
    currentUtterance.onend = onEnd;
    currentUtterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(currentUtterance);
};

export const stopSpeaking = (): void => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

// Speech Recognition (Speech to Text)
export interface VoiceListenerOptions {
  onResult: (text: string) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

export class VoiceListener {
  private recognition: any = null;
  private isListeningActive = false;

  constructor() {
    // Check compatibility
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = false;
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  public start(options: VoiceListenerOptions): void {
    if (!this.recognition) {
      options.onError("Speech recognition not supported in this browser.");
      return;
    }

    if (this.isListeningActive) {
      this.recognition.stop();
    }

    this.isListeningActive = true;

    this.recognition.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      options.onResult(resultText);
    };

    this.recognition.onerror = (event: any) => {
      options.onError(event.error || "Speech recognition error occurred.");
    };

    this.recognition.onend = () => {
      this.isListeningActive = false;
      options.onEnd();
    };

    try {
      this.recognition.start();
    } catch (e) {
      options.onError(String(e));
    }
  }

  public stop(): void {
    if (this.recognition && this.isListeningActive) {
      this.recognition.stop();
      this.isListeningActive = false;
    }
  }
}

export const voiceListenerInstance = new VoiceListener();
