FROM python:3.12-slim

# Install system dependencies required for packages like psycopg2
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast dependency resolution and installation
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Hugging Face Spaces requires running the app as a non-root user (id 1000)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Set the working directory
WORKDIR $HOME/app

# Copy the dependencies definition files
COPY --chown=user pyproject.toml uv.lock ./

# Install dependencies using uv into a virtual environment
RUN uv sync --frozen --no-dev

# Copy the application code
COPY --chown=user . .

# Expose the required port for Hugging Face Spaces (Spaces dynamically routes port 7860)
EXPOSE 7860

# Command to naturally run FastAPI using uvicorn and uv on Hugging Face Spaces
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
