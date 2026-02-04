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
"""Tests for the util module."""
import os
import re
from unittest.mock import patch

import pytest

from centre_api.utils.util import allowedorigins


class TestAllowedOrigins:
    """Tests for the allowedorigins function."""

    def setup_method(self):
        """Clear the cache before each test so env var changes take effect."""
        allowedorigins.cache_clear()

    @patch.dict(os.environ, {'CORS_ORIGIN': ''})
    def test_empty_env_returns_empty_list(self):
        """No CORS_ORIGIN set should return empty list."""
        assert allowedorigins() == []

    @patch.dict(os.environ, {'CORS_ORIGIN': 'https://example.com'})
    def test_simple_origin(self):
        """Plain origin should be returned as-is."""
        result = allowedorigins()
        assert result == ['https://example.com']

    @patch.dict(os.environ, {'CORS_ORIGIN': 'https://a.com,https://b.com'})
    def test_multiple_origins(self):
        """Comma-separated origins should split correctly."""
        result = allowedorigins()
        assert result == ['https://a.com', 'https://b.com']

    @patch.dict(os.environ, {'CORS_ORIGIN': 'https://a.com, https://b.com'})
    def test_strips_whitespace(self):
        """Whitespace around origins should be stripped."""
        result = allowedorigins()
        assert result == ['https://a.com', 'https://b.com']

    @patch.dict(os.environ, {'CORS_ORIGIN': '*.eao.gov.bc.ca'})
    def test_wildcard_returns_regex(self):
        """Wildcard origin should return a compiled regex."""
        result = allowedorigins()
        assert len(result) == 1
        assert isinstance(result[0], re.Pattern)

    @patch.dict(os.environ, {'CORS_ORIGIN': '*.eao.gov.bc.ca'})
    def test_wildcard_matches_subdomains(self):
        """Wildcard regex should match any subdomain."""
        pattern = allowedorigins()[0]
        # Should match subdomains
        assert pattern.match('https://centre.eao.gov.bc.ca')
        assert pattern.match('https://submit.eao.gov.bc.ca')
        assert pattern.match('http://dev.eao.gov.bc.ca')

    @patch.dict(os.environ, {'CORS_ORIGIN': '*.eao.gov.bc.ca'})
    def test_wildcard_matches_with_port(self):
        """Wildcard regex should match origins with ports."""
        pattern = allowedorigins()[0]
        assert pattern.match('https://centre.eao.gov.bc.ca:3000')
        assert pattern.match('http://app.eao.gov.bc.ca:8080')

    @patch.dict(os.environ, {'CORS_ORIGIN': '*.eao.gov.bc.ca'})
    def test_wildcard_rejects_wrong_domain(self):
        """Wildcard regex should not match different domains."""
        pattern = allowedorigins()[0]
        assert not pattern.match('https://evil.com')
        assert not pattern.match('https://eao.gov.bc.ca.evil.com')

    @patch.dict(os.environ, {'CORS_ORIGIN': 'https://app.com,*.eao.gov.bc.ca'})
    def test_mixed_origins(self):
        """Mix of plain origins and wildcards should work."""
        result = allowedorigins()
        assert len(result) == 2
        assert result[0] == 'https://app.com'
        assert isinstance(result[1], re.Pattern)
