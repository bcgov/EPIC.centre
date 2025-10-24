"""Staff user model class.

Manages the staff user
"""
from __future__ import annotations

from typing import Optional

from sqlalchemy import Column, String
from sqlalchemy.orm import column_property

from .base_model import BaseModel
from .db import db


class User(BaseModel):
    """Definition of the User entity."""

    __tablename__ = 'staff_users'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    first_name = Column(db.String(50))
    middle_name = Column(db.String(50), nullable=True)
    last_name = Column(db.String(50))
    full_name = column_property(first_name + ' ' + last_name)
    # To store the IDP user name..ie IDIR username
    username = Column('username', String(100), index=True, unique=True)
    email_address = Column(db.String(100), nullable=True)
    contact_number = Column(db.String(50), nullable=True)

    @classmethod
    def get_all(cls):
        """Fetch list of users by access type."""
        return cls.query.all()

    @classmethod
    def find_by_username(cls, username: str):
        """Find user by username."""
        return cls.query.filter_by(username=username).first()

    @classmethod
    def create_user(cls, user_data) -> User:
        """Create user."""
        user = User(
            username=user_data.get('username', None),
            first_name=user_data.get('first_name', None),
            middle_name=user_data.get('middle_name', None),
            last_name=user_data.get('last_name', None),
            email_address=user_data.get('email_address', None),
            contact_number=user_data.get('contact_number', None),
        )
        user.save()
        return user

    @classmethod
    def update_user(cls, user_id, user_dict) -> Optional[User]:
        """Update user."""
        query = User.query.filter_by(id=user_id)
        user: User = query.first()
        if not user:
            return None

        query.update(user_dict)
        db.session.commit()
        return user
