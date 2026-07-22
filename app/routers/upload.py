import os
import uuid
from fastapi import APIRouter, File, UploadFile, HTTPException, status, Depends
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/upload", tags=["upload"])

UPLOAD_DIR = os.path.join(os.getcwd(), "public", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File uploaded is not an image"
        )

    # Generate unique filename
    ext = os.path.splitext(file.filename)[1] or ".png"
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save image: {str(e)}"
        )

    # Return relative URL accessible via backend static files mount
    return {"image_url": f"http://127.0.0.1:8000/uploads/{unique_filename}"}
