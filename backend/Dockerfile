# Use latest slim python
FROM python:slim

# Set the working directory
WORKDIR /app

# Make it so that Poetry installs all requirements globally
ENV POETRY_VIRTUALENVS_CREATE=false

# Install Poetry
RUN pip install poetry

# Copy over the requirements specifications
COPY poetry.lock pyproject.toml ./

# Install Poetry dependencies
RUN poetry install --no-interaction

# Copy the rest of the project
COPY . .

# Expose the port that the FastAPI server will run on
EXPOSE 8000

# Run the main server
CMD ["fastapi", "run", "--host", "0.0.0.0", "--port", "8000"]
