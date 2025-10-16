# XPR Key Refresh

Update XPR Network blockchain account permissions via `updateauth` action.

## ⚠️ Important Warning

**If you change your owner key for your WebAuth Wallet account, you could lose access to your Metal Blockchain and other connected network wallets until it's restored.** Only modify the owner key if you fully understand the implications and have proper backups.

## Quick Start

```bash
# Install
npm install

# Usage
node refresh-key.js <account> <newPublicKey> [permission]

# Example
node refresh-key.js dcdoit PUB_K1_6aEZ3qzrzG4xniJXTm79RUQfKYmFGsH2UfgbvMVBAeNZJJYTsu active
```

## Requirements

- Node.js >= 16.0.0
- XPR Network CLI: `npm install -g @proton/cli`
- Private key in `proton key:list`

## Parameters

| Parameter | Required | Description | Default |
|-----------|----------|-------------|---------|
| `account` | Yes | XPR Network account name | - |
| `newPublicKey` | Yes | New public key (PUB_K1_...) | - |
| `permission` | No | Permission: active or owner | active |

## How It Works

```bash
proton action eosio updateauth '{
  "account": "<account>",
  "permission": "<permission>",
  "parent": "<parent>",
  "auth": {
    "threshold": 1,
    "keys": [{"key": "<newPublicKey>", "weight": 1}],
    "accounts": [],
    "waits": []
  }
}' <account>@<permission>
```

### Logic

- **Parent**: `owner` → `""` (empty), `active` → `"owner"`
- **Authorization**: Uses same permission level
- **Signing**: Automatic via `proton key:list`

## Output

### Success

```json
{
  "success": true,
  "account": "dcdoit",
  "permission": "active",
  "transactionId": "8a4f2c1b3d5e6f7a...",
  "transactionLink": "https://explorer.xprnetwork.org/transaction/8a4f2c1b...",
  "newPublicKey": "PUB_K1_..."
}
```

### Failure

```json
{
  "success": false,
  "error": "error message",
  "stderr": "details"
}
```

Exit code: 1

## Key Management

### Generate New Key

```bash
proton key:generate
# Output: {"public": "PUB_K1_...", "private": "PVT_K1_...", "mnemonic": "..."}
```

**Note**: Does NOT auto-save to `proton key:list`

### Import Key

```bash
proton key:add
# Prompt: Enter private key

# Or pipe
echo "PVT_K1_..." | proton key:add
```

### List Keys

```bash
proton key:list
```

## Workflow Example

### Rotate Key

```bash
# 1. Generate
proton key:generate > key.json

# 2. Backup
cp key.json ~/backup/

# 3. Import
PRIV=$(cat key.json | grep private | cut -d'"' -f4)
echo $PRIV | proton key:add

# 4. Update
PUB=$(cat key.json | grep public | cut -d'"' -f4)
node refresh-key.js myaccount $PUB active

# 5. Verify
proton account myaccount

# 6. Cleanup
rm key.json
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `command action not found` | XPR Network CLI missing | `npm i -g @proton/cli` |
| `unrecognized public key format` | Used PVT instead of PUB | Use public key |
| `Missing required authority` | Key not in list | `proton key:add` |
| No transaction ID | Parse failed | Check manually |

## API Usage

```javascript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function updateKey(account, pubKey, permission = 'active') {
  const cmd = `node refresh-key.js ${account} ${pubKey} ${permission}`;
  const { stdout } = await execAsync(cmd);
  const match = stdout.match(/JSON Output:\n({[\s\S]*?})/);
  return JSON.parse(match[1]);
}

// Usage
const result = await updateKey('dcdoit', 'PUB_K1_...', 'active');
console.log(result.transactionId);
```

## Limitations

- Single key only (threshold=1, weight=1)
- No multi-sig support
- No custom weights/thresholds
- No account permissions
- No time delays

## Security Notes

- Script does NOT handle private keys
- Keys managed by XPR Network CLI
- No input sanitization (command injection risk)
- Debug output logs full command
- **WebAuth Wallet Warning**: Changing owner keys can affect access to connected wallets

## Verification

```bash
# Before
proton account myaccount

# After execution
proton account myaccount

# Or explorer
open https://explorer.xprnetwork.org/account/myaccount
```

## Architecture

```
CLI Input → Parse → Build JSON → Execute XPR Network CLI → Parse TX ID → Output JSON
```

## Dependencies

Node.js built-ins only:
- `child_process`
- `util`

## License

MIT