# Alai
Alai - means wave 🌊 in Tamil - is a WebRTC-based audio recording web application with playback functionality. Built using Pion WebRTC.

Features:

- real-time audio streaming and recording, with additional features like waveform generation and metadata management
- ffmpeg integration with backend for generating waveform for listen playback, duration etc

Tech Stack:

- Golang: Pion webrtc, gorilla websockets
- React, Zustand state managment, Shadcn + tailwind UI

Use case:

- recording audiobooks, notes.

## Wakthru

## Architecture
![testing-1](https://github.com/user-attachments/assets/ad3d0abc-b241-400d-8936-ea4391a95893)

### REST Endpoints

- /recordings (GET) - retrieve recordings
- /recordings/:id (PUT, DELETE) - update/delete recordings

### Web Socket

- /ws endpoint for websocket connections
- acts as signalling server for webrtc
- commands for audio playbacks "play"/"stop".

### Pion webrtc

- handles webrtc connections and audio streamings (listen & record)

### FFmpeg for Audio Processing

Integrated with the backend for:

Generating waveform images from recorded audio
Calculating the duration of recordings

### Storage

- Disk storage, json (S3 for object storage, persistant db could have been used, i know :P)

