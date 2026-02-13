package utils

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var SecretKey = []byte(os.Getenv("SECRET_KEY"))

func GenerateToken(userID uint, email string) (string, error) {
	if len(SecretKey) == 0 {
		SecretKey = []byte("default-secret-key-change-me")
	}

	claims := jwt.MapClaims{
		"user_id": userID,
		"email":   email,
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(), // 1 week
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(SecretKey)
}

func ValidateToken(tokenString string) (*jwt.Token, error) {
	return jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return SecretKey, nil
	})
}
