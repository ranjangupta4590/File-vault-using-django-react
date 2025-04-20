from django.db import models
import uuid
import os
import hashlib

def file_upload_path(instance, filename):
    """Generate file path for new file upload"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('uploads', filename)

def calculate_file_hash(file_obj):
    """Calculate SHA-256 hash of a file"""
    sha256_hash = hashlib.sha256()
    for chunk in file_obj.chunks():
        sha256_hash.update(chunk)
    return sha256_hash.hexdigest()

def calculate_file_size(file_obj):
    """Calculate size of a file"""
    size = 0
    for chunk in file_obj.chunks():
        size += len(chunk)
    return size

class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to=file_upload_path)
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    size = models.BigIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    file_hash = models.CharField(max_length=64, unique=True, null=True, blank=True)
    reference_count = models.IntegerField(default=1)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return self.original_filename

    def save(self, *args, **kwargs):
        if self.file and not self.size:
            self.size = calculate_file_size(self.file)
        if not self.file_hash and self.file:
            self.file_hash = calculate_file_hash(self.file)
        super().save(*args, **kwargs)
