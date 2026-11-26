"""Enums for the application."""
from enum import Enum


class EmailQueueTemplate(Enum):
    """Enum representing Epic application names."""

    ACCESS_REQUEST_SUBMITTED_CONFIRMATION = 'access_request_submitted_confirmation.html'
    ACCESS_REQUEST_RECEIVED_NOTIFICATION = 'access_request_received_notification.html'
    ACCESS_GRANTED_NOTIFICATION = 'access_granted_notification.html'
    ACCESS_DENIED_NOTIFICATION = 'access_denied_notification.html'
