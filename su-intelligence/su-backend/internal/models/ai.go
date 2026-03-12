package models

import "time"

type AIModel struct {
	ID      string  `json:"id"`
	Name    string  `json:"name"`
	Type    string  `json:"type"`
	RPS     int     `json:"rps"`
	Latency int     `json:"latency"`
	Health  float64 `json:"health"`
	Uptime  string  `json:"uptime"`
	Active  bool    `json:"active"`
}

type ChatMessage struct {
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at,omitempty"`
}

type ChatRequest struct {
	SessionID string        `json:"session_id"` // ถ้าไม่ส่งมา = สร้าง session ใหม่
	ModelID   string        `json:"model_id"    binding:"required"`
	Message   string        `json:"message"     binding:"required"`
}

type ChatResponse struct {
	SessionID string      `json:"session_id"`
	ID        string      `json:"id"`
	Model     string      `json:"model"`
	Message   ChatMessage `json:"message"`
	Tokens    int         `json:"tokens"`
	Latency   int         `json:"latency_ms"`
	Time      time.Time   `json:"time"`
}

// Session เก็บประวัติ chat ทั้งหมด
type ChatSession struct {
	ID        string        `json:"id"`
	UserID    uint          `json:"user_id"`
	ModelID   string        `json:"model_id"`
	Title     string        `json:"title"`
	Messages  []ChatMessage `json:"messages"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
}

type AIStats struct {
	TotalRequests int64   `json:"total_requests"`
	AvgLatency    float64 `json:"avg_latency_ms"`
	ActiveModels  int     `json:"active_models"`
	ErrorRate     float64 `json:"error_rate"`
}
