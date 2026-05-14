# File Encryptor

a web thing to encrypt files from your browser. nothing gets uploaded anywhere, everything happens on your computer.

## how to use

1. open index.html
2. pick a file
3. type a password (min 8 characters)
4. press Encrypt and a .enc file downloads
5. to get it back, drop it in the Decrypt tab with the same password

if you mess up the password it just says wrong password. theres no way to recover it so dont forget it.

## how it works

uses AES-256-GCM which is already built into browsers. the password goes through PBKDF2 (250k rounds) so its slower to brute force. salt and iv are random for every file so encrypting the same thing twice gives different results.

the encrypted file looks like:

```
[salt 16 bytes][iv 12 bytes][encrypted data]
```
