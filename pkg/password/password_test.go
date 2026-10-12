package password_test

import (
	"testing"

	"3dkemasansaas/pkg/password"
)

func TestPasswordHashing(t *testing.T) {
	raw := "SecurePassword123!"
	hashed, err := password.HashPassword(raw)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	if !password.CheckPassword(raw, hashed) {
		t.Errorf("Expected password to match hash")
	}

	if password.CheckPassword("WrongPassword", hashed) {
		t.Errorf("Expected wrong password to fail")
	}
}
