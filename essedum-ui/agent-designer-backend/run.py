import os
import sys
from pathlib import Path

# Ensure we're in the backend directory
backend_dir = Path(__file__).resolve().parent
os.chdir(backend_dir)
sys.path.insert(0, str(backend_dir))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8180)
