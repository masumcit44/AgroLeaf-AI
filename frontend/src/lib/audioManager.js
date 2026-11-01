// Global audio manager to ensure only one audio element plays across the app

let activeAudioElement = null;

export function setActiveAudio(element) {
  if (activeAudioElement && activeAudioElement !== element) {
    activeAudioElement.pause();
  }
  activeAudioElement = element;
}

export function stopActiveAudio() {
  if (activeAudioElement) {
    activeAudioElement.pause();
    activeAudioElement = null;
  }
}
