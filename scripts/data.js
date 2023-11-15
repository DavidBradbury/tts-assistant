const OPEN_AI_VARS = {
  model: ['tts-1', 'tts-1-hd'],
  voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
  response_format: ['mp3', 'opus', 'aac', 'flac'],
  speed_range: [0.25, 4.0],
  cost: {
    'tts-1': 0.015,
    'tts-1-hd': 0.03,
  },
}

export { OPEN_AI_VARS }
