"""
In-Memory Task Manager
Tracks background task progress for async file uploads.
Replaces Redis/Celery for short-term use.
"""

import uuid
import threading
from datetime import datetime
from typing import Optional, Dict, Any

from src.logger import setup_logger

logger = setup_logger("api.task_manager")


class TaskManager:
    """Thread-safe in-memory task tracker."""

    def __init__(self):
        self._tasks: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def create_task(self) -> str:
        """Create a new task and return its ID."""
        task_id = str(uuid.uuid4())
        with self._lock:
            self._tasks[task_id] = {
                "status": "pending",
                "progress": 0,
                "message": "Task queued",
                "result": None,
                "error": None,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }
        logger.info(f"Task created: {task_id}")
        return task_id

    def update_task(
        self,
        task_id: str,
        status: Optional[str] = None,
        progress: Optional[int] = None,
        message: Optional[str] = None,
        result: Optional[Any] = None,
        error: Optional[str] = None,
    ):
        """Update a task's state."""
        with self._lock:
            if task_id not in self._tasks:
                logger.warning(f"Attempted to update non-existent task: {task_id}")
                return
            task = self._tasks[task_id]
            if status is not None:
                task["status"] = status
            if progress is not None:
                task["progress"] = progress
            if message is not None:
                task["message"] = message
            if result is not None:
                task["result"] = result
            if error is not None:
                task["error"] = error
            task["updated_at"] = datetime.utcnow().isoformat()

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get a task's current state."""
        with self._lock:
            return self._tasks.get(task_id)

    def delete_task(self, task_id: str):
        """Remove a completed task from memory."""
        with self._lock:
            self._tasks.pop(task_id, None)


# Singleton instance
task_manager = TaskManager()
