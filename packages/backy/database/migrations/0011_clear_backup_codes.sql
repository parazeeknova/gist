-- Clear existing backup codes: hash format changed from SHA-256 to argon2id.
-- Users with MFA enabled will need to regenerate their backup codes.
UPDATE user_mfa SET backup_code_hashes = '{}' WHERE array_length(backup_code_hashes, 1) > 0;
