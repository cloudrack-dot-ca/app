# CloudRack.ca Development Notes

## Hidden Features (March 2025)
The following features are temporarily hidden in the UI but available in the codebase for future implementation:

### Firewall Management
- Complete firewall rule creation and management
- Status monitoring of firewall rules
- Default rules creation on server initialization
- Located in: `client/src/components/firewall-manager.tsx` and `server/digital-ocean.ts`

### SSH Keys Management
- CloudRack terminal key automatic setup
- User SSH key management
- Key verification functionality
- Located in: `server/cloudrack-key-manager.ts`

### Interactive Terminal
- Web-based terminal using xterm.js
- Root password authentication
- Secure connection handling
- Located in: `client/src/components/server-terminal-real.tsx` and `server/terminal-handler-new.ts`

## Implementation Details

### Firewall System
- Uses DigitalOcean's Firewall API with fallback mechanisms
- Implements error handling for 409 Conflict responses
- Uses mock responses when API fails
- Environment variable `FORCE_MOCK_FIREWALLS=true` enables mock mode

### SSH Key System
- Automatically generates a CloudRack SSH key for secure terminal access
- Stores keys in PEM format
- Manages user's SSH keys for server access

### Terminal System
- Uses SSH2 library for server connections
- Authenticates with server-specific root passwords
- Streams terminal data through WebSockets