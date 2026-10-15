package config

import (
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort        string
	AppEnv         string
	BaseDomain     string
	DatabaseDriver string
	DatabaseURL    string
	RedisURL       string
	JWTSecret      string
}

func LoadConfig() *Config {
	_ = godotenv.Load() // load from .env if present

	driver := getEnv("DATABASE_DRIVER", "sqlite")
	dbURL := getEnv("DATABASE_URL", "asta.db")

	// If DATABASE_URL starts with postgres scheme, auto-detect postgres driver
	if strings.HasPrefix(dbURL, "postgres://") || strings.HasPrefix(dbURL, "postgresql://") {
		driver = "postgres"
	}

	return &Config{
		AppPort:        getEnv("APP_PORT", "8080"),
		AppEnv:         getEnv("APP_ENV", "development"),
		BaseDomain:     getEnv("BASE_DOMAIN", "kemasan3d.id"),
		DatabaseDriver: driver,
		DatabaseURL:    dbURL,
		RedisURL:       getEnv("REDIS_URL", "localhost:6379"),
		JWTSecret:      getEnv("JWT_SECRET", "super-secret-key-3dkemasan"),
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if val := os.Getenv(key); val != "" {
		if intVal, err := strconv.Atoi(val); err == nil {
			return intVal
		}
	}
	return fallback
}
