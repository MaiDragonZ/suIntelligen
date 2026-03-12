package config

import (
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port      string
	JWTSecret string
	JWTExpiry time.Duration
	Env       string
}

func Load() *Config {
	_ = godotenv.Load()
	hours, _ := strconv.Atoi(getEnv("JWT_EXPIRY_HOURS", "24"))
	return &Config{
		Port:      getEnv("PORT", "8080"),
		JWTSecret: getEnv("JWT_SECRET", "dev-secret-change-me"),
		JWTExpiry: time.Duration(hours) * time.Hour,
		Env:       getEnv("APP_ENV", "development"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
