"""Enums for the access request."""
from enum import Enum


class AccessRequestsStatusEnum(Enum):
    """Access request status enum."""
    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'
    CANCELLED = 'CANCELLED'
