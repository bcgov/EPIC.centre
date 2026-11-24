"""Work out which SSL renewal notices are due and send them through Eagle Notify.

A notice is logged only once Eagle Notify accepts it, so a failed send is retried next run.
"""
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Optional

from flask import current_app, render_template

from centre_api.models import SslCertificate, SslNotification
from centre_api.models.db import db
from centre_api.services.eagle_notify_service import EagleNotifyError, EagleNotifyService


TEMPLATE_ID = 'centre-ssl-renewal'
EXPIRED = 'expired'
CHECK_FAILING = 'check_failing'
RENEWAL_LABELS = {
    'NONE': 'No action yet',
    'TICKET_CREATED': 'Ticket created',
    'ORDERED': 'Certificate ordered',
    'PLANNED': 'Installation planned',
}


@dataclass
class DueNotice:
    """A notice one certificate is due."""

    certificate: SslCertificate
    notice: str  # expired, expires_within_<days> or check_failing
    occurrence: str  # The expiry date or failure start it's about


@dataclass
class NoticeRun:
    """What a run of send_due_notices did."""

    due: int = 0
    sent: List[str] = field(default_factory=list)  # Recipients emailed
    failed: List[str] = field(default_factory=list)  # "recipient: reason"
    skipped_reason: Optional[str] = None


def _days_left(certificate: SslCertificate, now: datetime) -> int:
    return max((certificate.expires_at - now).days, 0)


class SslNotificationService:
    """Renewal notices for SSL certificates."""

    @staticmethod
    def due_notices(certificate: SslCertificate, now: datetime) -> List[DueNotice]:
        """Return the notices a certificate is due at `now`, whether or not they were sent."""
        if certificate.is_platform_managed:
            return []

        notices = []
        expired = False
        if certificate.expires_at is not None:
            occurrence = certificate.expires_at.date().isoformat()
            remaining = certificate.expires_at - now
            if remaining <= timedelta(0):
                expired = True
                notices.append(DueNotice(certificate, EXPIRED, occurrence))
            else:
                notice_days = current_app.config['SSL_NOTICE_DAYS']
                within = [days for days in notice_days if remaining <= timedelta(days=days)]
                if within:
                    notices.append(DueNotice(certificate, f'expires_within_{min(within)}', occurrence))

        failing_since = certificate.failing_since
        grace = timedelta(hours=current_app.config['SSL_FAILING_NOTICE_HOURS'])
        # An expired certificate also fails its check; the expiry notice already covers it
        if not expired and failing_since is not None and now - failing_since >= grace:
            notices.append(DueNotice(certificate, CHECK_FAILING, failing_since.isoformat(timespec='seconds')))
        return notices

    @classmethod
    def send_due_notices(cls, now: Optional[datetime] = None) -> NoticeRun:
        """Email each recipient the due notices they haven't had."""
        now = now or datetime.utcnow()
        run = NoticeRun()
        recipients = current_app.config.get('SSL_NOTIFICATION_RECIPIENTS', [])
        if not recipients:
            run.skipped_reason = 'SSL_NOTIFICATION_RECIPIENTS is empty, so no notices are sent here'
            return run

        due = [notice for certificate in SslCertificate.find_in_use() for notice in cls.due_notices(certificate, now)]
        run.due = len(due)

        for recipient in recipients:
            pending = [
                notice for notice in due
                if not SslNotification.already_sent(
                    notice.certificate.id, notice.notice, notice.occurrence, recipient,
                )
            ]
            if not pending:
                continue

            subject, html = cls.render(pending, now)
            try:
                message_id = EagleNotifyService.send_email(recipient, subject, html, TEMPLATE_ID)
            except EagleNotifyError as err:
                current_app.logger.error('SSL notice to a recipient failed: %s', err)
                run.failed.append(f'{recipient}: {err}')
                continue

            for notice in pending:
                db.session.add(SslNotification(
                    certificate_id=notice.certificate.id, notice=notice.notice, occurrence=notice.occurrence,
                    recipient=recipient, message_id=message_id, sent_at=now,
                ))
            db.session.commit()
            run.sent.append(recipient)
        return run

    @classmethod
    def render(cls, notices: List[DueNotice], now: datetime):
        """Return the subject and HTML body for a recipient's notices, most urgent first."""
        items = sorted((cls._describe(notice, now) for notice in notices), key=lambda item: item['rank'])
        prefix = current_app.config.get('SSL_NOTIFICATION_SUBJECT_PREFIX', '')
        if len(items) == 1:
            subject = f"{prefix}SSL certificate for {items[0]['host']} {items[0]['headline']}"
        else:
            subject = f'{prefix}{len(items)} SSL certificates need renewal attention'

        centre_url = current_app.config.get('EPIC_CENTRE_WEB_URL', '').rstrip('/')
        days = [str(day) for day in current_app.config['SSL_NOTICE_DAYS']]
        html = render_template(
            'ssl_renewal_notice.html',
            items=items,
            page_url=f'{centre_url}/application-urls',
            notice_days=', '.join(days[:-1]) + f' and {days[-1]}' if len(days) > 1 else ''.join(days),
        )
        return subject, html

    @staticmethod
    def _describe(notice: DueNotice, now: datetime) -> dict:
        certificate = notice.certificate
        if notice.notice == EXPIRED:
            headline, rank = 'has expired', (0, 0)
        elif notice.notice == CHECK_FAILING:
            headline, rank = "can't be checked", (1, 0)
        else:
            days = _days_left(certificate, now)
            headline = 'expires within a day' if days == 0 else f"expires in {days} day{'' if days == 1 else 's'}"
            rank = (2, days)

        apps = sorted({f'{url.app_name} {url.environment}' for url in certificate.urls if url.is_active})
        return {
            'rank': rank,
            'host': certificate.host if certificate.port == 443 else f'{certificate.host}:{certificate.port}',
            'headline': headline,
            'expires_on': certificate.expires_at.strftime('%B %-d, %Y') if certificate.expires_at else None,
            'check_error': certificate.check_error if notice.notice == CHECK_FAILING else None,
            'apps': apps,
            'renewal': RENEWAL_LABELS.get(certificate.renewal_status, certificate.renewal_status),
            'ticket_reference': certificate.ticket_reference,
        }
