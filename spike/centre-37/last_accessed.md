# Spike: Tracking "Last Accessed" per Application for Users (Keycloak Realm)

## 🧠 Background

Our application stack consists of:

- **Frontend**: React  
- **Backend**: Python Flask  
- **Shared API**: Manages Keycloak-related operations  
- **Auth**: Users authenticate using IDIR via Keycloak (we have access to a dedicated realm)

After login, we use the Keycloak access token to determine which applications (clients) the user is authorized to access. This is done by inspecting the `resource_access` section of the token.

---

## ❓ Problem Statement

We need to display a **"last accessed"** timestamp for each application a user is authorized to use.

> _"When was the last time user X accessed application Y?"_

Keycloak does **not** natively provide per-user, per-client "last accessed" tracking.

---

## 🔒 Constraints

- We **do not control** the Keycloak instance. It is managed by another team.
- We **cannot deploy custom extensions or SPIs** on the Keycloak server.
- We **do control**:
  - Our shared API
  - The frontend apps
  - The backend services

---

## 🧪 Explored Options

### Option 1: Keycloak Event Listener SPI

> Listen for login or token issuance events in Keycloak and log per-client access.

**❌ Not feasible** – requires access to the Keycloak server to deploy code.

---

### Option 2: Reverse Proxy or Log-Based Tracking

> Parse reverse proxy logs (e.g., nginx) to infer token access per client.

**❌ Not feasible** – Keycloak infrastructure is externally managed and logs are not accessible.

---

### ✅ Option 3: Client-Reported Tracking (Recommended)

> Each app reports usage to our shared API when a user accesses it.

### How It Works:
1. When a user accesses an app (frontend/backend), it sends a POST to the shared API with:
    - `user_id` (from token)
    - `client_id` (from token or app config)
    - `timestamp` (UTC)
2. The shared API stores the data in a `user_client_last_access` table.
3. The dashboard queries this data to display last accessed timestamps.

### Benefits:
- Works with current permissions and infrastructure.
- Real-time tracking of actual app usage.
- Simple integration across frontend and backend.

---

## 💡 Implementation Plan

### Flask Endpoint Example
```python
@app.route('/track-access', methods=['POST'])
def track_access():
    data = request.get_json()
    user_id = data.get('user_id')
    client_id = data.get('client_id')
    timestamp = datetime.utcnow()

    db.upsert_last_access(user_id, client_id, timestamp)
    return jsonify({"status": "success"}), 200
```

---

### Database Schema
```sql
CREATE TABLE user_client_last_access (
    user_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    last_accessed TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, client_id)
);
```

---

### Frontend (React) Tracking Snippet
```tsx
import axios from 'axios';
import jwt_decode from 'jwt-decode';

const token = getAccessToken(); // From auth context
const decoded = jwt_decode(token);

axios.post('https://shared-api.mycompany.com/track-access', {
  user_id: decoded.sub,
  client_id: decoded.azp,
});
```

---

## ✅ Summary

| Area                  | Details                                                        |
|-----------------------|----------------------------------------------------------------|
| Tracking Location     | Shared API (Flask)                                             |
| Trigger Mechanism     | Apps report access on user interaction or load                 |
| Data Storage          | `user_client_last_access` table                                |
| Integration Required  | Minor changes to frontend/backend apps                         |
| Keycloak Changes      | None                                                           |
| Security              | Optional token validation on tracking endpoint                 |

---

## 📌 Next Steps

- [ ] Implement `/track-access` endpoint in shared API  
- [ ] Add tracking call in each application  
- [ ] Create `user_client_last_access` table  
- [ ] Update dashboard to include last accessed values

---

## 📚 Notes

- The `azp` field in the token typically identifies the client app.
- Token validation can be added to the tracking API to confirm authenticity.

---

## 🔍 Alternative Consideration: Using Keycloak Session API

Keycloak exposes session information via the Admin REST API, such as:

### Endpoint:
```
GET /admin/realms/{realm}/users/{user-id}/sessions
```

### Example response:
```json
[
  {
    "id": "abc123",
    "username": "johndoe",
    "start": 1631292000000,
    "lastAccess": 1631292800000,
    "ipAddress": "192.168.1.1",
    "clients": {
      "frontend-app": "Frontend Application"
    }
  }
]
```

### ✅ Pros:
- Available if you have Admin API access.
- Can show active sessions per user.
- Includes a `lastAccess` timestamp.

### ❌ Limitations:
| Limitation                  | Why It Matters                                                   |
|-----------------------------|------------------------------------------------------------------|
| Session-wide timestamp      | `lastAccess` applies to the **entire session**, not per client. |
| No historical tracking      | Once the session expires, data is lost.                         |
| Admin access required       | We don’t have admin privileges for the realm.                   |
| Not tied to real UI usage   | A client in the session doesn't mean the user interacted with it.|

### 🎯 Conclusion:
While the session API seems useful, it doesn't provide persistent, per-client access tracking. Therefore, it's not suitable for our "last accessed" use case. The **client-reported tracking** remains the most viable and accurate approach given our architecture and permissions.
