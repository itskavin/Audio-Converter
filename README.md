# AAC Batch Audio Converter

A simple and efficient web-based audio converter that converts AAC files to various audio formats including WAV, FLAC, and MP3. Built with Flask and powered by FFmpeg for high-quality audio conversion.

## ✨ Features

- **Batch Conversion**: Upload and convert multiple AAC files at once
- **Multiple Output Formats**: Convert to WAV (24-bit), FLAC, or MP3 (320 kbps)
- **Drag & Drop Interface**: Easy-to-use web interface with drag-and-drop support
- **Automatic Downloads**: Single files download directly, multiple files are zipped
- **Dark Mode**: Toggle between light and dark themes
- **Progress Tracking**: Visual progress indicator during conversion
- **Local Processing**: All conversions happen locally on your machine

## 📋 Requirements

Before running this application, make sure you have the following installed:

### System Requirements
- **Python 3.7+**
- **FFmpeg** (for audio conversion)

### Python Dependencies
- Flask
- Werkzeug

## 🚀 Installation & Setup

### 1. Install FFmpeg

#### Windows
Download FFmpeg from [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html) and add it to your system PATH.

#### macOS
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

### 2. Clone or Download the Project
```bash
git clone <repository-url>
cd Audio-Converter
```

### 3. Install Python Dependencies
```bash
pip install flask werkzeug
```

### 4. Run the Application
```bash
python run_app.py
```

The application will start on `http://localhost:5000`

## 💻 Usage

1. **Open your web browser** and navigate to `http://localhost:5000`
2. **Select output format** from the dropdown (WAV, FLAC, or MP3)
3. **Upload AAC files** by either:
   - Dragging and dropping files onto the upload area
   - Clicking "Browse" to select files
4. **Click "Convert & Download ZIP"** to start the conversion
5. **Download** will start automatically:
   - Single file: Downloads directly
   - Multiple files: Downloads as a ZIP archive

## 📁 Project Structure

```
Audio-Converter/
├── app.py              # Main Flask application
├── run_app.py          # Application runner
├── templates/
│   └── index.html      # Web interface template
├── static/
│   ├── style.css       # Styling and theme support
│   └── script.js       # Frontend JavaScript logic
├── uploads/            # Temporary storage for uploaded files
├── outputs/            # Temporary storage for converted files
└── README.md           # This file
```

## 🎵 Supported Formats

### Input
- **AAC** (.aac files)

### Output
- **WAV**: 24-bit PCM, 48kHz, Stereo
- **FLAC**: Lossless compression, 48kHz, Stereo  
- **MP3**: 320 kbps, 48kHz, Stereo

## ⚙️ Configuration

### Audio Quality Settings
The application uses high-quality settings by default:
- **Sample Rate**: 48kHz
- **Channels**: Stereo (2 channels)
- **WAV**: 24-bit PCM
- **MP3**: 320 kbps bitrate
- **FLAC**: Lossless compression

### Modifying Settings
You can modify audio quality settings in `app.py`:

```python
FORMAT_OPTIONS = {
    "wav": ("pcm_s24le", "wav"),    # 24-bit WAV
    "flac": ("flac", "flac"),       # FLAC lossless
    "mp3": ("libmp3lame", "mp3")    # MP3 with libmp3lame
}
```

FFmpeg conversion parameters can be adjusted in the `cmd` array:
```python
cmd = [
    "ffmpeg", "-y",
    "-i", input_path,
    "-acodec", codec,
    "-ar", "48000",     # Sample rate
    "-ac", "2",         # Channels (stereo)
    output_path
]
```

## 🛠️ Troubleshooting

### Common Issues

**"FFmpeg not found"**
- Ensure FFmpeg is installed and added to your system PATH
- Test by running `ffmpeg -version` in your terminal

**"No valid .aac files uploaded"**
- Make sure you're uploading files with .aac extension
- Check that the files are not corrupted

**"Port 5000 already in use"**
- Stop any other applications using port 5000
- Or modify the port in `run_app.py`:
```python
app.run(debug=True, port=5001)
```

**Conversion fails silently**
- Check that FFmpeg supports the input file format
- Ensure the AAC files are not corrupted or DRM-protected

## 🔧 Development

### Running in Development Mode
The application runs in debug mode by default, which provides:
- Auto-reload on code changes
- Detailed error messages
- Debug toolbar

### File Management
- Uploaded files are stored in `uploads/` directory
- Converted files are stored in `outputs/` directory
- Files are automatically managed (overwritten on new uploads)

## 📝 Notes

- This application is designed for **local use only**
- Files are processed locally on your machine
- No data is sent to external servers
- Temporary files are stored in local directories
- The application uses a simple secret key (change for production use)

## 🎯 Future Enhancements

Potential improvements for the application:
- Support for more input formats (MP3, M4A, etc.)
- Customizable audio quality settings via UI
- File format validation and error handling
- Progress tracking for individual files
- Batch rename options
- File preview and metadata display

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Happy Converting! 🎵**
