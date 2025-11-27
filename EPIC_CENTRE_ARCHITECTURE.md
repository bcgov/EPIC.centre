# EPIC.centre Architecture & Context Documentation

> **Last Updated**: 2025-11-21
> **Purpose**: Comprehensive reference for understanding EPIC.centre's architecture, user roles, permissions, and implementation patterns.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Application Architecture](#application-architecture)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Authentication & Authorization](#authentication--authorization)
5. [auth-api Integration](#auth-api-integration)
6. [EPIC Applications Ecosystem](#epic-applications-ecosystem)
7. [Launchpad Feature](#launchpad-feature)
8. [Key Components Reference](#key-components-reference)
9. [Data Models](#data-models)
10. [API Endpoints](#api-endpoints)
11. [Permission Patterns](#permission-patterns)
12. [Common Implementation Patterns](#common-implementation-patterns)

---

## System Overview

### What is EPIC.centre?

**EPIC.centre** is an authentication and authorization management portal that serves as a user-friendly layer over Keycloak operations. It allows non-technical administrators to manage user access across all EPIC applications without directly interacting with Keycloak.

### Purpose

EPIC.centre serves two primary functions:

#### 1. Application Launchpad (All Users)
- **Single Sign-On (SSO) Portal**: Centralized location where all users can see and access their EPIC applications
- **Quick Access**: Users can launch any application they have access to via "Open in new tab"
- **Session Sharing**: Keycloak session is maintained across applications, providing seamless SSO experience
- **Bookmarking**: Users can add up to 3 custom bookmarks per application for frequently accessed pages
- **Access Information**: View current access level and last accessed date for each application

#### 2. User & Access Management (Admins Only)
- Simplify user access management across the EPIC ecosystem
- Provide controlled, role-based access to Keycloak operations
- Handle access requests and approvals workflow
- Enable app-specific administrators to manage their own applications
- Centralize user account management (enable/disable users)

### Target Users

1. **Digital Services Team (DST)** - Super administrators with full control
2. **App Admins/Super Users** - Application-specific administrators
3. **Regular Staff** - End users who request access to applications

---

## Application Architecture

### Technology Stack

#### Backend (centre-api)
- **Framework**: Python Flask with Flask-RESTX
- **Authentication**: JWT via Keycloak OIDC
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Migrations**: Alembic
- **Security**: Rate limiting, CORS, comprehensive security headers
- **API Documentation**: Swagger/OpenAPI (via Flask-RESTX)

**Location**: `C:\Users\jadms\OneDrive\Desktop\epic-centre\EPIC.centre\centre-api`

#### Frontend (centre-web)
- **Framework**: React 18 with TypeScript
- **Routing**: TanStack Router (file-based routing)
- **UI Library**: Material-UI (MUI)
- **State Management**: React Query (TanStack Query) for server state
- **Authentication**: react-oidc-context
- **HTTP Client**: Axios
- **Theme**: epic.theme (BC Design Tokens)

**Location**: `C:\Users\jadms\OneDrive\Desktop\epic-centre\EPIC.centre\centre-web`

### Repository Structure

```
EPIC.centre/
├── centre-api/              # Backend Flask API
│   ├── src/centre_api/
│   │   ├── models/          # SQLAlchemy models
│   │   ├── resources/       # API endpoints (Flask-RESTX)
│   │   ├── services/        # Business logic layer
│   │   ├── schemas/         # Marshmallow schemas
│   │   ├── enums/           # Enumerations
│   │   ├── utils/           # Utility functions
│   │   └── auth.py          # JWT authentication setup
│   ├── migrations/          # Alembic migrations
│   └── tests/
│
└── centre-web/              # Frontend React app
    └── src/
        ├── components/      # React components
        │   ├── AuthManagement/  # Admin UI for managing users
        │   ├── RequestAccessTile/  # User-facing access request UI
        │   └── Shared/      # Reusable components
        ├── routes/          # File-based routing
        ├── hooks/           # Custom React hooks
        │   └── api/         # React Query hooks
        ├── models/          # TypeScript types
        ├── utils/           # Utility functions
        └── services/        # API client services
```

---

## User Roles & Permissions

### User Type Definitions

#### 1. Digital Services Team (DST)

**Who They Are**:
- Super administrators for the entire EPIC Keycloak realm
- Technical team responsible for overall system management

**Identifying Characteristics**:
- Have `manage_auth` OR `manage_users` roles in the `epic-centre` Keycloak client
- Considered "super admins" across all EPIC applications

**Permissions**:
- ✅ View and manage ALL users across ALL applications
- ✅ Approve/deny access requests for ANY application (with exceptions)
- ✅ Enable/disable user accounts
- ✅ View all access requests (even for apps they don't directly administer)
- ❌ **EXCEPTION**: Cannot assign roles in EPIC.compliance (only deny/revoke)
- ❌ Cannot disable their own account
- ❌ Cannot request access (they can grant themselves access directly)

**Detection** (Frontend):
```typescript
import { useCurrentUser } from "@/contexts/UserContext";

const { isDstAdmin } = useCurrentUser();
```

**Detection** (Backend):
```python
from centre_api.utils.token_info import TokenInfo
from centre_api.enums.epic_app import EpicAppClientName

is_dst = TokenInfo.has_admin_roles(EpicAppClientName.EPIC_CENTRE.value)
```

---

#### 2. App Admins / Super Users

**Who They Are**:
- Administrators for specific EPIC applications
- May be technical or non-technical users

**Identifying Characteristics**:
- Have admin roles for specific clients (e.g., `super_user` for `epic-compliance`)
- Each app defines its own admin roles (see [Admin Roles Mapping](#admin-roles-mapping))

**Permissions**:
- ✅ View users who have access to THEIR application
- ✅ Approve/deny access requests for THEIR application
- ✅ Assign/revoke roles within THEIR application
- ❌ Cannot manage users in other applications
- ❌ Cannot enable/disable user accounts
- ❌ Cannot see access requests for other applications

**Detection** (Frontend):
```typescript
import { useCurrentUser } from "@/contexts/UserContext";
import { EpicAppName } from "@/models/EpicApp";

const { adminStatusPerApp } = useCurrentUser();
const isComplianceAdmin = adminStatusPerApp[EpicAppName.EPIC_COMPLIANCE];
const isTrackAdmin = adminStatusPerApp[EpicAppName.EPIC_TRACK];
```

**Detection** (Backend):
```python
from centre_api.utils.token_info import TokenInfo

is_compliance_admin = TokenInfo.has_admin_roles('epic-compliance')
is_track_admin = TokenInfo.has_admin_roles('epictrack-web')
```

---

#### 3. Regular Staff

**Who They Are**:
- End users of EPIC applications
- No administrative responsibilities

**Identifying Characteristics**:
- Do NOT have admin roles in any application
- May have functional roles (e.g., `viewer`, `editor`, `analyst`)

**Permissions**:
- ✅ Request access to applications
- ❌ Cannot see other users' information
- ❌ Cannot approve/deny access requests
- ❌ Cannot access EPIC.auth (AuthManagement) pages

---

### Admin Roles Mapping

The following table shows which roles grant administrative access for each EPIC application:

| Application | Client Name | Admin Roles | Description |
|-------------|-------------|-------------|-------------|
| **EPIC.centre** (EPIC.auth) | `epic-centre` | `manage_auth`, `manage_users` | Grants DST super admin status |
| **EPIC.track** | `epictrack-web` | `manage_users` | Manage EPIC.track users |
| **EPIC.engage** | `epic-engage` | `manage_users` | Manage EPIC.engage users |
| **EPIC.compliance** | `epic-compliance` | `super_user` | Manage EPIC.compliance users |
| **EPIC.submit** | `epic-submit` | `extended_eao_edit` | Manage EPIC.submit users |
| **EPIC.public** | `epic-public` | _(none defined)_ | No user management |
| **Condition Repository** | `epic-condition` | _(none defined)_ | No user management |

**Sources**:
- Frontend: `centre-web/src/utils/constants.ts` (EPIC_ADMIN_ROLES)
- Backend: `centre-api/src/centre_api/enums/epic_app.py` (CLIENT_APP_NAME_TO_ADMIN_ROLES_MAP)

**⚠️ Note**: There are minor discrepancies between frontend and backend role definitions for some apps. Backend is the source of truth.

---

## Authentication & Authorization

### JWT Token Structure

EPIC.centre uses Keycloak OIDC tokens with the following structure:

```json
{
  "sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "preferred_username": "JSMITH",
  "given_name": "John",
  "family_name": "Smith",
  "email": "john.smith@gov.bc.ca",
  "groups": [
    "/TRACK/ADMIN",
    "/ENGAGE/INSTANCE_ADMIN",
    "/COMPLIANCE/VIEWER"
  ],
  "resource_access": {
    "epic-centre": {
      "roles": ["manage_auth", "manage_users"]
    },
    "epictrack-web": {
      "roles": ["manage_users", "create_project"]
    },
    "epic-compliance": {
      "roles": ["super_user"]
    }
  },
  "realm_access": {
    "roles": ["offline_access", "uma_authorization"]
  }
}
```

### Key Token Fields

| Field | Purpose | Used For |
|-------|---------|----------|
| `sub` | Subject ID (unique user identifier) | User ID matching in database |
| `preferred_username` | Keycloak username | User lookup, display |
| `given_name`, `family_name` | User's name | Display purposes |
| `email` | User's email | Notifications, display |
| `groups` | Keycloak group memberships | Group hierarchy, role assignments |
| `resource_access` | Client-specific roles | **Permission checks, admin detection** |
| `realm_access` | Realm-level roles | Usually not used for app permissions |

### Frontend Authentication

**Library**: `react-oidc-context`

**Usage**:
```typescript
import { useAuth } from "react-oidc-context";

const MyComponent = () => {
  const auth = useAuth();

  // Access token for API calls
  const token = auth.user?.access_token;

  // User information
  const username = auth.user?.profile.preferred_username;
  const firstName = auth.user?.profile.given_name;
  const userId = auth.user?.profile.sub;

  // Authentication status
  const isAuthenticated = auth.isAuthenticated;

  return <div>Hi, {firstName}</div>;
};
```

**Token Decoding**:
```typescript
import { jwtDecode } from "jwt-decode";

const tokenData = jwtDecode(auth.user?.access_token);
const roles = tokenData.resource_access?.['epic-centre']?.roles || [];
```

### Backend Authentication

**Decorator**: `@auth.require`

**Usage**:
```python
from centre_api.auth import auth
from flask import g

@auth.require
def my_endpoint():
    # Token automatically validated and decoded
    token_info = g.jwt_oidc_token_info

    username = token_info.get('preferred_username')
    user_id = token_info.get('sub')
    resource_access = token_info.get('resource_access', {})

    return {'username': username}
```

**Token Access**:
```python
from centre_api.utils.token_info import TokenInfo

# Get user data
user_data = TokenInfo.get_user_data()
# Returns: {external_id, first_name, last_name, email_address, username, resource_access}

# Check admin roles
is_admin = TokenInfo.has_admin_roles('epic-centre')

# Get admin status for all apps
admin_map = TokenInfo.get_admin_roles_map()
# Returns: {'epic-centre': True, 'epictrack-web': False, ...}
```

---

## auth-api Integration

### Overview

**auth-api** is a critical dependency for EPIC.centre, serving as a **Flask-based wrapper around Keycloak's Admin API**. It provides simplified, secure endpoints for managing users and groups in Keycloak without requiring direct interaction with Keycloak's complex admin interface.

**Repository Location**: `C:\Users\jadms\OneDrive\Desktop\EPIC-auth\EPIC.auth\auth-api`

**Purpose**:
- Abstracts Keycloak Admin API complexity
- Provides RESTful endpoints for user/group management
- Handles admin authentication via service account
- Supports app-scoped filtering via `App-Id` header
- Enforces safe user update operations

---

### Why EPIC.centre Depends on auth-api

EPIC.centre (centre-api) **does not directly call Keycloak Admin APIs**. Instead, it relies on auth-api as an intermediary service:

```
┌─────────────────┐
│  EPIC.centre    │
│  (centre-api)   │
└────────┬────────┘
         │ HTTP Requests with
         │ Bearer Token + App-Id Header
         ▼
┌─────────────────┐
│    auth-api     │
│ (Keycloak       │
│  Admin Wrapper) │
└────────┬────────┘
         │ Admin API Calls
         │ (Service Account)
         ▼
┌─────────────────┐
│    Keycloak     │
│   Admin API     │
└─────────────────┘
```

**Benefits**:
- **Separation of Concerns**: EPIC.centre focuses on business logic, not Keycloak API details
- **Centralized Auth Logic**: All EPIC apps can use the same auth-api service
- **Secure Admin Access**: Only auth-api has admin credentials; apps use standard JWT tokens
- **Consistent API**: Stable interface even if Keycloak API changes

---

### Architecture

#### Technology Stack

- **Framework**: Python Flask with Flask-RESTX
- **Authentication**: JWT validation via flask-jwt-oidc
- **Database**: PostgreSQL with SQLAlchemy (for local state if needed)
- **API Docs**: Swagger/OpenAPI via Flask-RESTX
- **Admin Auth**: Keycloak service account with client credentials

#### Directory Structure

```
auth-api/
├── src/auth_api/
│   ├── services/
│   │   ├── keycloak.py         # Low-level Keycloak Admin API client
│   │   ├── user_service.py     # User management business logic
│   │   └── group_service.py    # Group management business logic
│   ├── resources/
│   │   ├── user.py             # User REST endpoints
│   │   └── group.py            # Group REST endpoints
│   ├── models/
│   │   └── user.py             # SQLAlchemy models (if any)
│   ├── schemas/                # Marshmallow request/response schemas
│   ├── auth.py                 # JWT authentication decorator
│   ├── config.py               # Configuration management
│   └── __init__.py             # Flask app factory
├── migrations/                  # Alembic migrations
└── tests/
```

---

### Key Services

#### 1. KeycloakService

**Location**: [keycloak.py](C:\Users\jadms\OneDrive\Desktop\EPIC-auth\EPIC.auth\auth-api\src\auth_api\services\keycloak.py)

**Purpose**: Low-level client for Keycloak Admin REST API

**Key Methods**:

```python
class KeycloakService:
    # User Operations
    @staticmethod
    def get_users(search_text: str = None) -> list:
        """Get users with optional search filter."""

    @staticmethod
    def get_user_by_username(username: str) -> dict:
        """Get user by username."""

    @staticmethod
    def get_user_by_id(user_id: str) -> dict:
        """Get user by Keycloak UUID."""

    @staticmethod
    def dangerously_overwrite_all_user_data(user_id: str, user_representation: dict):
        """⚠️ FULL REPLACEMENT of user data. Must fetch existing user first."""

    # Group Operations
    @staticmethod
    def get_groups(brief_representation: bool = False) -> list:
        """Get all groups."""

    @staticmethod
    def get_group_by_name(group_name: str, sub_group_name: str = None) -> dict:
        """Get group by name."""

    @staticmethod
    def get_sub_groups(group_id: str) -> list:
        """Get subgroups of a group."""

    @staticmethod
    def get_group_members(group_id: str) -> list:
        """Get members of a group."""

    # User-Group Mapping
    @staticmethod
    def get_user_groups_by_username(username: str, user_id: str = None,
                                    brief_representation: bool = False) -> list:
        """Get groups for a user."""

    @staticmethod
    def update_user_group(user_id: str, group_id: str):
        """Add user to a group."""

    @staticmethod
    def delete_user_group(user_id: str, group_id: str, kc_user_id: str = None):
        """Remove user from a group."""
```

**Admin Token Management**:
```python
@staticmethod
def _get_admin_token() -> str:
    """Generate admin access token using client credentials flow."""
    # Uses KEYCLOAK_ADMIN_CLIENT and KEYCLOAK_ADMIN_SECRET
    # Returns short-lived admin token for API calls
```

---

#### 2. UserService

**Location**: [user_service.py](C:\Users\jadms\OneDrive\Desktop\EPIC-auth\EPIC.auth\auth-api\src\auth_api\services\user_service.py)

**Purpose**: Business logic for user management with app-scoped filtering

**Key Methods**:

```python
class UserService:
    @classmethod
    def get_all_users(cls, include_groups: bool = True, search_text: str = None) -> list:
        """Get users, optionally enriched with group memberships.

        Automatically filters by app_name from g.app_name (App-Id header).
        """

    @classmethod
    def get_user_by_username(cls, username: str, group_brief_representation: bool = False) -> dict:
        """Get user enriched with groups filtered by app_name."""

    @classmethod
    def update_user_by_username(cls, username: str, user_data: dict):
        """Update user with strict field validation.

        Only allows: firstName, lastName, enabled
        Fetches full user first to preserve other fields.
        """

    @classmethod
    def update_user_group(cls, user_id: str, user_data: dict):
        """Assign user to a group.

        Removes user from other groups in the same app parent group.
        """

    @classmethod
    def delete_user_group(cls, user_id: str, group_name: str, del_sub_group_mappings: bool):
        """Remove user from a group and optionally all subgroups."""

    @classmethod
    def delete_all_user_groups(cls, user_id: str) -> bool:
        """Remove user from all groups (uses ThreadPoolExecutor)."""
```

**App-Scoped Filtering**:
```python
@classmethod
def enrich_user_with_groups(cls, app_name, group_brief_representation, user, user_id, username):
    """Enrich user with groups, filtered by app_name if provided."""
    user_groups = KeycloakService.get_user_groups_by_username(username, user_id)

    # Filter to only groups matching the app
    app_groups = [
        group for group in user_groups
        if app_name.lower() in group.get("path", "").lower()
    ] if app_name else user_groups

    user["groups"] = app_groups
    return user
```

---

#### 3. GroupService

**Location**: [group_service.py](C:\Users\jadms\OneDrive\Desktop\EPIC-auth\EPIC.auth\auth-api\src\auth_api\services\group_service.py)

**Purpose**: Group retrieval and management

**Key Methods**:

```python
class GroupService:
    @classmethod
    def get_group(cls, group_data: dict) -> dict:
        """Get group by name with optional subgroups.

        Args:
            group_data: {
                'group_name': str,
                'include_sub_groups': bool (default False)
            }
        """
```

---

### REST API Endpoints

#### User Endpoints

**Base Path**: `/api/users`

| Method | Endpoint | Purpose | Query Params |
|--------|----------|---------|--------------|
| GET | `/api/users` | Get all users | `include_groups` (bool), `search` (str) |
| GET | `/api/users/<username>` | Get user by username | `group_brief_representation` (bool) |
| GET | `/api/users/guid/<user_auth_guid>` | Get user by Keycloak UUID | `group_brief_representation` (bool) |
| PATCH | `/api/users/<username>` | Update user fields | - |
| GET | `/api/users/<user_id>/groups` | Get user's groups | - |
| PUT | `/api/users/<user_id>/groups` | Assign user to group | - |
| DELETE | `/api/users/<user_id>/groups` | Remove all user groups | - |
| DELETE | `/api/users/<user_id>/groups/<group_name>` | Remove specific group | `del_sub_group_mappings` (bool) |
| GET | `/api/users/groups/<group_name>/members` | Get group members | `sub_group_name` (str) |

**Source**: [user.py](C:\Users\jadms\OneDrive\Desktop\EPIC-auth\EPIC.auth\auth-api\src\auth_api\resources\user.py)

---

#### Group Endpoints

**Base Path**: `/api/groups`

| Method | Endpoint | Purpose | Query Params |
|--------|----------|---------|--------------|
| GET | `/api/groups/<group_name>` | Get group by name | `include_sub_groups` (bool) |

**Source**: [group.py](C:\Users\jadms\OneDrive\Desktop\EPIC-auth\EPIC.auth\auth-api\src\auth_api\resources\group.py)

---

### Authentication & Authorization

#### Request Authentication

All endpoints require JWT Bearer token:

```http
GET /api/users
Authorization: Bearer <keycloak_jwt_token>
App-Id: epic-centre
```

**Auth Decorator**: [auth.py](C:\Users\jadms\OneDrive\Desktop\EPIC-auth\EPIC.auth\auth-api\src\auth_api\auth.py)

```python
@auth.require
def my_endpoint():
    # Token automatically validated
    # Token info available in g.jwt_oidc_token_info
    pass
```

#### App-Scoped Filtering

The `App-Id` header is read during request processing:

**Source**: [__init__.py:64](C:\Users\jadms\OneDrive\Desktop\EPIC-auth\EPIC.auth\auth-api\src\auth_api\__init__.py#L64)

```python
@app.before_request
def set_origin():
    g.origin_url = request.environ.get("HTTP_ORIGIN", "localhost")
    g.app_name = request.headers.get("App-Id", None)  # ⭐ Stored in Flask g
```

Services then use `g.app_name` to filter results:

```python
app_name = g.app_name  # e.g., "epic-centre"
# Only return groups/users for this app
```

---

### Configuration

**Location**: [config.py](C:\Users\jadms\OneDrive\Desktop\EPIC-auth\EPIC.auth\auth-api\src\auth_api\config.py)

#### Required Environment Variables

```bash
# Keycloak Admin API
KEYCLOAK_BASE_URL=https://keycloak.example.com
KEYCLOAK_REALM_NAME=epic-realm
KEYCLOAK_ADMIN_CLIENT=auth-api-admin
KEYCLOAK_ADMIN_SECRET=<admin-service-account-secret>
CONNECT_TIMEOUT=60

# JWT Validation (for incoming requests)
JWT_OIDC_WELL_KNOWN_CONFIG=https://keycloak.example.com/auth/realms/epic-realm/.well-known/openid-configuration
JWT_OIDC_ALGORITHMS=RS256
JWT_OIDC_ISSUER=https://keycloak.example.com/auth/realms/epic-realm
JWT_OIDC_AUDIENCE=account
JWT_OIDC_JWKS_URI=https://keycloak.example.com/auth/realms/epic-realm/protocol/openid-connect/certs

# Database (optional, for local state)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=auth_api
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=<password>
```

---

### How EPIC.centre Uses auth-api

#### 1. Making Requests from centre-api

**Pattern**:

```python
# In centre-api service
import requests
from flask import g

def call_auth_api(endpoint: str, method: str = 'GET', data: dict = None):
    """Helper to call auth-api with proper headers."""
    auth_api_base = current_app.config.get('AUTH_API_BASE_URL')
    url = f"{auth_api_base}/api/{endpoint}"

    headers = {
        'Authorization': g.authorization_header,  # Forward user's JWT
        'App-Id': 'epic-centre',  # Set app context
        'Content-Type': 'application/json'
    }

    response = requests.request(method, url, headers=headers, json=data)
    response.raise_for_status()
    return response.json()

# Example: Get users filtered by epic-centre
users = call_auth_api('users?include_groups=true')

# Example: Get user's groups for epic-track
headers['App-Id'] = 'epic-track'
user_groups = call_auth_api(f'users/{username}/groups')
```

#### 2. Common Use Cases

**Fetching Users**:
```python
# Get all users with their epic-track groups
response = requests.get(
    'http://auth-api:5000/api/users',
    headers={
        'Authorization': f'Bearer {jwt_token}',
        'App-Id': 'epic-track'
    },
    params={'include_groups': 'true'}
)
users = response.json()
```

**Updating User Group**:
```python
# Assign user to EPIC.track Admin group
response = requests.put(
    f'http://auth-api:5000/api/users/{username}/groups',
    headers={
        'Authorization': f'Bearer {jwt_token}',
        'App-Id': 'epic-track'
    },
    json={
        'app_name': 'TRACK',
        'group_name': 'ADMIN'
    }
)
```

**Disabling a User**:
```python
# Only firstName, lastName, enabled are allowed
response = requests.patch(
    f'http://auth-api:5000/api/users/{username}',
    headers={
        'Authorization': f'Bearer {jwt_token}',
        'App-Id': 'epic-centre'
    },
    json={'enabled': False}
)
```

---

### Important Implementation Notes

#### ⚠️ User Update Safety

auth-api enforces **strict field validation** for user updates:

**Allowed Fields**:
- `firstName`
- `lastName`
- `enabled`

**Why**: Keycloak's PUT endpoint performs a **full replacement**. If you send a partial object, it will overwrite missing fields with empty values, potentially deleting critical data like `federatedIdentities`, `attributes`, etc.

**Pattern**: Always fetch → modify → update

```python
# ❌ DANGEROUS - Will wipe other fields
requests.put(f'/users/{user_id}', json={'enabled': False})

# ✅ SAFE - Fetches full user first
user = get_user_by_id(user_id)
user['enabled'] = False
dangerously_overwrite_all_user_data(user_id, user)
```

---

#### App-Scoped Group Filtering

When `App-Id` header is set, results are **automatically filtered**:

```python
# Request with App-Id: epic-track
GET /api/users/JSMITH

# Response only includes groups matching "track" in path
{
    "username": "JSMITH",
    "groups": [
        {"name": "ADMIN", "path": "/TRACK/ADMIN"},
        {"name": "PROJECT_MANAGER", "path": "/TRACK/PROJECT_MANAGER"}
    ]
    # Groups from /ENGAGE, /COMPLIANCE, etc. are excluded
}
```

---

### API Response Examples

#### Get User with Groups

**Request**:
```http
GET /api/users/JSMITH?group_brief_representation=false
Authorization: Bearer <token>
App-Id: epic-track
```

**Response**:
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "username": "JSMITH",
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@gov.bc.ca",
  "enabled": true,
  "groups": [
    {
      "id": "group-uuid-1",
      "name": "ADMIN",
      "path": "/TRACK/ADMIN",
      "attributes": {
        "level": ["3"],
        "display_name": ["Administrator"]
      }
    },
    {
      "id": "group-uuid-2",
      "name": "PROJECT_MANAGER",
      "path": "/TRACK/PROJECT_MANAGER",
      "attributes": {
        "level": ["2"],
        "display_name": ["Project Manager"]
      }
    }
  ]
}
```

---

#### Get All Users

**Request**:
```http
GET /api/users?include_groups=true&search=smith
Authorization: Bearer <token>
App-Id: epic-centre
```

**Response**:
```json
[
  {
    "id": "user-uuid-1",
    "username": "JSMITH",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@gov.bc.ca",
    "enabled": true,
    "groups": [...]
  },
  {
    "id": "user-uuid-2",
    "username": "ASMITH",
    "firstName": "Alice",
    "lastName": "Smith",
    "email": "alice.smith@gov.bc.ca",
    "enabled": true,
    "groups": [...]
  }
]
```

---

#### Get Group Members

**Request**:
```http
GET /api/users/groups/TRACK/members?sub_group_name=ADMIN
Authorization: Bearer <token>
App-Id: epic-track
```

**Response**:
```json
[
  {
    "id": "user-uuid-1",
    "username": "JSMITH",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@gov.bc.ca",
    "enabled": true
  },
  {
    "id": "user-uuid-2",
    "username": "BJONES",
    "firstName": "Bob",
    "lastName": "Jones",
    "email": "bob.jones@gov.bc.ca",
    "enabled": true
  }
]
```

---

### Deployment Considerations

#### Service Dependencies

```yaml
# docker-compose.yml (simplified)
services:
  keycloak:
    image: quay.io/keycloak/keycloak:latest
    ports:
      - "8080:8080"

  auth-api:
    build: ./auth-api
    depends_on:
      - keycloak
    environment:
      KEYCLOAK_BASE_URL: http://keycloak:8080
      KEYCLOAK_ADMIN_CLIENT: auth-api-admin
      KEYCLOAK_ADMIN_SECRET: ${KEYCLOAK_ADMIN_SECRET}

  centre-api:
    build: ./centre-api
    depends_on:
      - auth-api
    environment:
      AUTH_API_BASE_URL: http://auth-api:5000
```

#### Network Configuration

- **auth-api** must have network access to **Keycloak Admin API**
- **centre-api** must have network access to **auth-api**
- **centre-api** does NOT need direct Keycloak admin access

---

### Troubleshooting

#### Issue: 401 Unauthorized from auth-api

**Symptoms**: Requests fail with 401 even with valid JWT

**Diagnosis**:
- Check JWT token is valid and not expired
- Verify JWT issuer matches `JWT_OIDC_ISSUER` in auth-api config
- Confirm JWKS endpoint is accessible from auth-api

---

#### Issue: Empty groups returned

**Symptoms**: User has groups in Keycloak but API returns empty array

**Diagnosis**:
- Check `App-Id` header value
- Groups are filtered by app name in path (e.g., `/TRACK/*`)
- If `App-Id` is `epic-track`, only groups with `/TRACK/` in path are returned

**Fix**: Ensure correct `App-Id` header or omit for all groups

---

#### Issue: User update fails with "disallowed fields"

**Symptoms**: PATCH request rejected with validation error

**Diagnosis**:
- auth-api only allows `firstName`, `lastName`, `enabled`
- Attempting to update other fields (e.g., `email`, `username`) is blocked

**Fix**: Only update allowed fields or use Keycloak Admin Console for other changes

---

### Security Considerations

1. **Admin Credentials**: Only auth-api has `KEYCLOAK_ADMIN_SECRET`; never expose to other services
2. **JWT Validation**: All requests validated against Keycloak OIDC
3. **Field Restrictions**: User updates limited to safe fields to prevent data corruption
4. **App Scoping**: Automatic filtering prevents cross-app data leakage
5. **Audit Logging**: Consider implementing request logging in auth-api for compliance

---

### Key Takeaways

✅ **auth-api is the single source of truth** for Keycloak user/group operations
✅ **EPIC.centre never calls Keycloak directly** - always goes through auth-api
✅ **App-Id header enables multi-tenancy** - same API, app-scoped results
✅ **Service account pattern** - auth-api uses client credentials, apps use user JWT
✅ **Safe updates enforced** - prevents accidental data loss in Keycloak

---

## EPIC Applications Ecosystem

### Application Overview

The EPIC (Environmental Assessment Process Information & Collaboration) ecosystem consists of multiple applications for managing environmental assessments in British Columbia:

| Application | Purpose | Client Name | Base Group |
|-------------|---------|-------------|------------|
| **EPIC.centre** | Auth & user management portal | `epic-centre` | `/CENTRE` |
| **EPIC.track** | Project tracking and workflow | `epictrack-web` | `/TRACK` |
| **EPIC.engage** | Public engagement platform | `epic-engage` | `/ENGAGE` |
| **EPIC.compliance** | Compliance monitoring & reporting | `epic-compliance` | `/COMPLIANCE` |
| **EPIC.submit** | Project submission portal | `epic-submit` | `/SUBMIT` |
| **EPIC.public** | Public-facing project information | `epic-public` | `/PUBLIC` |
| **Condition Repository** | Environmental conditions database | `epic-condition` | `/CONDITION` |

### Group Hierarchy

Each application organizes users in a Keycloak group hierarchy:

```
/TRACK
  ├── /ADMIN              (Highest access - manage_users role)
  ├── /PROJECT_MANAGER    (Mid-level access)
  └── /VIEWER             (Lowest access)

/COMPLIANCE
  ├── /SUPER_USER         (Highest access - super_user role)
  ├── /EDITOR
  └── /VIEWER

/ENGAGE
  ├── /INSTANCE_ADMIN     (manage_users role)
  ├── /EDITOR
  └── /VIEWER
```

**Key Concept**:
- Groups organize users hierarchically
- Roles (from `resource_access`) determine admin permissions
- A user's highest-level group in an app determines their functional access
- Admin roles (from `resource_access`) determine management permissions

### Application Status Types

Applications have different statuses from a user's perspective:

```typescript
export enum RequestAccessStatus {
  ACCESSED = "ACCESSED",      // User already has access
  PENDING = "PENDING",        // Access request pending approval
  NOT_REQUESTED = "NOT_REQUESTED"  // No access, no pending request
}
```

---

## Launchpad Feature

### Overview

The **Launchpad** is the primary landing page for all EPIC.centre users. It serves as a centralized application portal where users can:
- View all EPIC applications they have access to
- Launch applications in a new tab with Single Sign-On (SSO)
- Manage personal bookmarks for each application
- View access level and last accessed information

**Route**: `/launchpad`

**Access**: Available to ALL authenticated users (no admin role required)

---

### Key Features

#### 1. Application Tiles

Each application the user has access to is displayed as a tile containing:

| Element | Description |
|---------|-------------|
| **App Icon & Name** | Visual identifier for the application |
| **Open in New Tab** | Button with `OpenInNewIcon` that launches the app at its `launch_url` |
| **Bookmarks Section** | Display and manage up to 3 custom bookmarks per app |
| **Access Level** | Current role/access level for this application |
| **Last Accessed** | Timestamp of when user last used the application |

**Component**: `LaunchAppTile` at `centre-web/src/components/LaunchAppTile/`

---

#### 2. Single Sign-On (SSO)

**How It Works**:
1. User authenticates once to EPIC.centre via Keycloak OIDC
2. Keycloak session is stored (typically in `sessionStorage` or cookies)
3. When user clicks "Open in new tab", the target application opens with the `launch_url`
4. Target application detects existing Keycloak session and automatically authenticates the user
5. No re-login required - seamless experience across all EPIC applications

**Technical Implementation**:
```typescript
<Button
  component="a"
  href={epicApp.launch_url}
  target="_blank"
  rel="noopener noreferrer"
  endIcon={<OpenInNewIcon />}
>
  Open in new tab
</Button>
```

**Example Launch URLs**:
- EPIC.track: `https://epic-track.gov.bc.ca`
- EPIC.engage: `https://epic-engage.gov.bc.ca`
- EPIC.compliance: `https://epic-compliance.gov.bc.ca`

---

#### 3. Bookmarks Management

**Purpose**: Allow users to save frequently accessed pages within each application.

**Limits**: Up to 3 bookmarks per application

**Features**:
- Add/Edit/Delete bookmarks via modal interface
- Each bookmark has:
  - **URL**: The web address to navigate to
  - **Label**: User-friendly display name
- Click bookmark to open in new tab
- Bookmarks are user-specific and persistent

**Components**:
- `BookmarkSection.tsx` - Displays bookmarks in the tile
- `AddBookmark.tsx` - Modal for managing bookmarks

**API**:
- `PATCH /user-applications/bookmarks` - Update bookmarks for an app

**Data Structure**:
```typescript
type Bookmark = {
  url: string;
  label: string;
};

// Stored in user-application association
{
  app_id: 1,
  bookmarks: [
    { url: "https://app.com/dashboard", label: "My Dashboard" },
    { url: "https://app.com/reports", label: "Weekly Reports" },
    { url: "https://app.com/admin", label: "Admin Panel" }
  ]
}
```

**Validation**:
- URL must be valid format
- Both URL and Label are required if either is filled
- Maximum 3 bookmarks enforced

---

#### 4. Access Information Display

Each tile shows the user's access details:

**Access Level**:
- Displays the user's highest role for that application
- Examples: "Administrator", "Viewer", "Editor", "Super User"
- Corresponds to the user's highest-level Keycloak group in the app

**Last Accessed**:
- Timestamp of when user last opened/used the application
- Format: Typically ISO date string or human-readable format
- Helps users quickly identify which apps they use regularly

---

#### 5. View Mode Toggle

**ViewDescriptionSwitch**: Toggle between compact and expanded tile views

**Modes**:
- **Compact** (340px height): Shows essential information only
- **Expanded** (386px height): Includes application description

**Implementation**: State managed via `useLaunchpadStore` (Zustand store)

---

#### 6. Document Search

**Special Tile**: Document Search app (if available) is displayed separately at the top

**Component**: `DocumentSearch.tsx`

**Filtering**:
```typescript
const documentSearchApp = applications.find(
  (app) => app.name === EpicAppName.DOCUMENT_SEARCH
);
const otherApps = applications.filter(
  (app) => app.name !== EpicAppName.DOCUMENT_SEARCH
);
```

---

### Launchpad Components Reference

| Component | File | Purpose |
|-----------|------|---------|
| **Launchpad** | `routes/_authenticated/launchpad/index.tsx` | Main launchpad page |
| **LaunchAppTile** | `components/LaunchAppTile/index.tsx` | Individual app tile |
| **List** | `components/LaunchAppTile/List.tsx` | Grid layout of tiles |
| **Header** | `components/LaunchAppTile/Header.tsx` | App icon and name |
| **Content** | `components/LaunchAppTile/Content.tsx` | Tile body with actions |
| **BookmarkSection** | `components/LaunchAppTile/BookmarkSection.tsx` | Bookmark display |
| **AddBookmark** | `components/LaunchAppTile/AddBookmark.tsx` | Bookmark management modal |
| **AccessLogSection** | `components/LaunchAppTile/AccessLogSection.tsx` | Access level and last accessed |
| **ViewDescriptionSwitch** | `components/LaunchAppTile/ViewDescriptionSwitch.tsx` | Toggle tile view mode |

---

### Data Flow

**Fetching Applications**:
```typescript
// Hook: useGetApplications
const { data: applications = [], isPending } = useGetApplications();

// API Endpoint: GET /api/applications
// Returns: Array of EpicApp objects with user-specific data
```

**Application Data Structure**:
```typescript
type EpicApp = {
  id: number;
  name: EpicAppName;
  title: string;
  description: string;
  icon?: string;
  launch_url: string;        // URL to open the app
  user: {
    access_level?: string;   // User's role in this app
    last_accessed?: string;  // Last access timestamp
    bookmarks?: Bookmark[];  // User's bookmarks for this app
  };
};
```

---

### User Experience Flow

1. **User logs in** → Redirected to `/launchpad`
2. **Launchpad loads** → Fetches user's applications via `useGetApplications()`
3. **Tiles display** → Shows all apps user has access to
4. **User clicks "Open in new tab"**:
   - Browser opens new tab with `launch_url`
   - Target app reads Keycloak session from storage
   - User is automatically authenticated (SSO)
   - No login prompt shown
5. **User manages bookmarks**:
   - Clicks "Add/Edit Bookmarks"
   - Modal opens with form
   - Saves via `PATCH /user-applications/bookmarks`
   - Bookmarks immediately visible in tile

---

### Benefits

| Benefit | Description |
|---------|-------------|
| **Single Point of Entry** | Users don't need to remember URLs for each EPIC app |
| **Seamless SSO** | One login grants access to all applications |
| **Personalization** | Bookmarks let users customize their workflow |
| **Visibility** | Quick overview of access levels and usage patterns |
| **Discoverability** | Users can see what applications they have access to |

---

### Access Control

**No Restrictions**: Unlike the AuthManagement pages, the Launchpad is accessible to ALL users, regardless of admin status.

**Data Filtering**: Backend filters applications to only return those the user has access to.

```python
# Backend ensures users only see their authorized apps
def get_applications():
    user_id = TokenInfo.get_id()
    apps = ApplicationService.get_user_applications(user_id)
    return apps  # Only apps user has access to
```

---

## Key Components Reference

### Frontend Components

#### 1. AuthManagement (Admin Interface)

**Location**: `centre-web/src/components/AuthManagement/`

**Purpose**: Admin UI for managing users and access requests across EPIC applications.

**Sub-components**:

| Component | File | Purpose |
|-----------|------|---------|
| **AllUsers** | `AllUsers/index.tsx` | Search and list all users |
| **UsersTable** | `AllUsers/UsersTable/` | Paginated table of users with apps |
| **NewRequests** | `NewRequests/index.tsx` | View pending access requests |
| **RequestsTable** | `NewRequests/RequestsTable/` | Table of access requests |
| **UserAccess** | `UserAccess/index.tsx` | Individual user detail page |
| **NewAccessRequests** | `UserAccess/NewAccessRequests/` | User's pending requests |
| **CurrentAccessLevel** | `UserAccess/CurrentAccessLevel/` | User's current app access |
| **EditAccess** | `EditAccess/index.tsx` | Modal for editing user access |
| **AccessLevelSelection** | `EditAccess/AccessLevelSelection.tsx` | Role selection UI |
| **AccessLevelWarning** | `EditAccess/AccessLevelWarning.tsx` | App-specific warnings |

**Access Control**:
- Only accessible to users with admin roles (DST or app admins)
- Protected by `isAdministrator()` check in route

---

#### 2. RequestAccessTile (User Interface)

**Location**: `centre-web/src/components/RequestAccessTile/`

**Purpose**: User-facing UI for requesting access to EPIC applications.

**Components**:

| Component | File | Purpose |
|-----------|------|---------|
| **List** | `List.tsx` | Grid layout of access request tiles |
| **RequestAccessTile** | `index.tsx` | Individual app tile container |
| **Header** | `Header.tsx` | App icon and name |
| **Body** | `Body.tsx` | Request button and access log |
| **RequestAccessButton** | `Body.tsx` | Button to request access |

**States**:
- **Request Access** (enabled) - User can request access
- **Request Sent** (disabled, warning style) - Request is pending
- **Request Access** (disabled) - User already has access

---

#### 3. Shared Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **PermissionGate** | `Shared/PermissionGate/` | Conditional rendering based on roles |
| **LoadingButton** | `Shared/LoadingButton.tsx` | Button with loading state |
| **Badges** | `Shared/Badges.tsx` | Status badges (Active/Inactive) |
| **Modals** | `Shared/Modals/` | Modal management with zustand |
| **Snackbar** | `Shared/Snackbar/` | Toast notifications |

---

### Backend Services

#### 1. UserService

**Location**: `centre-api/src/centre_api/services/user_service.py`

**Key Methods**:

```python
class UserService:
    @classmethod
    def get_user_by_username(cls, username: str):
        """Retrieve a user and enrich with app access info."""

    @classmethod
    def get_users(cls, search_text: str = None, include_groups: bool = True):
        """Retrieve users and enrich with app access."""

    @classmethod
    def update_user_access(cls, username: str, access_data: dict):
        """Update user group. Requires admin permission for the app."""

    @classmethod
    def revoke_user_access(cls, username: str, access_data: dict):
        """Revoke user group. Requires admin permission for the app."""

    @classmethod
    def update_user_status(cls, username: str, patch_data: dict):
        """Update user status (enabled, firstName, etc.)."""

    @classmethod
    def has_admin_access_on_app(cls, app_name: str):
        """Check if user has admin access. DST bypasses app-specific check."""
```

**Permission Logic**:
```python
# DST users (epic-centre admins) bypass app-specific checks
has_dst_admin_roles = TokenInfo.has_admin_roles(EpicAppClientName.EPIC_CENTRE.value)
if has_dst_admin_roles:
    return True  # Super admin

# Otherwise check specific app
client_name = APP_NAME_TO_CLIENT_NAME_MAP.get(app_name)
return TokenInfo.has_admin_roles(client_name)
```

**Data Enrichment**:
- Users are enriched with `apps` array showing their access across all EPIC apps
- Each app entry includes: `name`, `role`, `group_name`, `group_path`
- Results are filtered based on requester's admin permissions

---

#### 2. AccessRequestsService

**Location**: `centre-api/src/centre_api/services/access_requests.py`

**Key Methods**:

```python
class AccessRequestService:
    @classmethod
    def get_access_requests(cls, status: str = None, user_auth_guid: str = None):
        """Get access requests, filtered by current user's admin permissions."""

    @classmethod
    def create_access_request(cls, app_id: int):
        """Create a new access request for current user."""

    @classmethod
    def update_access_request(cls, access_request_id: int, status: str):
        """Update access request status (approve/deny)."""
```

**Permission Filtering**:
- DST users see ALL access requests
- App admins see only requests for their apps
- Regular users see only their own requests (when querying by user_auth_guid)

---

#### 3. AuthApiService

**Location**: `centre-api/src/centre_api/services/auth_api_service.py`

**Purpose**: Wrapper around Keycloak Admin API calls.

**Key Methods**:
- `get_users()` - Fetch users from Keycloak
- `get_user_by_username()` - Fetch single user
- `patch_user()` - Update user attributes (enabled, firstName, etc.)
- `update_user_group()` - Add user to a group
- `delete_all_user_group_mapping()` - Remove user from all groups

---

## Data Models

### Frontend Models

#### CentreUser

**Location**: `centre-web/src/models/CentreUser.ts`

```typescript
export type CentreUser = {
  id: string;              // Keycloak user ID (matches JWT sub)
  first_name: string;
  last_name: string;
  email: string;
  username: string;        // Keycloak username
  apps: CentreUserApp[];   // User's access across all apps
  enabled: boolean;        // Account active/inactive
  groups: KCGroup[];       // Keycloak group memberships
};

export type CentreUserApp = {
  name: string;            // EpicAppName
  role: string | null;     // Display name of highest group (e.g., "Admin")
  group_name: string | null;  // Keycloak group name
  group_path: string | null;  // Full group path (e.g., "/TRACK/ADMIN")
};
```

---

#### AccessRequest

**Location**: `centre-web/src/models/AccessRequest.ts`

```typescript
export type AccessRequest = {
  id: number;
  app_id: number;
  user_auth_guid: string;     // User ID who the request is FOR
  status: AccessRequestStatus;
  created_date: string | null;
  updated_date: string | null;
  created_by: string | null;  // Could be the requester's username
  updated_by: string | null;
  user: Partial<CentreUser>;  // User object
  app: EpicApp;               // Application object
};

export enum AccessRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}
```

---

#### EpicApp

**Location**: `centre-web/src/models/EpicApp.ts`

```typescript
export type EpicApp = {
  id: number;
  name: EpicAppName;
  description: string;
  icon?: string;
};

export enum EpicAppName {
  EPIC_TRACK = "EPIC.track",
  EPIC_ENGAGE = "EPIC.engage",
  EPIC_COMPLIANCE = "EPIC.compliance",
  EPIC_SUBMIT = "EPIC.submit",
  EPIC_PUBLIC = "EPIC.public",
  EPIC_CENTRE = "EPIC.centre",
  CONDITION_REPOSITORY = "Condition Repository"
}

export enum EpicAppClientName {
  EPIC_TRACK = "epictrack-web",
  EPIC_ENGAGE = "epic-engage",
  EPIC_COMPLIANCE = "epic-compliance",
  EPIC_SUBMIT = "epic-submit",
  EPIC_PUBLIC = "epic-public",
  EPIC_CENTRE = "epic-centre",
  CONDITION_REPOSITORY = "epic-condition"
}
```

---

#### KCGroup (Keycloak Group)

**Location**: `centre-web/src/models/KCGroup.ts`

```typescript
export type KCGroup = {
  id: string;
  name: string;              // Group name (e.g., "ADMIN")
  path: string;              // Full path (e.g., "/TRACK/ADMIN")
  display_name: string;      // Human-readable name (e.g., "Administrator")
  level: number;             // Hierarchy level (higher = more access)
};
```

---

### Backend Models

#### User (from Keycloak)

**Location**: `centre-api/src/centre_api/services/auth_api_service.py` (returned from Keycloak)

```python
{
    'id': 'a1b2c3d4-...',
    'username': 'JSMITH',
    'firstName': 'John',
    'lastName': 'Smith',
    'email': 'john.smith@gov.bc.ca',
    'enabled': True,
    'groups': [
        {
            'id': 'group-id-1',
            'name': 'ADMIN',
            'path': '/TRACK/ADMIN',
            'display_name': 'Administrator',
            'level': 3
        }
    ],
    'apps': [  # Added by enrichment
        {
            'name': 'EPIC.track',
            'role': 'Administrator',
            'group_name': 'ADMIN',
            'group_path': '/TRACK/ADMIN'
        }
    ]
}
```

---

#### AccessRequests (Database Model)

**Location**: `centre-api/src/centre_api/models/access_requests.py`

```python
class AccessRequests(BaseModel):
    __tablename__ = 'access_requests'

    id = db.Column(db.Integer, primary_key=True)
    app_id = db.Column(db.Integer, db.ForeignKey('applications.id'))
    user_auth_guid = db.Column(db.String(255))  # User ID
    status = db.Column(db.String(50))  # PENDING, APPROVED, REJECTED
    created_date = db.Column(db.DateTime)
    updated_date = db.Column(db.DateTime)
    created_by = db.Column(db.String(255))
    updated_by = db.Column(db.String(255))
```

---

## API Endpoints

### User Management Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/users` | Get all users (filtered by admin permissions) | Yes (Admin) |
| GET | `/api/users/username/<username>` | Get specific user details | Yes (Admin) |
| PATCH | `/api/users/username/<username>` | Update user status (enable/disable) | Yes (Admin) |
| PUT | `/api/users/<username>/access` | Grant/update user access to app | Yes (Admin) |
| DELETE | `/api/users/<username>/access` | Revoke user access from app | Yes (Admin) |

**Example Request**:
```http
PATCH /api/users/username/JSMITH
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "enabled": false
}
```

**Example Response**:
```json
"User updated"
```

---

### Access Request Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/access-requests` | Get access requests (filtered) | Yes |
| POST | `/api/access-requests` | Create new access request | Yes |
| PUT | `/api/access-requests/<id>` | Update request status | Yes (Admin) |
| GET | `/api/access-requests/user/<user_guid>` | Get user's requests | Yes |

**Query Parameters**:
- `status`: Filter by status (PENDING, APPROVED, REJECTED)
- `user_auth_guid`: Filter by user ID

**Example Request**:
```http
POST /api/access-requests
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "app_id": 2
}
```

---

### Application Endpoints

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/api/applications` | Get all applications | Yes |
| GET | `/api/applications/request-catalog` | Get apps with user's status | Yes |
| GET | `/api/applications/<app_name>/access-levels` | Get available roles for app | Yes (Admin) |

**Example Response** (request-catalog):
```json
[
  {
    "id": 1,
    "name": "EPIC.track",
    "description": "Project tracking system",
    "status": "PENDING",
    "user": {
      "first_name": "John",
      "last_name": "Smith"
    }
  }
]
```

---

## Permission Patterns

### Permission Check Hierarchy

```
┌─────────────────────────────────────────────────┐
│ Is user DST (epic-centre admin)?                │
│ ✓ YES → Super admin, can manage everything     │
│         (EXCEPT epic-compliance role assignment)│
└─────────────────────────────────────────────────┘
                    ↓ NO
┌─────────────────────────────────────────────────┐
│ Is user app admin for THIS specific app?        │
│ ✓ YES → Can manage only this app               │
│ ✗ NO  → No admin access                        │
└─────────────────────────────────────────────────┘
```

### Frontend Permission Utils

**Primary Method - UserContext** (Recommended):

**Location**: `centre-web/src/contexts/UserContext.tsx`

```typescript
import { useCurrentUser } from "@/contexts/UserContext";

const {
  user,              // CentreUser with fresh data from API
  isAdmin,           // Boolean: has admin privilege in any app
  isDstAdmin,        // Boolean: is EPIC.centre admin (DST)
  isAdminOfApp,      // Function: (appName) => boolean
  adminStatusPerApp, // Record<EpicAppName, boolean>
  isLoading,
  isError,
  refetch,
} = useCurrentUser();
```

**Legacy Method - Token-based** (Deprecated):

**Location**: `centre-web/src/utils/roleUtils.ts`

```typescript
// ⚠️ DEPRECATED: Uses potentially stale JWT token
// Use useCurrentUser() context instead

isAdministrator(accessToken: string): boolean
getAdminStatusPerApp(accessToken: string): Record<EpicAppName, boolean>
getUserGroupsFromToken(accessToken: string): string[]
getResourceAccessFromToken(accessToken: string): Record<string, {roles: string[]}>
```

**Admin Group Utilities**:

**Location**: `centre-web/src/utils/adminGroupPaths.ts`

```typescript
// Admin group paths (normalized without leading slash)
EPIC_CLIENT_TO_ADMIN_GROUP_PATHS: Record<EpicAppClientName, string>

// Utility functions for group-based admin checking
normalizeGroupPath(path: string): string
hasAdminGroup(groups: KCGroup[], adminGroupPath: string): boolean
isAdminOfAnyApp(groups: KCGroup[]): boolean
isAdminOfApp(groups: KCGroup[], appName: EpicAppName): boolean
getAdminStatusPerApp(groups: KCGroup[]): Record<EpicAppName, boolean>
```

---

### Backend Permission Utils

**Location**: `centre-api/src/centre_api/utils/token_info.py`

```python
class TokenInfo:
    @staticmethod
    def get_user_data() -> dict:
        """Extract user data from JWT."""

    @staticmethod
    def has_admin_roles(client_name: str) -> bool:
        """Check if user has admin roles for client."""

    @staticmethod
    def get_admin_roles_map() -> dict:
        """Get admin status for all apps."""
```

---

### Common Permission Checks

#### Frontend: Check if DST User

```typescript
import { useCurrentUser } from "@/contexts/UserContext";

const MyComponent = () => {
  const { isDstAdmin } = useCurrentUser();

  return isDstAdmin ? <AdminPanel /> : <UserPanel />;
};
```

---

#### Frontend: Check if Admin for Specific App

```typescript
import { useCurrentUser } from "@/contexts/UserContext";
import { EpicAppName } from "@/models/EpicApp";

const { adminStatusPerApp, isAdminOfApp } = useCurrentUser();

// Option 1: Use pre-computed status map
const canManageCompliance = adminStatusPerApp[EpicAppName.EPIC_COMPLIANCE];
const canManageTrack = adminStatusPerApp[EpicAppName.EPIC_TRACK];

// Option 2: Use function for specific checks
const canManageEngage = isAdminOfApp(EpicAppName.EPIC_ENGAGE);
```

---

#### Backend: Check Permission Before Action

```python
from centre_api.utils.token_info import TokenInfo
from centre_api.enums.epic_app import EpicAppClientName, APP_NAME_TO_CLIENT_NAME_MAP

def update_user_access(app_name: str):
    # Check DST admin
    is_dst = TokenInfo.has_admin_roles(EpicAppClientName.EPIC_CENTRE.value)
    if is_dst:
        # DST can manage (with exceptions)
        pass

    # Check app-specific admin
    client_name = APP_NAME_TO_CLIENT_NAME_MAP.get(app_name)
    is_app_admin = TokenInfo.has_admin_roles(client_name)

    if not is_app_admin:
        raise PermissionError(f'User does not have permission to manage {app_name}')
```

---

#### Backend: Filter Data Based on Permissions

```python
from centre_api.utils.token_info import TokenInfo

def get_filtered_users():
    users = AuthApiService.get_users()

    # DST sees everyone
    is_dst = TokenInfo.has_admin_roles(EpicAppClientName.EPIC_CENTRE.value)
    if is_dst:
        return users

    # App admins see only their app users
    admin_roles_map = TokenInfo.get_admin_roles_map()

    filtered_users = []
    for user in users:
        for app in user.get('apps', []):
            app_client = APP_NAME_TO_CLIENT_NAME_MAP.get(app['name'])
            if admin_roles_map.get(app_client):
                filtered_users.append(user)
                break

    return filtered_users
```

---

## Common Implementation Patterns

### 1. Using the Current User Context

**Built-in Hook**: The application provides a `useCurrentUser()` hook via UserContext.

**Location**: `centre-web/src/contexts/UserContext.tsx`

```typescript
import { useCurrentUser } from "@/contexts/UserContext";
import { EpicAppName } from "@/models/EpicApp";

const MyComponent = () => {
  const {
    user,              // Fresh CentreUser data from API
    isDstAdmin,        // Is EPIC.centre admin
    isAdmin,           // Is admin of any app
    adminStatusPerApp, // Admin status for all apps
    isAdminOfApp,      // Function to check specific app
    isLoading,
    isError,
  } = useCurrentUser();

  const canManageCompliance = adminStatusPerApp[EpicAppName.EPIC_COMPLIANCE];

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <Error />;

  return (
    <div>
      <h1>Welcome, {user?.first_name}</h1>
      {isDstAdmin && <AdminPanel />}
    </div>
  );
};
```

**Key Benefits**:
- Uses fresh user data from API (not stale JWT)
- Pre-computed values for performance
- Memoized to prevent unnecessary re-renders
- Integrated with React Query for caching

---

### 2. Conditional Component Rendering

**Using PermissionGate**:
```typescript
import { PermissionsGate } from "@/components/Shared/PermissionGate";

<PermissionsGate
  scopes={["manage_users"]}
  RenderError={AccessDenied}
>
  <AdminPanel />
</PermissionsGate>
```

**Using Conditional Logic**:
```typescript
import { When, Unless } from "react-if";

<When condition={isDSTUser}>
  <DisableUserButton />
</When>

<Unless condition={isDSTUser}>
  <Tooltip title="Only DST can disable users">
    <span>
      <Button disabled>Disable User</Button>
    </span>
  </Tooltip>
</Unless>
```

---

### 3. API Calls with React Query

**Hook Location**: `centre-web/src/hooks/api/`

**Example - Fetching Users**:
```typescript
import { useGetUsers } from "@/hooks/api/useUsers";

const MyComponent = () => {
  const {
    data: users = [],
    isLoading,
    isError,
    refetch
  } = useGetUsers({
    search: "John",
    include_groups: true
  });

  if (isLoading) return <Skeleton />;
  if (isError) return <Error />;

  return <UsersList users={users} />;
};
```

**Example - Updating User**:
```typescript
import { useUpdateUser } from "@/hooks/api/useUsers";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";

const MyComponent = () => {
  const { mutateAsync: updateUser } = useUpdateUser({
    onSuccess: () => notify.success("User updated!"),
    onError: (error) => notify.error("Failed to update user")
  });

  const handleDisableUser = async () => {
    await updateUser({
      username: "JSMITH",
      enabled: false
    });
  };

  return <Button onClick={handleDisableUser}>Disable</Button>;
};
```

---

### 4. Error Handling Pattern

```typescript
import { isAxiosError } from "axios";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";

const handleError = (error: unknown) => {
  const message = isAxiosError(error)
    ? error.response?.data?.message || "Operation failed"
    : "An unexpected error occurred";
  notify.error(message);
};

try {
  await someApiCall();
  notify.success("Operation successful!");
} catch (error) {
  handleError(error);
}
```

---

### 5. Modal Management Pattern

```typescript
import { useModal } from "@/components/Shared/Modals/modalStore";
import { EditAccessModal } from "./EditAccessModal";

const MyComponent = () => {
  const { setOpen } = useModal();

  const handleEditAccess = (user, app) => {
    setOpen({
      content: (
        <EditAccessModal
          user={user}
          app={app}
          onClose={() => {}}
        />
      )
    });
  };

  return <Button onClick={() => handleEditAccess(user, app)}>Edit</Button>;
};
```

---

### 6. Backend Service Pattern

```python
# services/my_service.py
from centre_api.utils.token_info import TokenInfo
from centre_api.services.auth_api_service import AuthApiService

class MyService:
    @classmethod
    def my_method(cls, param: str):
        # Check permissions
        has_permission = TokenInfo.has_admin_roles('epic-centre')
        if not has_permission:
            raise PermissionError('Insufficient permissions')

        # Call Keycloak API
        result = AuthApiService.some_api_call(param)

        # Process and return
        return cls._process_result(result)

    @staticmethod
    def _process_result(result):
        # Private helper method
        return result
```

---

### 7. Backend Endpoint Pattern

```python
# resources/my_resource.py
from flask_restx import Namespace, Resource
from centre_api.auth import auth
from centre_api.resources.apihelper import Api as ApiHelper
from centre_api.services.my_service import MyService
from http import HTTPStatus

API = Namespace('my-endpoint', description='My endpoint description')

@cors_preflight('GET, POST, OPTIONS')
@API.route('', methods=['GET', 'POST', 'OPTIONS'])
class MyResource(Resource):
    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Get something')
    @auth.require
    def get():
        """Get something."""
        result = MyService.my_method('param')
        return result, HTTPStatus.OK

    @staticmethod
    @ApiHelper.swagger_decorators(API, endpoint_description='Create something')
    @auth.require
    def post():
        """Create something."""
        data = API.payload
        result = MyService.create(data)
        return result, HTTPStatus.CREATED
```

---

## File Reference Quick Guide

### Essential Frontend Files

```
centre-web/src/
├── contexts/
│   └── UserContext.tsx                 # User context provider ⭐
├── utils/
│   ├── adminGroupPaths.ts              # Group-based admin utilities ⭐
│   ├── roleUtils.ts                    # Legacy token utilities (deprecated)
│   └── constants.ts                    # Admin role definitions ⭐
├── hooks/
│   └── api/
│       ├── useUsers.ts                 # User API hooks ⭐
│       ├── useAccessRequests.ts        # Access request hooks ⭐
│       └── useApplications.ts          # Application hooks ⭐
├── components/
│   ├── AuthManagement/
│   │   ├── AllUsers/index.tsx          # Users list page ⭐
│   │   ├── NewRequests/index.tsx       # Requests list page ⭐
│   │   ├── UserAccess/index.tsx        # User detail page ⭐
│   │   └── EditAccess/index.tsx        # Edit access modal ⭐
│   ├── LaunchAppTile/
│   │   ├── index.tsx                   # Launchpad app tile ⭐
│   │   ├── Content.tsx                 # Tile content & actions ⭐
│   │   ├── BookmarkSection.tsx         # Bookmark display ⭐
│   │   └── AddBookmark.tsx             # Bookmark management ⭐
│   ├── RequestAccessTile/
│   │   └── Body.tsx                    # Request access button ⭐
│   └── Shared/
│       └── PermissionGate/             # Permission wrapper ⭐
├── models/
│   ├── CentreUser.ts                   # User type definitions ⭐
│   ├── AccessRequest.ts                # Request type definitions ⭐
│   ├── EpicApp.ts                      # App enums & types ⭐
│   └── KCGroup.ts                      # Group type definitions
└── routes/
    └── _authenticated/
        ├── launchpad/                  # SSO app launcher ⭐
        └── request-access/             # User-facing pages ⭐
```

---

### Essential Backend Files

```
centre-api/src/centre_api/
├── utils/
│   ├── token_info.py                   # JWT utilities ⭐
│   └── user_context.py                 # User context decorator
├── services/
│   ├── user_service.py                 # User business logic ⭐
│   ├── access_requests.py              # Request business logic ⭐
│   ├── applications_service.py         # App business logic ⭐
│   └── auth_api_service.py             # Keycloak API wrapper ⭐
├── resources/
│   ├── users.py                        # User endpoints ⭐
│   ├── access_requests.py              # Request endpoints ⭐
│   └── applications.py                 # App endpoints ⭐
├── models/
│   ├── access_requests.py              # Request DB model ⭐
│   ├── applications.py                 # App DB model
│   └── user_applications.py            # User-app mapping
├── enums/
│   ├── epic_app.py                     # App enums & mappings ⭐
│   └── access_request_status.py        # Request status enum
└── auth.py                             # JWT setup ⭐
```

---

## Troubleshooting & Common Issues

### Issue: User can't see admin pages

**Symptoms**: User redirected to access denied page

**Diagnosis**:
```typescript
// Check in browser console:
import { jwtDecode } from "jwt-decode";
const token = localStorage.getItem('oidc.user:...');
const decoded = jwtDecode(token);
console.log(decoded.resource_access);
```

**Fix**: Ensure user has admin role in at least one client

---

### Issue: Permission denied when updating access

**Symptoms**: 403 or PermissionError from backend

**Diagnosis**:
```python
# Backend logs will show:
# PermissionError: User does not have permission to update access for app "EPIC.track"
```

**Fix**: Verify user has admin role for that specific app OR is DST admin

---

### Issue: Role discrepancies between frontend and backend

**Symptoms**: Frontend shows different admin status than backend

**Diagnosis**: Check both:
- Frontend: `centre-web/src/utils/constants.ts` → `EPIC_ADMIN_ROLES`
- Backend: `centre-api/src/centre_api/enums/epic_app.py` → `CLIENT_APP_NAME_TO_ADMIN_ROLES_MAP`

**Fix**: Backend is source of truth. Update frontend to match.

---

## Future Considerations

### Potential Enhancements

1. **Audit Logging**: Track all access changes with timestamps and actors
2. **Bulk Operations**: Enable/disable multiple users at once
3. **Role Templates**: Predefined role combinations for common job functions
4. **Temporary Access**: Time-limited access grants
5. **Access Reviews**: Periodic review workflows for existing access
6. **Approval Chains**: Multi-level approval for sensitive roles
7. **Self-Service Groups**: Allow users to join certain groups without approval

---

## Glossary

| Term | Definition |
|------|------------|
| **DST** | Digital Services Team - super administrators |
| **EPIC** | Environmental Assessment Process Information & Collaboration |
| **Keycloak** | Open-source identity and access management solution |
| **OIDC** | OpenID Connect - authentication protocol |
| **JWT** | JSON Web Token - used for authentication |
| **SSO** | Single Sign-On - authenticate once, access all apps |
| **Launchpad** | Main landing page showing user's applications with SSO launch capability |
| **Bookmark** | User-saved link to a specific page within an application (max 3 per app) |
| **Resource Access** | JWT field containing client-specific roles |
| **Group** | Keycloak group organizing users hierarchically |
| **Role** | Permission assigned to users (from resource_access) |
| **Client** | Keycloak client representing an EPIC application |
| **Realm** | Keycloak realm containing all EPIC users and clients |
| **Access Request** | User's request to gain access to an application |
| **Access Level** | The specific role/group a user has in an application |
| **Launch URL** | The web address used to open an EPIC application from the Launchpad |

---

## Contact & Support

For questions or issues with EPIC.centre:

- **Repository**: `EPIC.centre`
- **Backend**: `centre-api` (Python Flask)
- **Frontend**: `centre-web` (React TypeScript)
- **Documentation**: This file (`EPIC_CENTRE_ARCHITECTURE.md`)

---

**Document Version**: 1.2
**Last Updated**: 2025-11-26
**Maintained By**: Development Team

**Version History**:
- v1.2 (2025-11-26): Updated frontend permission patterns to use UserContext with group-based admin checking
- v1.1 (2025-11-21): Added comprehensive auth-api integration section
- v1.0 (2025-11-12): Initial documentation
