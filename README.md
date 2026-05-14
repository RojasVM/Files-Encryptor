# File Encryptor

A web thing to encrypt files from your browser. Nothing gets uploaded anywhere, everything happens on your computer.

## How to use

1. Open index.html
2. Pick a file
3. Rype a password (min 8 characters)
4. Press Encrypt and a .enc file downloads
5. To get it back, drop it in the Decrypt tab with the same password

If you mess up the password it just says wrong password. There's no way to recover it so dont forget it.

## How it works

Uses AES-256-GCM which is already built into browsers. the password goes through PBKDF2 (250k rounds) so its slower to brute force. Salt and iv are random for every file so encrypting the same thing twice gives different results.

The encrypted file looks like:

```
[salt 16 bytes][iv 12 bytes][encrypted data]
```
