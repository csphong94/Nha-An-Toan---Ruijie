---
name: database-backup
description: Instructions for backing up server/data/database.json before making database migrations or schema modifications.
---

# Database Backup & Safety Skill

To prevent accidental data loss of configuration settings and customer voucher logs, you must perform a backup of `database.json` before altering backend code or schemas.

## Guidelines

1. **Before DB Schema or Seed Changes**:
   Copy the existing database to a backup directory:
   ```bash
   # In PowerShell
   Copy-Item "server/data/database.json" "server/data/database.json.bak"
   ```

2. **Verify Integrity**:
   Ensure `server/data/database.json` remains valid JSON:
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('server/data/database.json'))"
   ```

3. **Restore**:
   If the server fails to parse the database on startup, restore from the backup:
   ```bash
   Copy-Item "server/data/database.json.bak" "server/data/database.json" -Force
   ```
