# Local Audio Converter

A modern, local-first audio conversion studio built with Flask and FFmpeg. Drop in any audio file, pick your favorite format (or define your own), and download the converted tracks individually or as a bundled ZIP — all without leaving your machine.

## ✨ Highlights

- **Any-to-any conversions** – Feed the app almost any common audio format and export to MP3, WAV, FLAC, OGG, OPUS, AAC (m4a), AIFF, WMA, or a custom extension.
- **Batch ready** – Add multiple files via drag & drop or the file picker. Remove items inline before converting.
- **Flexible downloads** – Choose between per-track downloads or a ready-to-share ZIP archive.
- **Realtime feedback** – Animated progress, status messaging, and detailed results with file sizes and warnings.
- **Private by design** – All processing happens locally with your own FFmpeg installation; nothing touches the cloud.

## 📋 Requirements

- **Python** 3.10 or newer (the included `.venv` uses Python 3.13)
- **FFmpeg** 6.0+ available on your system `PATH`
- Python packages:
  - Flask (installed automatically when you run `pip install -r requirements.txt`)

> 🛠️ Verify FFmpeg with `ffmpeg -version` before launching the app.

## 🚀 Setup

```powershell
git clone <repository-url>
cd Audio-Converter

# Optional but recommended: create and activate a virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1

pip install -r requirements.txt

# Run the local server
python run_app.py
```

Visit [http://localhost:5000](http://localhost:5000) in your browser.

## 💻 How to use

1. **Add audio** – Drop files onto the glowing dropzone or click *Browse your computer*. The list updates instantly and shows each source format.
2. **Pick a target format** – Use the preset dropdown for popular codecs or switch to *Custom extension…* to type any FFmpeg-supported extension.
3. **Choose download options** – Leave both checkboxes enabled to receive individual links *and* a ZIP archive, or toggle them to match your workflow.
4. **Convert audio** – Click **Convert audio**. The progress card reflects upload and processing states.
5. **Grab your files** – Download each track or the archive from the results panel. Warnings (for example, skipped non-audio files) appear inline.

Converted assets live in `outputs/batch_<timestamp>/`. The server also cleans up uploaded originals immediately after conversion.

## 🔧 Configuration

Popular preset settings live in `FORMAT_PRESETS` inside `app.py`:

```python
FORMAT_PRESETS = {
    "mp3": {"codec": "libmp3lame", "extension": "mp3", "extra_args": ["-b:a", "320k", "-ar", "48000", "-ac", "2"]},
    "flac": {"codec": "flac", "extension": "flac", "extra_args": ["-compression_level", "8"]},
    # ...more presets...
}
```

- **Codec** – Passed to FFmpeg’s `-acodec` flag.
- **Extension** – Controls the output filename.
- **extra_args** – Injected verbatim into the FFmpeg command, so you can fine-tune bitrate, sample rate, channels, and more.

Selecting *Custom extension…* on the UI skips presets and lets FFmpeg infer the best settings for whatever extension you enter (alphanumeric, up to 10 characters).

## 🎵 Supported formats

Out-of-the-box the UI accepts common containers such as AAC, MP3, FLAC, WAV, M4A, OGG, OPUS, WMA, AIFF, CAF, AMR, and more. If FFmpeg can decode it, this app will attempt to convert it. Presets generate high-quality stereo output at 48 kHz; custom formats inherit FFmpeg defaults.

## 🧪 Validation

After the redesign the automated checks include:

- ✅ `ffmpeg -version`
- ✅ Flask test client upload → MP3 (ensures JSON response contains batch metadata)
- ✅ Flask test client upload → FLAC, plus individual and ZIP download probes

Feel free to tailor your own tests inside `tests/` or via the Flask CLI if you extend the project further.

## 📁 Project structure

```
Audio-Converter/
├── app.py              # Flask application with conversion + download routes
├── run_app.py          # Entry point for local development
├── requirements.txt    # Python dependencies (Flask)
├── templates/
│   └── index.html      # Modern UI layout
├── static/
│   ├── style.css       # Visual style system
│   └── script.js       # Drag/drop + progress logic
├── uploads/            # Temporary upload staging (cleared after use)
├── outputs/            # Converted batches + optional ZIP archives
└── README.md
```

## 🛠️ Troubleshooting

| Symptom | Fix |
| --- | --- |
| `FFmpeg error.` warning in results | Confirm the source file isn’t DRM-protected and that FFmpeg supports it (`ffmpeg -codecs`). |
| `Archive not found.` when downloading ZIP | Ensure **Bundle converted files into a ZIP archive** is selected before conversion. |
| Browser can’t reach `localhost:5000` | Check the terminal for Flask errors or port conflicts. Adjust the port in `run_app.py` if necessary. |
| Large output files | Edit the preset’s `extra_args` to change bitrate/sample rate, or choose a more efficient codec like OPUS. |

## 🤝 Contributing

PRs are welcome! A good first step is to add automated tests around new formats or to expand the UI with waveform previews, metadata editing, or queue management.

---

**Happy converting! �**
