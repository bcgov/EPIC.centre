# EPIC EAO Analytics

A reusable React hook for recording analytics across EPIC applications and logging them to EPIC.centre.

## Installation

### Option 1: Install from GitHub (Recommended)

Add to your application's `package.json`:

```json
{
  "dependencies": {
    "@epic/eao-analytics": "git+https://github.com/bcgov/EPIC.centre.git#develop"
  }
}
```

Then run:
```bash
npm install
```

**Note:** Since the package is in the `eao-analytics` subdirectory, you may need to adjust the import path or configure your build tool to resolve the subdirectory correctly.

### Option 2: Clone and link locally (for development)

For local development, you can clone the repository and use npm link:

```bash
# Clone the repository
git clone https://github.com/bcgov/EPIC.centre.git
cd EPIC.centre/eao-analytics

# Install dependencies and create link
npm install
npm link

# In your application directory
cd /path/to/your/app
npm link @epic/eao-analytics
```

### Option 3: Use local file path (for monorepo setups)

If you have the EPIC.centre repository cloned locally:

```json
{
  "dependencies": {
    "@epic/eao-analytics": "file:../../EPIC.centre/eao-analytics"
  }
}
```

## Usage

### Basic Usage

```typescript
import { useEaoAnalytics } from '@epic/eao-analytics';

function RouterProviderWithAuthContext() {
  const { isAuthenticated } = useAuth();
  
  useEaoAnalytics({
    appName: 'epic_submit',
    centreApiUrl: 'https://centre-api.example.com',
  });
  
  // ... rest of component
}
```

### With Configuration

```typescript
useEaoAnalytics({
  appName: 'epic_submit',
  centreApiUrl: process.env.VITE_CENTRE_API_URL,
  enabled: isAuthenticated,
  onSuccess: () => {
    console.log('Analytics recorded successfully');
  },
  onError: (error) => {
    console.error('Analytics recording failed:', error);
  },
});
```

## API

### `useEaoAnalytics(options: EaoAnalyticsOptions)`

#### Options

- `appName` (required): The application name (`'epic_submit'`, `'condition_repository'`, `'epic_compliance'`, `'epic_engage'`, `'epic_public'`)
- `centreApiUrl` (required): Base URL of EPIC.centre API
- `enabled` (optional): Enable/disable analytics recording (default: `true`)
- `onSuccess` (optional): Callback on successful recording
- `onError` (optional): Callback on recording error

#### Returns

- `isRecording`: Boolean indicating if analytics recording is in progress
- `error`: Error object if recording failed

## Features

- Automatically extracts user info from OIDC token
- Maps application name to app_id
- Debounces analytics recording (max once per 5 seconds per session)
- Silent error handling (won't break your app)
- TypeScript support

## Environment Variables

Add to your application's environment configuration:

```env
VITE_CENTRE_API_URL=https://centre-api.example.com
```

## Application Names

- `epic_submit` - EPIC.submit
- `condition_repository` - EPIC.conditions
- `epic_compliance` - EPIC.compliance
- `epic_engage` - epic-engage
- `epic_public` - epic-public

