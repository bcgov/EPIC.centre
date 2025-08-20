"""
Bookmark model for storing user bookmarks in the database.
"""
from __future__ import annotations

from .base_model import BaseModel
from .db import db


class Bookmark(BaseModel):
    __tablename__ = "bookmarks"

    id = db.Column(db.Integer, primary_key=True)
    user_app_id = db.Column(db.Integer, db.ForeignKey("user_applications.id"), nullable=False)
    label = db.Column(db.String(100), nullable=False)
    url = db.Column(db.Text, nullable=False)
