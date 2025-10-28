# Grievance Data Hashing System

## Overview

For privacy and security, **grievance type** and **grievance details** are stored as bcrypt hashes in the database. This means the actual content cannot be retrieved or read by anyone, including administrators.

## Why Hash Grievance Data?

### Privacy Protection
- Sensitive grievance content is protected from unauthorized access
- Even if database is compromised, grievance details remain unreadable
- Complies with data privacy regulations (GDPR, etc.)

### Security Benefits
- One-way hashing (cannot be decrypted)
- Each grievance has unique hash (different salt)
- Protects whistleblowers and complainants

## What Gets Hashed?

| Field | Stored As | Retrievable? |
|-------|-----------|--------------|
| Grievance Type | `grievance_type_hash` | ❌ No |
| Grievance Details | `grievance_hash` | ❌ No |
| Name | Plaintext | ✅ Yes |
| Email | Plaintext | ✅ Yes |
| Role | Plaintext | ✅ Yes |
| Department | Plaintext | ✅ Yes |
| Status | Plaintext | ✅ Yes |

## Database Schema

```sql
CREATE TABLE grievances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role ENUM('student', 'teaching', 'non-teaching') NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    department VARCHAR(255) NOT NULL,
    year VARCHAR(10) DEFAULT NULL,
    email VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    grievance_type_hash VARCHAR(255) NOT NULL,  -- Bcrypt hash
    grievance_hash TEXT NOT NULL,               -- Bcrypt hash
    status ENUM('pending', 'in-progress', 'resolved', 'rejected') DEFAULT 'pending',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## How It Works

### Submission Process

1. **User submits grievance form**
   - Grievance Type: "INFRASTRUCTURE"
   - Grievance Details: "The AC in Room 301 is not working..."

2. **Backend receives plaintext data**
   ```javascript
   {
     grievanceType: "INFRASTRUCTURE",
     grievance: "The AC in Room 301 is not working..."
   }
   ```

3. **Backend hashes both fields**
   ```javascript
   const saltRounds = 10;
   const grievanceTypeHash = await bcrypt.hash(grievanceType, saltRounds);
   const grievanceHash = await bcrypt.hash(grievance, saltRounds);
   ```

4. **Stored in database as hashes**
   ```
   grievance_type_hash: "$2b$10$abc123..."
   grievance_hash: "$2b$10$xyz789..."
   ```

5. **Original plaintext is never stored**

### Admin View

When admin views grievances:
- ✅ Can see: Name, Email, Role, Department, Status, Dates
- ❌ Cannot see: Grievance Type, Grievance Details
- 🔒 Shows: "[Hashed - Private]" placeholder

## Important Implications

### ⚠️ Cannot Search Grievance Content
- Search only works on: name, email
- Cannot search by grievance type or keywords in grievance text
- Hashed data cannot be queried

### ⚠️ Cannot Display Grievance Details
- Admin dashboard shows metadata only
- No way to view what the grievance is about
- Hash cannot be reversed to original text

### ⚠️ Cannot Generate Reports by Type
- Cannot group grievances by type (all hashed differently)
- Statistics by grievance type unavailable
- Use status and role for analytics instead

## Alternative: Encryption (Not Implemented)

If you need to **retrieve** grievance content, use **encryption** instead of hashing:

### Hashing vs Encryption

| Feature | Hashing | Encryption |
|---------|---------|------------|
| Reversible | ❌ No | ✅ Yes (with key) |
| Purpose | Verify integrity | Protect & retrieve |
| Search | ❌ No | ❌ No (unless special) |
| Security | Very High | High (if key secure) |

### To Implement Encryption Instead:

```javascript
const crypto = require('crypto');

// Encryption
const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
const iv = crypto.randomBytes(16);

function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

**Note:** With encryption, you'd need to manage encryption keys securely.

## Compliance & Legal

### Data Protection
- Hashing satisfies "data minimization" principle
- Meets "privacy by design" requirements
- Protects sensitive personal information

### Right to Access (GDPR)
- User can request their data
- But hashed content cannot be provided
- Only metadata can be shared

### Data Retention
- Hashes can be deleted like regular data
- No special handling needed
- Deletion is permanent (cannot recover)

## Migration from Plaintext

If you have existing grievances in plaintext:

### Option 1: Delete Old Data (Recommended for Test)
```sql
TRUNCATE TABLE grievances;
```

### Option 2: Keep Legacy Data
```sql
-- Add columns
ALTER TABLE grievances 
ADD COLUMN grievance_type_hash VARCHAR(255),
ADD COLUMN grievance_hash TEXT,
ADD COLUMN is_legacy BOOLEAN DEFAULT FALSE;

-- Mark old data
UPDATE grievances SET is_legacy = TRUE WHERE grievance_type_hash IS NULL;

-- New submissions will use hashed columns
```

### Option 3: Hash Existing Data (Not Recommended)
- You cannot retroactively hash without plaintext
- Would need to re-enter all grievances
- Consider if really necessary

## API Changes

### Submit Grievance Endpoint
**Input:** Plaintext (as before)
```json
{
  "grievanceType": "INFRASTRUCTURE",
  "grievance": "Description here..."
}
```

**Database:** Hashed automatically

### Get Grievances Endpoint
**Output:** No grievance content
```json
{
  "id": 1,
  "name": "John Doe",
  "role": "student",
  "email": "john@srivasaviengg.ac.in",
  "status": "pending",
  "created_at": "2025-10-27T10:00:00Z"
  // grievance_type and grievance NOT included
}
```

## Configuration

No additional configuration needed. Hashing uses bcrypt with 10 salt rounds (hardcoded in server.js).

To change salt rounds:
```javascript
const saltRounds = 12; // Higher = more secure but slower
```

## Testing

### Test Submission
1. Submit a grievance through the form
2. Check database:
   ```sql
   SELECT id, name, grievance_type_hash, grievance_hash FROM grievances LIMIT 1;
   ```
3. Verify hashes start with `$2b$10$`
4. Confirm original text is NOT in database

### Test Admin View
1. Login to admin dashboard
2. View grievances list
3. Confirm "Type" column shows "[Hashed - Private]"
4. Verify no grievance content is displayed

## Troubleshooting

### Error: "Cannot insert NULL into grievance_hash"
- Ensure backend is hashing data before insert
- Check bcrypt is installed: `npm list bcrypt`
- Verify server.js has hashing code

### Old grievances not showing
- Check if migration was run
- Verify column names match in queries
- Use `DESCRIBE grievances;` to check schema

### Performance issues
- Bcrypt hashing is slow by design (security)
- Consider reducing salt rounds if too slow
- Hash on background worker for large volumes

## Recommendations

### For Production
1. ✅ Keep hashing for maximum privacy
2. ✅ Store only necessary metadata
3. ✅ Use encrypted backups
4. ✅ Regular security audits

### For Development
1. Consider using test data
2. Document why hashing is used
3. Train admins on limitations
4. Have fallback contact method

## Summary

**Pros:**
- ✅ Maximum privacy protection
- ✅ Secure against database breaches
- ✅ Cannot be decrypted
- ✅ Simple implementation

**Cons:**
- ❌ Cannot view grievance content
- ❌ Cannot search by keywords
- ❌ Cannot categorize by type
- ❌ Limited analytics

Choose hashing if **privacy is paramount**. Choose encryption if you need to **retrieve and display** content to authorized users.
