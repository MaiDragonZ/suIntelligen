package handlers

import (
	"time"

	"github.com/gin-gonic/gin"
	"su-intelligence/pkg/response"
)

type DashboardHandler struct{}

func NewDashboardHandler() *DashboardHandler { return &DashboardHandler{} }

func (h *DashboardHandler) Stats(c *gin.Context) {
	response.OK(c, map[string]interface{}{
		"active_models":  4,
		"total_requests": 1_432_881,
		"avg_latency_ms": 38,
		"active_users":   8291,
		"error_rate":     0.02,
		"uptime":         "99.99%",
	})
}

func (h *DashboardHandler) Activity(c *gin.Context) {
	now := time.Now()
	response.OK(c, []map[string]interface{}{
		{"status": "success", "title": "Model su-text-ultra deployed",    "tag": "Deploy", "time": now.Add(-2 * time.Minute)},
		{"status": "warning", "title": "High latency on cluster #3",      "tag": "Alert",  "time": now.Add(-14 * time.Minute)},
		{"status": "success", "title": "200K token benchmark passed",     "tag": "Test",   "time": now.Add(-1 * time.Hour)},
		{"status": "error",   "title": "Webhook integration timed out",   "tag": "Error",  "time": now.Add(-2 * time.Hour)},
		{"status": "success", "title": "Auto-scaling triggered x2",       "tag": "Scale",  "time": now.Add(-3 * time.Hour)},
		{"status": "info",    "title": "New dataset ingested: SU-2024-Q4","tag": "Data",   "time": now.Add(-5 * time.Hour)},
	})
}
