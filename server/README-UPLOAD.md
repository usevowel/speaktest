# Uploading Sample Files and Environment Variables

## Uploading Sample Markdown Files to R2

The sample markdown files from `sample-project/` need to be uploaded to the R2 bucket with the prefix `projects/sample-project/`.

### Using the Upload Script

Run the upload script from the `server/` directory:

```bash
cd server
./upload-sample-files.sh [bucket-name] [env] [--local]
```

**Examples:**
```bash
# Upload to development bucket (remote)
./upload-sample-files.sh speaktest-dev development

# Upload to LOCAL Miniflare bucket (for wrangler dev --local)
./upload-sample-files.sh speaktest-dev development --local

# Upload to production bucket
./upload-sample-files.sh speaktest production
```

**Important for Local Development:**
- When using `--local`, make sure `wrangler dev --local` is running in another terminal
- The local Miniflare R2 bucket persists data in `.wrangler/state/` directory
- Files uploaded to local bucket are only available when running `wrangler dev --local`

### Manual Upload (Alternative)

You can also upload files manually using wrangler:

```bash
# For development environment (remote)
wrangler r2 object put speaktest-dev/projects/sample-project/auto-parts.md \
  --file=../sample-project/auto-parts.md \
  --content-type="text/markdown" \
  --env=development

# For LOCAL Miniflare bucket (make sure wrangler dev --local is running)
wrangler r2 object put speaktest-dev/projects/sample-project/auto-parts.md \
  --file=../sample-project/auto-parts.md \
  --content-type="text/markdown" \
  --local

# Repeat for each file:
# - continuing-ed.md
# - dashboard-ra.md
# - store.md
```

## Environment Variables

The environment variables from `.env` have been added to `wrangler.toml`:

- Added to `[vars]` (default environment)
- Added to `[env.development.vars]` (development environment)

**Note:** For production, you should use `wrangler secret put` for sensitive API keys instead of storing them in `wrangler.toml`:

```bash
# Set secrets for production environment
wrangler secret put GROQ_API_KEY --env production
wrangler secret put DEEPGRAM_API_KEY --env production
```

**Note**: Deepgram provides both Speech-to-Text (STT) and Text-to-Speech (TTS) services in a single API.

## Files Structure in R2

After uploading, your R2 bucket should have this structure:

```
projects/
  └── sample-project/
      ├── auto-parts.md
      ├── continuing-ed.md
      ├── dashboard-ra.md
      └── store.md
```

The API will serve these files at:
- `/api/projects/sample-project` - List all files
- `/api/projects/sample-project/files/{filename}` - Get specific file content
