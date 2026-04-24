FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; else echo "requirements.txt not found; skipping install"; fi
CMD ["sh", "-c", "find /app -maxdepth 2 -name '*.py' -exec sed -i 's/127.0.0.1/0.0.0.0/g' {} \\; && if [ -f app.py ]; then python app.py; elif [ -f main.py ]; then python main.py; elif [ -f run.py ]; then python run.py; elif [ -f server.py ]; then python server.py; else echo 'No entry point found (app.py/main.py/run.py/server.py)'; exit 1; fi"]
 