# Hackathon Adapt

This repository contains a backend and frontend to generate course content using OpenAI.

## Usage

Install the dependencies for the backend:

```bash
pip install -r backend/requirements.txt
```

To generate a course package, run the helper script from the repository root:

```bash
python course_content_agent.py "Tema do curso"
```

This script wraps the `backend/course_content_agent.py` module and works on Windows and Unix systems.
