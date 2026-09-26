from fastapi import FastAPI,Depends,HTTPException
from database import engine,Base,SessionLocal
from sqlalchemy.orm import Session
import schemas
import models
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine);

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/tasks")
def create_task(
        task : schemas.taskCreate,
        db : Session = Depends(get_db)
):
    new_task = models.Task(
        name = task.name,
        target_minutes= task.target_minutes
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@app.post("/tasks/{task_id}/start")
def start_session(
    task_id: int,
    db: Session = Depends(get_db)
):
    # 1. Check whether the task exists
    task = db.query(models.Task).filter(
        models.Task.id == task_id
    ).first()

    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    # 2. Check whether this task is already running
    running_session = db.query(models.TimerSession).filter(
        models.TimerSession.task_id == task_id,
        models.TimerSession.end_time == None
    ).first()

    if running_session is not None:
        raise HTTPException(
            status_code=400,
            detail="Timer is already running"
        )

    # 3. Start a new timer session
    new_session = models.TimerSession(
        task_id=task_id,
        start_time=datetime.now()
    )

    # 4. Save it
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return new_session


@app.post("/tasks/{task_id}/pause")
def pause_session(task_id:int,db : Session = Depends(get_db)):
    running_session = db.query(models.TimerSession).filter(
        models.TimerSession.task_id == task_id,
        models.TimerSession.end_time == None
    ).first()

    if running_session is None:
        raise HTTPException(
            status_code=404,
            detail="no running session found"
        )
    running_session.end_time = datetime.now()

    db.commit()
    db.refresh(running_session)
    return running_session

@app.get("/tasks/{task_id}/progress")
def get_progress(
    task_id : int,
    db : Session = Depends(get_db)
):
    task = db.query(models.Task).filter(
    models.Task.id == task_id
    ).first()
    if task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )
    finished_session = db.query(models.TimerSession).filter(
        models.TimerSession.task_id == task_id,
        models.TimerSession.end_time != None
    ).all()

    completed_seconds = 0
    for session in finished_session:
        duration = session.end_time - session.start_time
        completed_seconds += duration.total_seconds()
    completed_minutes = int(completed_seconds // 60)
    remaining_minutes = max(task.target_minutes - completed_minutes,0)

    running_session = db.query(models.TimerSession).filter(
    models.TimerSession.task_id == task_id,
    models.TimerSession.end_time == None
    ).first()

    is_running = running_session is not None

    current_start_time = (
        running_session.start_time
        if running_session is not None
        else None
    )

    return {
        "task_id": task.id,
        "name": task.name,
        "target_minutes": task.target_minutes,
        "completed_minutes": completed_minutes,
        "remaining_minutes": remaining_minutes,
        "is_running": is_running,
        "current_start_time": current_start_time
    }


@app.get("/tasks")
def get_tasks(db: Session = Depends(get_db)):
    tasks = db.query(models.Task).all()
    return tasks

@app.get("/timer_sessions")
def get_tasks(db: Session = Depends(get_db)):
    tasks = db.query(models.TimerSession).all()
    return tasks


