import os
import shutil
import zipfile
import subprocess
from flask import Flask, render_template, request, send_file, flash, jsonify
from werkzeug.utils import secure_filename
from datetime import datetime

app = Flask(__name__)
app.secret_key = "supersecret"
UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Mapping format to FFmpeg codec
FORMAT_OPTIONS = {
    "wav": ("pcm_s24le", "wav"),
    "flac": ("flac", "flac"),
    "mp3": ("libmp3lame", "mp3")
}

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

@app.route("/convert", methods=["POST"])
def convert():
    files = request.files.getlist("audio_files")
    target_format = request.form.get("format", "wav").lower()
    if target_format not in FORMAT_OPTIONS:
        return jsonify({"error": "Invalid format"}), 400

    codec, extension = FORMAT_OPTIONS[target_format]
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    output_files = []

    for file in files:
        if file.filename.endswith(".aac"):
            filename = secure_filename(file.filename)
            input_path = os.path.join(UPLOAD_FOLDER, filename)
            base_name = filename.rsplit(".", 1)[0]
            output_filename = f"{base_name} ({extension}).{extension}"
            output_path = os.path.join(OUTPUT_FOLDER, output_filename)

            file.save(input_path)

            cmd = [
                "ffmpeg", "-y",
                "-i", input_path,
                "-acodec", codec,
                "-ar", "48000",
                "-ac", "2",
                output_path
            ]

            try:
                subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                output_files.append(output_path)
            except subprocess.CalledProcessError:
                continue

    if len(output_files) >= 1:
        # Return list of converted files for individual downloads
        file_list = []
        for f in output_files:
            file_list.append({
                'filename': os.path.basename(f),
                'path': f
            })
        return jsonify({"success": True, "files": file_list})
    else:
        return jsonify({"error": "No valid .aac files uploaded."}), 400

@app.route("/download/<filename>", methods=["GET"])
def download_file(filename):
    # Security: ensure filename is in outputs directory and is safe
    safe_filename = secure_filename(filename)
    file_path = os.path.join(OUTPUT_FOLDER, safe_filename)
    
    if os.path.exists(file_path) and os.path.commonpath([OUTPUT_FOLDER, file_path]) == OUTPUT_FOLDER:
        return send_file(file_path, as_attachment=True)
    else:
        return jsonify({"error": "File not found"}), 404
