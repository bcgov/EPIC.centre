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
"""EAO Analytics model class.

Manages user analytics tracking across EPIC applications
"""
from __future__ import annotations

from datetime import datetime
from sqlalchemy import Column, ForeignKey, Index, UniqueConstraint

from .base_model import BaseModel
from .db import db


class EaoAnalytics(BaseModel):
    """Definition of the EaoAnalytics entity."""

    __tablename__ = 'login_history'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    user_auth_guid = Column(db.String, nullable=False)
    last_login_time = Column(db.DateTime, nullable=False, default=datetime.utcnow)
    app_id = Column(db.Integer, ForeignKey('applications.id'), nullable=False)
    # created_by and updated_by are inherited from BaseModel

    __table_args__ = (
        UniqueConstraint('user_auth_guid', name='uq_user_auth_guid'),
        Index('ix_login_history_last_login_time', 'last_login_time'),
        Index('ix_login_history_app_id', 'app_id'),
    )

    @classmethod
    def record_login(cls, user_auth_guid: str, app_id: int):
        """Record or update login analytics for user."""
        existing = cls.query.filter_by(user_auth_guid=user_auth_guid).first()

        if existing:
            existing.last_login_time = datetime.utcnow()
            existing.app_id = app_id
            existing.save()
            return existing

        # Create new record
        new_record = cls(
            user_auth_guid=user_auth_guid,
            last_login_time=datetime.utcnow(),
            app_id=app_id
        )
        new_record.save()
        return new_record

    @classmethod
    def get_user_analytics(cls, user_auth_guid: str):
        """Get analytics record for a user."""
        return cls.query.filter_by(user_auth_guid=user_auth_guid).first()

    @classmethod
    def get_all_analytics(cls, sort_by='last_login_time', order='desc', limit=None):
        """Get all analytics records with optional sorting and limit."""
        query = cls.query

        if sort_by == 'last_login_time':
            if order == 'desc':
                query = query.order_by(cls.last_login_time.desc())
            else:
                query = query.order_by(cls.last_login_time.asc())
        elif sort_by == 'user_auth_guid':
            if order == 'desc':
                query = query.order_by(cls.user_auth_guid.desc())
            else:
                query = query.order_by(cls.user_auth_guid.asc())

        if limit:
            query = query.limit(limit)

        return query.all()

