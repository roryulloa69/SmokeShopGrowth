"""
error_handler.py — Centralized error logging for failed jobs.
"""
import os
import json
from datetime import datetime

# In-memory log of failed jobs (for debugging)
_failed_jobs = []

def log_failed_job(job_type, context, error_message):
    """
    Log a failed job for retry or alerting.
    
    job_type: 'deploy' | 'delivery' | 'scrape' | etc.
    context: dict of relevant context (email, city, etc.)
    error_message: str description of the error
    """
    entry = {
        'type': job_type,
        'context': context,
        'error': error_message,
        'timestamp': datetime.utcnow().isoformat(),
    }
    _failed_jobs.append(entry)
    print(f"[error_handler] ❌ Failed job ({job_type}): {error_message}")
    print(f"[error_handler]    Context: {json.dumps(context, default=str)[:200]}")
    
    # Optionally write to a local file for persistence
    try:
        log_path = os.getenv('ERROR_LOG_PATH', '/tmp/failed_jobs.jsonl')
        with open(log_path, 'a') as f:
            f.write(json.dumps(entry) + '\n')
    except Exception:
        pass

def get_failed_jobs():
    """Return all logged failed jobs."""
    return list(_failed_jobs)
