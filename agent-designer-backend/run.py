import os
import sys
from pathlib import Path

# Ensure we're in the backend directory
backend_dir = Path(__file__).resolve().parent
os.chdir(backend_dir)
sys.path.insert(0, str(backend_dir))

if __name__ == "__main__":
    import uvicorn
    root_path = os.environ.get("ROOT_PATH", "")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8180, root_path=root_path)
