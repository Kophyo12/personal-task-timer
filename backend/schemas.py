from pydantic import BaseModel

class taskCreate(BaseModel):
    name : str
    target_minutes : int