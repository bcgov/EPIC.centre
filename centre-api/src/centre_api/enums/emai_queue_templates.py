"""Enums for the application."""
from enum import Enum


class EmailQueueTemplate(Enum):
    """Enum representing Epic application names."""

    ACCESS_REQUEST_SUBMITTED_CONFIRMATION = 'access_request_submitted_confirmation.html'
    ACCESS_REQUEST_RECEIVED_NOTIFICATION = 'access_request_received_notification.html'
