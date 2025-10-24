# Copyright © 2024 Province of British Columbia
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""User settings model class.

Manages user settings like card positions and other preferences
"""
from __future__ import annotations

from sqlalchemy import Column, JSON, String

from .base_model import BaseModel
from .db import db


class UserSettings(BaseModel):
    """Definition of the UserSettings entity."""

    __tablename__ = 'user_settings'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    username = Column(db.String(100), index=True, unique=True, nullable=False)
    # Store card positions: { "app_id": position_index }
    card_positions = Column(db.JSON, nullable=True, default={})
    # Store other settings as JSON for future extensibility
    settings = Column(db.JSON, nullable=True, default={})

    @classmethod
    def find_by_username(cls, username: str):
        """Find user settings by username."""
        return cls.query.filter_by(username=username).first()

    @classmethod
    def create_or_update_settings(cls, username: str, card_positions: dict = None, settings: dict = None):
        """Create or update user settings."""
        existing = cls.find_by_username(username)
        
        if existing:
            if card_positions is not None:
                existing.card_positions = card_positions
            if settings is not None:
                existing.settings = settings
            existing.save()
            return existing
        
        # Create new settings
        new_settings = cls(
            username=username,
            card_positions=card_positions or {},
            settings=settings or {}
        )
        new_settings.save()
        return new_settings

    @classmethod
    def update_card_positions(cls, username: str, card_positions: dict):
        """Update card positions for a user."""
        return cls.create_or_update_settings(username, card_positions=card_positions)

    @classmethod
    def get_card_positions(cls, username: str):
        """Get card positions for a user."""
        user_settings = cls.find_by_username(username)
        return user_settings.card_positions if user_settings else {}

