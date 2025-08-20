"""
User Applications Model

"""
from __future__ import annotations

from .base_model import BaseModel
from .db import db


class UserApplication(BaseModel):
    __tablename__ = "user_applications"

    id = db.Column(db.Integer, primary_key=True)
    user_auth_guid = db.Column(db.String(), nullable=False, unique=True)
    app_id = db.Column(db.Integer, db.ForeignKey("applications.id"), nullable=False)
    access_level = db.Column(db.String(50))
    last_accessed = db.Column(db.DateTime)
    sort_order = db.Column(db.Integer, default=0, nullable=False)

    app = db.relationship("Application", backref="user_applications")
    bookmarks = db.relationship("Bookmark", backref="user_applications", cascade="all, delete")
