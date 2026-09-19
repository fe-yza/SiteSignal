from pydantic import BaseModel


class DismissIntroRequest(BaseModel):
    pass


class DismissHintRequest(BaseModel):
    hint_key: str
