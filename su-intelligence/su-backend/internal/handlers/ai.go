package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"su-intelligence/internal/middleware"
	"su-intelligence/internal/models"
	"su-intelligence/pkg/response"
)

// ── AI Models metadata ────────────────────────────────────────────────

var aiModels = []models.AIModel{
	{ID: "deepseek-chat", Name: "DeepSeek Chat", Type: "Language", RPS: 2000, Latency: 500, Health: 100, Uptime: "99.99%", Active: true},
	{ID: "deepseek-coder", Name: "DeepSeek Coder", Type: "Code", RPS: 1500, Latency: 600, Health: 100, Uptime: "99.99%", Active: true},
}

// ── Session store ─────────────────────────────────────────────────────

type sessionStore struct {
	mu       sync.RWMutex
	sessions map[string]*models.ChatSession
}

var sessions = &sessionStore{
	sessions: make(map[string]*models.ChatSession),
}

func (s *sessionStore) get(id string) (*models.ChatSession, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	sess, ok := s.sessions[id]
	return sess, ok
}

func (s *sessionStore) create(userID uint, modelID string) *models.ChatSession {
	s.mu.Lock()
	defer s.mu.Unlock()
	id := fmt.Sprintf("sess_%d_%d", userID, time.Now().UnixNano())
	sess := &models.ChatSession{
		ID:        id,
		UserID:    userID,
		ModelID:   modelID,
		Title:     "New Chat",
		Messages:  []models.ChatMessage{},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	s.sessions[id] = sess
	return sess
}

func (s *sessionStore) listByUser(userID uint) []*models.ChatSession {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var out []*models.ChatSession
	for _, sess := range s.sessions {
		if sess.UserID == userID {
			out = append(out, sess)
		}
	}
	// sort by UpdatedAt descending
	for i := 0; i < len(out)-1; i++ {
		for j := i + 1; j < len(out); j++ {
			if out[i].UpdatedAt.Before(out[j].UpdatedAt) {
				out[i], out[j] = out[j], out[i]
			}
		}
	}
	return out
}

func (s *sessionStore) delete(id string, userID uint) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	sess, ok := s.sessions[id]
	if !ok || sess.UserID != userID {
		return false
	}
	delete(s.sessions, id)
	return true
}

// ── OpenAI client ─────────────────────────────────────────────────────

type openAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIRequest struct {
	Model       string          `json:"model"`
	Messages    []openAIMessage `json:"messages"`
	MaxTokens   int             `json:"max_tokens"`
	Temperature float64         `json:"temperature"`
}

type openAIResponse struct {
	ID      string `json:"id"`
	Choices []struct {
		Message openAIMessage `json:"message"`
		Index   int           `json:"index"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error,omitempty"`
}

func callDeepSeek(modelID string, messages []openAIMessage) (*openAIResponse, int, error) {
	apiKey := os.Getenv("DEEPSEEK_API_KEY")
	if apiKey == "" {
		return nil, 0, fmt.Errorf("OPENAI_API_KEY not set")
	}

	reqBody := openAIRequest{
		Model:       modelID,
		Messages:    messages,
		MaxTokens:   1024,
		Temperature: 0.7,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, 0, err
	}

	req, err := http.NewRequest(
	"POST",
	"https://api.deepseek.com/v1/chat/completions",
	bytes.NewBuffer(body),
)

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)


	start  := time.Now()
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	latency := int(time.Since(start).Milliseconds())
	if err != nil {
		return nil, latency, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, latency, err
	}

	var openAIResp openAIResponse
	if err := json.Unmarshal(respBody, &openAIResp); err != nil {
		return nil, latency, err
	}
	if openAIResp.Error != nil {
		return nil, latency, fmt.Errorf("deepseek error: %s", openAIResp.Error.Message)

	}
	return &openAIResp, latency, nil
}

// ── Handler ───────────────────────────────────────────────────────────

type AIHandler struct{}

func NewAIHandler() *AIHandler { return &AIHandler{} }

// GET /ai/models
func (h *AIHandler) ListModels(c *gin.Context) {
	response.OK(c, aiModels)
}

// GET /ai/models/:id
func (h *AIHandler) GetModel(c *gin.Context) {
	id := c.Param("id")
	for _, m := range aiModels {
		if m.ID == id {
			response.OK(c, m)
			return
		}
	}
	response.NotFound(c, "model not found")
}

// GET /ai/stats
func (h *AIHandler) Stats(c *gin.Context) {
	response.OK(c, models.AIStats{
		TotalRequests: 1_432_881,
		AvgLatency:    38.4,
		ActiveModels:  len(aiModels),
		ErrorRate:     0.02,
	})
}

// GET /ai/sessions — ดึง session ทั้งหมดของ user
func (h *AIHandler) ListSessions(c *gin.Context) {
	claims := middleware.GetClaims(c)
	response.OK(c, sessions.listByUser(claims.UserID))
}

// GET /ai/sessions/:id — ดึง session + ประวัติ messages
func (h *AIHandler) GetSession(c *gin.Context) {
	claims := middleware.GetClaims(c)
	sess, ok := sessions.get(c.Param("id"))
	if !ok || sess.UserID != claims.UserID {
		response.NotFound(c, "session not found")
		return
	}
	response.OK(c, sess)
}

// DELETE /ai/sessions/:id
func (h *AIHandler) DeleteSession(c *gin.Context) {
	claims := middleware.GetClaims(c)
	if !sessions.delete(c.Param("id"), claims.UserID) {
		response.NotFound(c, "session not found")
		return
	}
	response.OK(c, gin.H{"message": "session deleted"})
}

// POST /ai/chat — ส่ง message + รับ response + เก็บประวัติ
func (h *AIHandler) Chat(c *gin.Context) {
	claims := middleware.GetClaims(c)

	var req models.ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	// ตรวจ model
	validModel := false
	for _, m := range aiModels {
		if m.ID == req.ModelID { validModel = true; break }
	}
	if !validModel {
		response.NotFound(c, "model not found")
		return
	}

	// หา session หรือสร้างใหม่
	var sess *models.ChatSession
	if req.SessionID != "" {
		var ok bool
		sess, ok = sessions.get(req.SessionID)
		if !ok || sess.UserID != claims.UserID {
			response.NotFound(c, "session not found")
			return
		}
	} else {
		sess = sessions.create(claims.UserID, req.ModelID)
	}

	// เพิ่ม user message
	userMsg := models.ChatMessage{
		Role:      "user",
		Content:   req.Message,
		CreatedAt: time.Now(),
	}
	sess.Messages = append(sess.Messages, userMsg)

	// สร้าง messages list ส่ง OpenAI (เอา system prompt + ประวัติทั้งหมด)
	openAIMsgs := []openAIMessage{
		{
			Role:    "system",
			Content: "You are SU Intelligence Assistant, a helpful AI assistant for the SU Intelligence platform. Be concise, accurate, and professional.",
		},
	}
	for _, m := range sess.Messages {
		openAIMsgs = append(openAIMsgs, openAIMessage{
			Role:    m.Role,
			Content: m.Content,
		})
	}

	// เรียก OpenAI
	aiResp, latency, err := callDeepSeek(req.ModelID, openAIMsgs)
	if err != nil {
		// ถ้า OpenAI error ลบ user message ที่เพิ่งเพิ่มออก
		sess.Messages = sess.Messages[:len(sess.Messages)-1]
		response.InternalError(c, err)
		return
	}

	// เพิ่ม assistant message
	assistantContent := aiResp.Choices[0].Message.Content
	assistantMsg := models.ChatMessage{
		Role:      "assistant",
		Content:   assistantContent,
		CreatedAt: time.Now(),
	}
	sess.Messages = append(sess.Messages, assistantMsg)
	sess.UpdatedAt = time.Now()

	// ตั้ง title จาก message แรก (ถ้ายังเป็น "New Chat")
	if sess.Title == "New Chat" && len(sess.Messages) >= 1 {
		title := req.Message
		if len(title) > 40 {
			title = title[:40] + "…"
		}
		sess.Title = title
	}

	response.OK(c, models.ChatResponse{
		SessionID: sess.ID,
		ID:        aiResp.ID,
		Model:     req.ModelID,
		Message:   assistantMsg,
		Tokens:    aiResp.Usage.TotalTokens,
		Latency:   latency,
		Time:      time.Now(),
	})
}
