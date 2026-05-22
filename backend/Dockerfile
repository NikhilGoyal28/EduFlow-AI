FROM python:3.10-slim

WORKDIR /app

# Install system dependencies if required
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend files
COPY . .

EXPOSE 5000

ENV PYTHONIOENCODING=utf-8

CMD ["python", "-X", "utf8", "app.py"]
