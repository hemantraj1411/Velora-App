// Audio notification sounds
class NotificationSound {
  private audio: HTMLAudioElement | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // Only run on client side
    if (typeof window !== 'undefined') {
      // Check if user has sound preference saved
      const savedPreference = localStorage.getItem('notification_sound_enabled');
      if (savedPreference !== null) {
        this.isEnabled = savedPreference === 'true';
      }
    }
  }

  // Play notification sound
  play() {
    // Only play on client side and if enabled
    if (typeof window === 'undefined') return;
    if (!this.isEnabled) return;
    
    try {
      this.playBeep();
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }

  // Play beep sound using Web Audio API
  private playBeep() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // 800 Hz
      gainNode.gain.value = 0.3; // Volume
      
      oscillator.start();
      
      // Stop after 0.3 seconds
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 300);
    } catch (error) {
      console.error('Audio context error:', error);
    }
  }

  // Play task reminder sound
  playReminder() {
    if (typeof window === 'undefined') return;
    if (!this.isEnabled) return;
    
    try {
      this.playNotificationChime();
    } catch (error) {
      console.error('Failed to play reminder sound:', error);
    }
  }

  // Play notification chime
  private playNotificationChime() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioContext.currentTime;
      
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator1.frequency.value = 523.25; // C5
      oscillator2.frequency.value = 659.25; // E5
      
      gainNode.gain.value = 0.2;
      
      oscillator1.start();
      oscillator2.start();
      
      // Create a simple melody
      oscillator1.frequency.setValueAtTime(523.25, now);
      oscillator1.frequency.setValueAtTime(587.33, now + 0.2);
      oscillator1.frequency.setValueAtTime(659.25, now + 0.4);
      
      setTimeout(() => {
        oscillator1.stop();
        oscillator2.stop();
        audioContext.close();
      }, 800);
    } catch (error) {
      console.error('Chime error:', error);
    }
  }

  // Play achievement sound
  playAchievement() {
    if (typeof window === 'undefined') return;
    if (!this.isEnabled) return;
    
    try {
      this.playFanfare();
    } catch (error) {
      console.error('Failed to play achievement sound:', error);
    }
  }

  // Play fanfare for achievements
  private playFanfare() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      
      notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        gainNode.gain.value = 0.2;
        
        oscillator.start(audioContext.currentTime + index * 0.15);
        oscillator.stop(audioContext.currentTime + index * 0.15 + 0.3);
      });
      
      setTimeout(() => audioContext.close(), 1000);
    } catch (error) {
      console.error('Fanfare error:', error);
    }
  }

  // Enable/disable sound
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification_sound_enabled', String(enabled));
    }
  }

  // Get sound status
  getEnabled() {
    return this.isEnabled;
  }
}

// Singleton instance
export const notificationSound = new NotificationSound();