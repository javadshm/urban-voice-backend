const EXAMPLE_TRANSCRIPTIONS = {
  en: 'There is a broken street light and loud noise near the park every night.',
  de: 'Es gibt ein Schlagloch und beschädigte Beleuchtung in meiner Straße.'
};

const detectLanguage = (languageInput) => {
  const normalized = String(languageInput || '').toLowerCase();
  return normalized.startsWith('de') ? 'de' : 'en';
};

const translateText = async (text, targetLanguage) => {
  const target = detectLanguage(targetLanguage);
  if (target === 'de') {
    return `DE: ${text}`;
  }
  return `EN: ${text}`;
};

const categorizeIssue = async (text) => {
  const normalized = String(text || '').toLowerCase();

  if (normalized.includes('graffiti') || normalized.includes('vandal')) return 'vandalism';
  if (normalized.includes('pothole') || normalized.includes('schlagloch') || normalized.includes('road')) return 'pothole';
  if (normalized.includes('light') || normalized.includes('beleuchtung') || normalized.includes('lamp')) return 'lighting';
  if (normalized.includes('noise') || normalized.includes('loud') || normalized.includes('lärm')) return 'noise';
  if (normalized.includes('trash') || normalized.includes('garbage') || normalized.includes('waste')) return 'waste';
  return 'general';
};

const processAudio = async (audioFilePath, language) => {
  // Mock implementation for beginner-friendly demo projects.
  // This simulates AI services without external APIs.
  const detectedLanguage = detectLanguage(language);
  const transcription = EXAMPLE_TRANSCRIPTIONS[detectedLanguage] || EXAMPLE_TRANSCRIPTIONS.en;
  const targetLanguage = detectedLanguage === 'de' ? 'en' : 'de';
  const translatedText = await translateText(transcription, targetLanguage);
  const category = await categorizeIssue(transcription);

  return {
    audioFilePath,
    transcription,
    detectedLanguage,
    translatedText,
    category,
    confidence: 0.92
  };
};

module.exports = { processAudio, translateText, categorizeIssue, detectLanguage };
