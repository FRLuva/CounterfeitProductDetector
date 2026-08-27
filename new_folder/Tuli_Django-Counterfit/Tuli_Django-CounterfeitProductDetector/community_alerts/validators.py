from django.core.exceptions import ValidationError
from PIL import Image, UnidentifiedImageError

MAX_SIZE = 10 * 1024 * 1024
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}


def validate_evidence_image(upload):
    if upload.size > MAX_SIZE:
        raise ValidationError("Evidence images must be 10 MB or smaller.")
    try:
        upload.seek(0)
        with Image.open(upload) as image:
            if (image.format or "").upper() not in ALLOWED_FORMATS:
                raise ValidationError("Evidence must be JPEG, PNG, or WebP.")
            if image.width * image.height > 40_000_000:
                raise ValidationError("Evidence image must be under 40 megapixels.")
            image.verify()
    except ValidationError:
        raise
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise ValidationError("Evidence is not a valid image.") from exc
    finally:
        upload.seek(0)
