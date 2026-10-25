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

Clone the repository and install dependencies for both the desktop shell and the web app:

```bash
git clone <repository-url>
cd "Sound-Strip App"
npm run setup
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

## Host as a web app

Deploy to a Node.js host that supports server-side rendering and running child processes. Static-only hosting does not support the conversion API. From the repository root, build and start the web server with:

```bash
npm run build --prefix SoundStrip
npm run start --prefix SoundStrip
```

The server listens on the port supplied by the host. The host must allow outbound internet requests and provide enough memory, temporary disk space, and execution time for video downloads and FFmpeg conversion. Verify that the host's deployment includes the `ffmpeg-static` binary installed with npm and the bundled `SoundStrip/bin/yt-dlp` executable. YouTube extraction can also depend on a third-party service, so availability is not guaranteed.

## Project layout

```text
App-Electron/       Electron main process and preload
SoundStrip/         React Router web app and conversion API
SoundStrip/bin/     Bundled yt-dlp executables
```

The conversion API uses FFmpeg to produce MP3 audio. YouTube extraction may use a public third-party extraction service; availability depends on that service and on the source video. Only convert content you have permission to use, and follow the source platform's terms.

## License

No license file is currently included. Ask the repository owner about permitted use before redistributing this project.
