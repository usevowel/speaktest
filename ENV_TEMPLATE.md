# Environment Variables Template

Create a `.env` file in the root directory with the following variables:

```env
# Deepgram API for STT
# Get your API key from: https://console.deepgram.com/
DEEPGRAM_API_KEY=your_deepgram_api_key_here

# Fish Audio API for TTS
# Get your API key from: https://fish.audio/app/api-keys/
FISH_AUDIO_API_TOKEN=your_fish_audio_api_token_here
FISH_AUDIO_TTS_MODEL=s2.1-pro-free
FISH_AUDIO_TTS_LATENCY=balanced

# Groq API for translation and alternative STT
# Get your API key from: https://console.groq.com/
GROQ_API_KEY=your_groq_api_key_here

# Server Configuration
CLIENT_URL=http://localhost:8080
PORT=9090
NODE_ENV=development

# Projects Directory (optional)
# Directory path where project markdown files are stored
# If not set, defaults to the workspace root directory
# Can be an absolute path or relative to the server directory
# Example: PROJECTS_DIR=/path/to/my/projects
# Example: PROJECTS_DIR=../my-projects
PROJECTS_DIR=
```

## API Documentation

- **Deepgram Speech-to-Text**: https://developers.deepgram.com/docs/speech-to-text
- **Fish Audio Text-to-Speech**: https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech
- **Groq API**: https://console.groq.com/

## API Endpoints

The application uses the following API endpoints:

- **Deepgram STT**: `https://api.deepgram.com/v1/listen`
- **Fish Audio TTS**: `https://api.fish.audio/v1/tts`
- **Groq Translation**: `https://api.groq.com/openai/v1/chat/completions`
- **Groq STT (Whisper)**: `https://api.groq.com/openai/v1/audio/transcriptions`
