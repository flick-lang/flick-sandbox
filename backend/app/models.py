from pydantic import BaseModel
from enum import Enum
from typing import Optional


class Stage(Enum):
    COMPILING = "compiling"
    RUNNING = "running"


class Status(Enum):
    STARTED = "started"
    IN_PROGRESS = "in_progress"
    SUCCESS = "success"
    ERROR = "error"


class Response(BaseModel):
    stage: Stage
    description: str
    status: Status
    output: Optional[str]
