<div align="center">

# 🎧 Aurora

**A local-first desktop music player with immersive ambient moods.**

*Your music. Your library. Your files. No cloud music service required.*

[![Download Aurora](https://img.shields.io/badge/⬇️_Download-Aurora_v1.0.0_for_Windows-8A2BE2?style=for-the-badge)](https://github.com/HarshitChaurasia31/Aurora/releases/latest/download/Aurora_1.0.0_x64-setup.exe)

**Windows x64 installer:** `Aurora_1.0.0_x64-setup.exe`

> ⚠️ Download Aurora only from the [official GitHub Releases page](https://github.com/HarshitChaurasia31/Aurora/releases) or the button above.

</div>

---

## ✨ Features

| | |
|---|---|
| 🎵 Local music library | 💾 Persistent SQLite library |
| 🖼️ Album artwork & metadata | ❤️ Liked songs |
| 🔎 Search songs, albums, artists, playlists | 💿 Album & artist browsing |
| 📋 Persistent playlists | 🔄 Playback queue |
| 📁 Missing & moved-file handling | 🌧️ Ambient moods |
| 🎥 Custom ambient videos | 🔁 Loopable ambient backgrounds |
| 🎚️ Crossfade playback | 🖥️ Fullscreen & F11 immersive mode |
| 🏠 Clean, glass-based Aurora interface | 🔒 Local-first data ownership |

---

## 🎧 Local-First by Design

Aurora is built around **your** local music collection:

- Your audio files stay on your own filesystem.
- Aurora stores library information and application data locally — no cloud music account required.
- Playlists reference your existing library tracks instead of duplicating audio files.

---

## 🌌 Ambient Moods

Aurora includes built-in ambient backgrounds:

`Rain` · `Mountain` · `Night` · `Forest` · `Ocean` · `Snow` · `City` · `Fireplace`

You can also add your own local videos as custom ambient moods.

---

## 📋 Playlists

Create personal playlists without duplicating your music files. Playlist data references existing local library tracks, so deleting a playlist never deletes your music.

---

## 🏷️ Fixing Metadata with Mp3tag

Aurora reads album artwork, titles, artists, and album info directly from your audio files' embedded metadata (tags). If your library shows missing artwork, wrong titles, or blank artist/album fields, the fix usually isn't in Aurora — it's in the files themselves.

[**Mp3tag**](https://www.mp3tag.de/en/) is a free, widely-used tag editor that works well for this:

1. Download and install Mp3tag from the [official site](https://www.mp3tag.de/en/).
2. Open Mp3tag and point it at your music folder (drag and drop works too).
3. Select the tracks you want to fix.
4. Edit tags directly (title, artist, album, year, genre, track number) or use **Tag Sources → Online Sources** to auto-fill metadata from providers like MusicBrainz or Discogs.
5. To add album art, drag an image onto the cover panel or use **Tag Sources** to fetch it automatically.
6. Save changes, then re-scan the folder in Aurora so it picks up the updated tags.

> Mp3tag supports MP3, FLAC, M4A/AAC, OGG, WAV, WMA, and more — so it covers most formats Aurora's local library will contain.

---

## 🛡️ Safety & Verification

Aurora v1.0.0 is distributed through this GitHub repository.

**For the safest download:**
1. Download Aurora only from the [official GitHub Releases page](https://github.com/HarshitChaurasia31/Aurora/releases).
2. Confirm the installer is named exactly `Aurora_1.0.0_x64-setup.exe`.
3. Avoid installers shared through unofficial file-hosting sites.

> If Windows SmartScreen shows an "unrecognized app" warning, that's expected — Aurora is a new app and hasn't yet built up reputation with Microsoft's SmartScreen service.

**Verify the installer checksum (PowerShell):**

```powershell
Get-FileHash .\Aurora_1.0.0_x64-setup.exe -Algorithm SHA256
```

Compare the result against the SHA-256 value published on the corresponding [GitHub Release](https://github.com/HarshitChaurasia31/Aurora/releases).

---

## 💻 System Requirements

- **OS:** Windows 10 / 11
- **Architecture:** 64-bit (x64)
- **Format:** NSIS installer

---

## 🚀 Installation

1. Download `Aurora_1.0.0_x64-setup.exe`.
2. Run the installer.
3. Follow the installation steps.
4. Launch Aurora.
5. Add your local music folder.
6. Start listening.

> Your music files are **not** copied into Aurora's installation directory.

---

## 🗂️ Data & Privacy

Aurora is local-first:

- Your music stays on your own computer — no cloud account required to manage your library.
- Application data is stored in your local app-data directory.

---

## 🧪 Release

**Aurora v1.0.0** — first public release.

---

## 📜 License

See the repository's [license file](https://github.com/HarshitChaurasia31/Aurora/blob/main/LICENSE) for the terms under which Aurora is distributed.
