// Alarm Sound Service
class AlarmSound {
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;

  // Initialize audio context on user interaction
  init(): void {
    if (typeof window === 'undefined') return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  // Play alarm sound
  playAlarm(): void {
    if (typeof window === 'undefined') return;
    if (this.isPlaying) return;
    
    try {
      this.init();
      if (!this.audioContext) return;

      this.isPlaying = true;

      // Create a more noticeable alarm sound
      this.playAlarmPattern();
    } catch (error) {
      console.error('Failed to play alarm:', error);
    }
  }

  private playAlarmPattern(): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    // Create a repeating alarm pattern
    const pattern = [
      { freq: 800, duration: 0.2, delay: 0 },
      { freq: 1000, duration: 0.2, delay: 0.3 },
      { freq: 800, duration: 0.2, delay: 0.6 },
      { freq: 1200, duration: 0.3, delay: 0.9 },
    ];

    let completed = 0;

    pattern.forEach((note, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.frequency.value = note.freq;
      oscillator.type = 'square'; // Square wave for more attention-grabbing sound

      // Volume envelope
      gainNode.gain.setValueAtTime(0, now + note.delay);
      gainNode.gain.linearRampToValueAtTime(0.3, now + note.delay + 0.05);
      gainNode.gain.setValueAtTime(0.3, now + note.delay + note.duration - 0.05);
      gainNode.gain.linearRampToValueAtTime(0, now + note.delay + note.duration);

      oscillator.start(now + note.delay);
      oscillator.stop(now + note.delay + note.duration);

      oscillator.onended = () => {
        completed++;
        if (completed === pattern.length) {
          this.isPlaying = false;
          // Play a second round if needed
          setTimeout(() => {
            if (!this.isPlaying) {
              this.playAlarmPattern();
              this.isPlaying = true;
            }
          }, 500);
        }
      };
    });

    // Stop after 3 rounds
    setTimeout(() => {
      this.isPlaying = false;
    }, 5000);
  }

  // Stop the alarm
  stopAlarm(): void {
    this.isPlaying = false;
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const alarmSound = new AlarmSound();