package middleware

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
)

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		status := c.Writer.Status()
		color := "\033[32m"
		if status >= 400 { color = "\033[33m" }
		if status >= 500 { color = "\033[31m" }
		fmt.Printf("%s[%d]\033[0m %s %-6s %s  %v\n",
			color, status, time.Now().Format("15:04:05"),
			c.Request.Method, c.Request.URL.Path, time.Since(start))
	}
}
