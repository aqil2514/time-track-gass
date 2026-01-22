// backend/internal/utils/crypto.go
package utils

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"io"
)

// Encrypt encrypts text using AES-256-GCM
func Encrypt(text, keyString string) (string, string, error) {
	key := []byte(keyString)
	// Key must be 32 bytes for AES-256
	if len(key) != 32 {
		return "", "", errors.New("key must be exactly 32 bytes")
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(text), nil)

	return base64.StdEncoding.EncodeToString(ciphertext), base64.StdEncoding.EncodeToString(nonce), nil
}

// Decrypt decrypts text using AES-256-GCM
// Note: We don't actually need the nonce separately if we prepend it to ciphertext,
// but the plan schema had separate columns `ai_api_key_encrypted` and `ai_api_key_iv`.
// The standard GCM Seal appends the tag, but usually we prepend the nonce.
// If the schema splits them, we should handle them separately.
// However, standard Go GCM implementation usually includes nonce in the sealed result if we pass it as dst.
// `gcm.Seal(nonce, nonce, ...)` prepends the nonce.
// If the DB schema has a separate column for IV (nonce), we should probably extract it.
// BUT, if we use `gcm.Seal(nonce, nonce, ...)` the nonce is part of the output.
// A simpler approach for the DB schema `ai_api_key_iv` is to store the nonce there,
// and `ai_api_key_encrypted` stores the ciphertext (without nonce prepended).

func EncryptSplit(text, keyString string) (string, string, error) {
	key := []byte(keyString)
	if len(key) != 32 {
		return "", "", errors.New("key must be exactly 32 bytes")
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", "", err
	}

	// Seal appends authentication tag to the ciphertext.
	// We pass nil as dst so it allocates a new slice.
	ciphertext := gcm.Seal(nil, nonce, []byte(text), nil)

	return base64.StdEncoding.EncodeToString(ciphertext), base64.StdEncoding.EncodeToString(nonce), nil
}

func DecryptSplit(ciphertextStr, nonceStr, keyString string) (string, error) {
	key := []byte(keyString)
	if len(key) != 32 {
		return "", errors.New("key must be exactly 32 bytes")
	}

	ciphertext, err := base64.StdEncoding.DecodeString(ciphertextStr)
	if err != nil {
		return "", err
	}

	nonce, err := base64.StdEncoding.DecodeString(nonceStr)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}
