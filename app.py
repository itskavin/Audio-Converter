import os
import shutil
import zipfile
import subprocess
from pathlib import Path
from datetime import datetime
from flask import Flask, render_template, request, send_file, jsonify, url_for
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = "supersecret"
UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Preset configuration for popular target formats
FORMAT_PRESETS = {
    "mp3": {"codec": "libmp3lame", "extension": "mp3", "extra_args": ["-b:a", "320k", "-ar", "48000", "-ac", "2"]},
    "wav": {"codec": "pcm_s24le", "extension": "wav", "extra_args": ["-ar", "48000", "-ac", "2"]},
    "flac": {"codec": "flac", "extension": "flac", "extra_args": ["-compression_level", "8"]},
    "ogg": {"codec": "libvorbis", "extension": "ogg", "extra_args": ["-q:a", "5"]},
    "opus": {"codec": "libopus", "extension": "opus", "extra_args": ["-b:a", "160k"]},
    "aac": {"codec": "aac", "extension": "m4a", "extra_args": ["-b:a", "256k"]},
    "aiff": {"codec": "pcm_s24be", "extension": "aiff", "extra_args": ["-ar", "48000", "-ac", "2"]},
    "wma": {"codec": "wmav2", "extension": "wma", "extra_args": ["-b:a", "256k"]},
}

LIKELY_AUDIO_EXTENSIONS = {
    "3gp", "aac", "aif", "aiff", "alac", "amr", "ape", "au", "caf", "dss", "dts",
    "flac", "gsm", "m4a", "m4b", "m4p", "m4r", "mka", "mlp", "mp1", "mp2", "mp3",
    "mpa", "ogg", "opus", "pcm", "ra", "rm", "snd", "voc", "wav", "webm", "wma", "wv",
}


def human_readable_size(num_bytes: int) -> str:
    step = 1024
    size = float(num_bytes)
    units = ["bytes", "KB", "MB", "GB", "TB"]
    for unit in units:
        if size < step or unit == units[-1]:
            if unit == "bytes":
                return f"{int(size)} {unit}"
            return f"{size:.2f} {unit}"
        size /= step
    return f"{size:.2f} {units[-1]}"


def ensure_within_directory(directory: Path, target: Path) -> bool:
    try:
        directory = directory.resolve()
        target = target.resolve()
    except FileNotFoundError:
        return False
    return str(target).startswith(str(directory))


def cleanup_folder(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path, ignore_errors=True)

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

@app.route("/convert", methods=["POST"])
def convert():
    files = request.files.getlist("audio_files")
    if not files:
        return jsonify({"success": False, "error": "No files were provided."}), 400

    requested_format = (request.form.get("format", "mp3") or "").strip().lower()
    if not requested_format:
        return jsonify({"success": False, "error": "Please specify a target format."}), 400

    preset = FORMAT_PRESETS.get(requested_format)
    if preset:
        codec = preset["codec"]
        extension = preset["extension"]
        extra_args = preset.get("extra_args", [])
    else:
        if not requested_format.isalnum() or len(requested_format) > 10:
            return jsonify({"success": False, "error": "Custom formats must be alphanumeric and up to 10 characters."}), 400
        codec = None
        extension = requested_format
        extra_args = []

    bundle_zip = request.form.get("bundle_zip") is not None
    include_individual = request.form.get("individual_links") is not None

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    batch_id = f"batch_{timestamp}"
    batch_output = Path(OUTPUT_FOLDER) / batch_id
    batch_upload = Path(UPLOAD_FOLDER) / batch_id
    batch_output.mkdir(parents=True, exist_ok=True)
    batch_upload.mkdir(parents=True, exist_ok=True)

    converted_files = []
    warnings = []

    for storage in files:
        filename_raw = storage.filename or ""
        filename = secure_filename(filename_raw)
        if not filename:
            continue

        mimetype = storage.mimetype or ""
        input_ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if not (mimetype.startswith("audio/") or input_ext in LIKELY_AUDIO_EXTENSIONS):
            warnings.append(f"Skipped {filename_raw}: unsupported audio type.")
            continue

        input_path = batch_upload / filename
        storage.save(input_path)

        base_name = os.path.splitext(filename)[0]
        output_name = secure_filename(f"{base_name}.{extension}")
        output_path = batch_output / output_name

        cmd = [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(input_path),
        ]

        if codec:
            cmd.extend(["-acodec", codec])

        if extra_args:
            cmd.extend(extra_args)

        cmd.append(str(output_path))

        try:
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        except subprocess.CalledProcessError as error:
            stderr_output = error.stderr.decode("utf-8", "ignore") if error.stderr else "FFmpeg error."
            warnings.append(f"Conversion failed for {filename_raw}: {stderr_output.strip() or 'FFmpeg error.'}")
            continue

        size_bytes = output_path.stat().st_size if output_path.exists() else 0
        converted_files.append(
            {
                "original_name": filename_raw,
                "converted_name": output_name,
                "path": str(output_path),
                "size": human_readable_size(size_bytes),
            }
        )

    cleanup_folder(batch_upload)

    if not converted_files:
        cleanup_folder(batch_output)
        return jsonify({"success": False, "error": "No files could be converted. Please verify the audio formats."}), 400

    zip_info = None
    if bundle_zip:
        zip_filename = f"{batch_id}.zip"
        zip_path = batch_output / zip_filename
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for item in converted_files:
                zipf.write(item["path"], arcname=item["converted_name"])
        zip_info = {
            "filename": zip_filename,
            "url": url_for("download_zip", batch_id=batch_id)
        }

    files_payload = []
    if include_individual:
        for item in converted_files:
            files_payload.append(
                {
                    "original_name": item["original_name"],
                    "converted_name": item["converted_name"],
                    "filename": item["converted_name"],
                    "size": item["size"],
                    "url": url_for("download_converted", batch_id=batch_id, filename=item["converted_name"]) ,
                }
            )

    message = f"Converted {len(converted_files)} file{'s' if len(converted_files) != 1 else ''} to .{extension}."

    return jsonify(
        {
            "success": True,
            "batch_id": batch_id,
            "format": extension,
            "message": message,
            "files": files_payload,
            "zip": zip_info,
            "warnings": warnings,
        }
    )


@app.route("/download/batch/<batch_id>/<path:filename>", methods=["GET"])
def download_converted(batch_id: str, filename: str):
    safe_batch = secure_filename(batch_id)
    safe_filename = secure_filename(filename)
    batch_dir = Path(OUTPUT_FOLDER) / safe_batch
    file_path = batch_dir / safe_filename

    if not file_path.exists() or not ensure_within_directory(batch_dir, file_path):
        return jsonify({"error": "File not found."}), 404

    return send_file(file_path, as_attachment=True)


@app.route("/download/batch/<batch_id>/zip", methods=["GET"])
def download_zip(batch_id: str):
    safe_batch = secure_filename(batch_id)
    batch_dir = Path(OUTPUT_FOLDER) / safe_batch
    zip_path = batch_dir / f"{safe_batch}.zip"

    if not zip_path.exists() or not ensure_within_directory(batch_dir, zip_path):
        return jsonify({"error": "Archive not found."}), 404

    return send_file(zip_path, as_attachment=True)
