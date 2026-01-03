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

from datetime import datetime, timezone
from sqlalchemy import Column, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import insert

from .base_model import BaseModel
from .db import db


class EaoAnalytics(BaseModel):
    """Definition of the EaoAnalytics entity."""

    __tablename__ = 'login_histories'

    id = Column(db.Integer, primary_key=True, autoincrement=True)
    user_auth_guid = Column(db.String, nullable=False)
    last_login_time = Column(db.DateTime, nullable=False, default=datetime.utcnow)
    app_id = Column(db.Integer, ForeignKey('applications.id'), nullable=False)
    # created_by and updated_by are inherited from BaseModel

    __table_args__ = (
        UniqueConstraint('user_auth_guid', 'app_id', name='uq_login_histories_user_auth_guid_app_id'),
        Index('ix_login_histories_last_login_time', 'last_login_time'),
        Index('ix_login_histories_app_id', 'app_id'),
    )

    @classmethod
    def record_login(cls, user_auth_guid: str, app_id: int):
        """Record or update a user's login for a specific application."""
        now = datetime.now(timezone.utc)

        stmt = insert(cls).values(
            user_auth_guid=user_auth_guid,
            app_id=app_id,
            last_login_time=now,
            created_date=now,  # Only set on insert, preserved on update
            updated_date=now
        )

        stmt = stmt.on_conflict_do_update(
            constraint='uq_login_histories_user_auth_guid_app_id',
            set_={
                'last_login_time': stmt.excluded.last_login_time,
                'updated_date': stmt.excluded.updated_date
            }
        )

        db.session.execute(stmt)
        db.session.commit()

        return cls.query.filter_by(user_auth_guid=user_auth_guid, app_id=app_id).first()

    @classmethod
    def get_user_analytics(cls, user_auth_guid: str):
        """Get analytics record for a user."""
        return cls.query.filter_by(user_auth_guid=user_auth_guid).first()

    @classmethod
    def get_user_app_login(cls, user_auth_guid: str, app_id: int):
        """Get login analytics record for a specific user and app."""
        return cls.query.filter_by(user_auth_guid=user_auth_guid, app_id=app_id).first()

    @classmethod
    def get_user_app_logins_batch(cls, user_auth_guid: str, app_ids: list[int]):
        """Get login analytics records for a specific user and multiple apps in one query.

        Returns a dictionary mapping app_id to last_login_time.
        """
        if not user_auth_guid or not app_ids:
            return {}

        records = cls.query.filter(
            cls.user_auth_guid == user_auth_guid,
            cls.app_id.in_(app_ids)
        ).all()

        return {record.app_id: record.last_login_time for record in records if record.last_login_time}

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
