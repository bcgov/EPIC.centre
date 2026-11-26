"""Send email through Eagle Notify's service-sender API (POST /api/messages).

Centre's service account must be in Eagle Notify's SEND_CLIENTS. One recipient per call, no retries.
"""
import requests
from flask import current_app

from centre_api.services.keycloak_token_service import KeycloakTokenService


class EagleNotifyError(Exception):
    """Eagle Notify didn't accept the email."""


def _service_account_token() -> str:
    """Return Centre's service account token, or raise EagleNotifyError naming Keycloak as the cause."""
    try:
        token = KeycloakTokenService.get_service_account_token()
    except requests.HTTPError as err:
        status = err.response.status_code if err.response is not None else 'no response'
        raise EagleNotifyError(f'Keycloak refused the service account token ({status})') from err
    except requests.RequestException as err:
        raise EagleNotifyError(f'Could not reach Keycloak for a token: {type(err).__name__}') from err
    if not token:
        raise EagleNotifyError('Keycloak returned no access token')
    return token


class EagleNotifyService:  # pylint: disable=too-few-public-methods
    """Client for Eagle Notify."""

    @staticmethod
    def send_email(to: str, subject: str, html: str, template_id: str) -> str:
        """Send one HTML email to one address. Return Eagle Notify's message id."""
        endpoint = current_app.config.get('EAGLE_NOTIFY_EMAIL_ENDPOINT')
        if not endpoint:
            raise EagleNotifyError('EAGLE_NOTIFY_EMAIL_ENDPOINT is not set')

        token = _service_account_token()
        try:
            response = requests.post(
                endpoint,
                json={
                    'to': [to],
                    'bodyType': 'html',
                    'subject': subject,
                    'body': html,
                    # Groups these sends on Eagle Notify's dashboard
                    'template_id': template_id,
                    'args': {},
                },
                headers={'Authorization': f'Bearer {token}'},
                timeout=current_app.config.get('CONNECT_TIMEOUT', 30),
            )
        except requests.RequestException as err:
            raise EagleNotifyError(f'Could not reach Eagle Notify: {type(err).__name__}') from err

        if response.status_code != 202:
            try:
                reason = response.json().get('error')
            except ValueError:
                reason = None
            raise EagleNotifyError(f'Eagle Notify answered {response.status_code} {reason or ""}'.strip())
        return response.json().get('id')
