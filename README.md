# Sound-Strip

Sound-Strip is a desktop app for converting a video link into an MP3. Choose an audio bitrate, set the output filename, and download the result from the app.

## Features

- Convert supported YouTube links and direct public video file links to MP3
- Choose 128, 192, or 320 kbps audio quality
- Set a custom output filename
- Cancel a conversion in progress
- Runs in an Electron desktop window

Direct video links should point to a public MP4, WebM, or MOV file. The converter currently limits source videos to 60 MB and 30 minutes. Conversion requires an internet connection.

## Requirements

- Node.js and npm
- Windows is the configured desktop packaging target (Electron Forge Squirrel maker)

## Setup

Clone the repository and install its root dependencies:

```bash
git clone <repository-url>
cd "Sound-Strip App"
npm install
```

The project includes a separate React Router app under `SoundStrip/`. Install its dependencies as well:

```bash
cd SoundStrip
npm install
cd ..
```

## Run in development

From the repository root:

```bash
npm run dev
```

This starts the web app on port 3000 and opens the Electron desktop window.

To run only the web app in a browser:

```bash
cd SoundStrip
npm run dev
```

## Build and package

Build the web app:

```bash
npm run build
```

Create an Electron package or installer with Electron Forge:

```bash
npm run package
npm run make
```

Packaged output is written under `out/` and is excluded from Git.

## Project layout

```text
App-Electron/       Electron main process and preload
SoundStrip/         React Router web app and conversion API
SoundStrip/bin/     Bundled yt-dlp executables
```

The conversion API uses FFmpeg to produce MP3 audio. YouTube extraction may use a public third-party extraction service; availability depends on that service and on the source video. Only convert content you have permission to use, and follow the source platform's terms.

## License

No license file is currently included. Ask the repository owner about permitted use before redistributing this project.
