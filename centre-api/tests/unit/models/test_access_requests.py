# Copyright © 2026 Province of British Columbia
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
"""Tests for the one-pending-request-per-user-and-app index."""
import pytest
from sqlalchemy import insert
from sqlalchemy.exc import IntegrityError

from centre_api.enums.access_request_status import AccessRequestsStatusEnum
from centre_api.models.access_requests import AccessRequests
from centre_api.models.applications import Application


def _create_app(session):
    """Create and return a test application."""
    app = Application(title='Pending Index App', name='pending_index_test_app', description='Test',
                      launch_url='https://test.com', is_active=True)
    session.add(app)
    session.commit()
    return app


def test_second_pending_request_is_rejected(session):
    """The database refuses a second pending request for the same user and app."""
    app = _create_app(session)
    session.add(AccessRequests(app_id=app.id, user_auth_guid='guid-1'))
    session.commit()

    # Insert on the connection inside its own savepoint, so the failure doesn't end the test's transaction
    connection = session.connection()
    savepoint = connection.begin_nested()
    with pytest.raises(IntegrityError):
        connection.execute(insert(AccessRequests.__table__).values(
            app_id=app.id, user_auth_guid='guid-1', status=AccessRequestsStatusEnum.PENDING.name))
    savepoint.rollback()


def test_closed_requests_do_not_block_a_new_pending_one(session):
    """Approved or rejected requests don't count toward the pending limit."""
    app = _create_app(session)
    session.add(AccessRequests(app_id=app.id, user_auth_guid='guid-1', status=AccessRequestsStatusEnum.APPROVED))
    session.add(AccessRequests(app_id=app.id, user_auth_guid='guid-1', status=AccessRequestsStatusEnum.REJECTED))
    session.add(AccessRequests(app_id=app.id, user_auth_guid='guid-1'))
    session.add(AccessRequests(app_id=app.id, user_auth_guid='guid-2'))
    session.commit()

    assert AccessRequests.query.filter_by(app_id=app.id).count() == 4
