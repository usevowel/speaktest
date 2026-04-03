# Environment Variables Template

Create a `.env` file in the root directory with the following variables:

```env
# Deepgram API for TTS and STT
# Get your API key from: https://console.deepgram.com/
DEEPGRAM_API_KEY=your_deepgram_api_key_here

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

- **Deepgram Text-to-Speech**: https://developers.deepgram.com/docs/text-to-speech
- **Deepgram Speech-to-Text**: https://developers.deepgram.com/docs/speech-to-text
- **Groq API**: https://console.groq.com/

## API Endpoints

The application uses the following API endpoints:

- **Deepgram TTS**: `https://api.deepgram.com/v1/speak`
- **Deepgram STT**: `https://api.deepgram.com/v1/listen`
- **Groq Translation**: `https://api.groq.com/openai/v1/chat/completions`
- **Groq STT (Whisper)**: `https://api.groq.com/openai/v1/audio/transcriptions`
