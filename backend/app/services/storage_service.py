import os
import shutil
import logging
from pathlib import Path
from supabase import create_client, Client
from fastapi import UploadFile

logger = logging.getLogger("hirecue.storage")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

class StorageManager:
    def __init__(self):
        self.use_supabase = bool(SUPABASE_URL and SUPABASE_KEY)
        self.bucket_name = "resumes"
        self.local_upload_dir = "uploads"
        
        if self.use_supabase:
            try:
                self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
                # Ensure bucket exists
                buckets = self.supabase.storage.list_buckets()
                bucket_names = [b.name for b in buckets]
                if self.bucket_name not in bucket_names:
                    self.supabase.storage.create_bucket(id=self.bucket_name, name=self.bucket_name, options={"public": False})
                logger.info("Supabase storage initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase storage, falling back to local: {e}")
                self.use_supabase = False
                
        if not self.use_supabase:
            os.makedirs(self.local_upload_dir, exist_ok=True)

    def upload_file(self, file: UploadFile, filename: str) -> str:
        """
        Uploads a file to Supabase if configured, otherwise falls back to local.
        Returns the file path or identifier.
        """
        # Read file contents
        contents = file.file.read()
        file.file.seek(0)  # Reset pointer in case it's needed elsewhere
        
        if self.use_supabase:
            try:
                # Upload to supabase storage
                res = self.supabase.storage.from_(self.bucket_name).upload(
                    path=filename,
                    file=contents,
                    file_options={"content-type": file.content_type}
                )
                return f"supabase://{self.bucket_name}/{filename}"
            except Exception as e:
                logger.error(f"Supabase upload failed: {e}")
                raise e
        else:
            # Fallback to local
            file_path = os.path.join(self.local_upload_dir, filename)
            with open(file_path, "wb") as f:
                f.write(contents)
            return file_path

    def download_file(self, file_path_or_id: str, local_dest: str):
        """
        Downloads a file from Supabase or copies it from local storage to local_dest.
        """
        if file_path_or_id.startswith("supabase://"):
            try:
                parts = file_path_or_id.replace("supabase://", "").split("/", 1)
                bucket = parts[0]
                filename = parts[1]
                
                res = self.supabase.storage.from_(bucket).download(filename)
                with open(local_dest, "wb") as f:
                    f.write(res)
            except Exception as e:
                logger.error(f"Supabase download failed: {e}")
                raise e
        else:
            # Local file copy
            if os.path.exists(file_path_or_id):
                shutil.copy(file_path_or_id, local_dest)
            else:
                raise FileNotFoundError(f"Local file {file_path_or_id} not found")

    def read_file(self, file_path_or_id: str) -> bytes:
        """
        Reads a stored file from Supabase or local disk and returns its bytes.
        """
        if file_path_or_id.startswith("supabase://"):
            parts = file_path_or_id.replace("supabase://", "").split("/", 1)
            if len(parts) != 2:
                raise ValueError("Invalid Supabase storage identifier")
            bucket, filename = parts
            return self.supabase.storage.from_(bucket).download(filename)

        with open(file_path_or_id, "rb") as f:
            return f.read()

    def get_filename(self, file_path_or_id: str) -> str:
        """
        Extracts a browser-safe filename from a local path or Supabase identifier.
        """
        if file_path_or_id.startswith("supabase://"):
            return file_path_or_id.replace("supabase://", "").split("/", 1)[1].rsplit("/", 1)[-1]
        return Path(file_path_or_id).name

storage_manager = StorageManager()
