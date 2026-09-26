from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer,primary_key=True,index=True)
    name = Column(String,nullable=False)
    target_minutes = Column(Integer, nullable=False)
    active = Column(Boolean,default=True)

class TimerSession(Base):
    __tablename__ = "timer_sessions"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(
        Integer,
        ForeignKey("tasks.id"),
        nullable=False
    )
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)