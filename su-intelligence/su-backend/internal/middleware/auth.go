package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"su-intelligence/internal/auth"
	"su-intelligence/internal/models"
	"su-intelligence/pkg/response"
)

const UserKey = "user_claims"

func JWTAuth(jwtSvc *auth.JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			response.Unauthorized(c, "missing or invalid authorization header")
			return
		}
		claims, err := jwtSvc.Validate(strings.TrimPrefix(header, "Bearer "))
		if err != nil {
			response.Unauthorized(c, "invalid or expired token")
			return
		}
		c.Set(UserKey, claims)
		c.Next()
	}
}

func RequireRole(roles ...models.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, ok := c.Get(UserKey)
		if !ok {
			response.Unauthorized(c, "not authenticated")
			return
		}
		userClaims := claims.(*auth.Claims)
		for _, r := range roles {
			if userClaims.Role == r {
				c.Next()
				return
			}
		}
		response.Forbidden(c)
	}
}

func GetClaims(c *gin.Context) *auth.Claims {
	v, _ := c.Get(UserKey)
	if v == nil {
		return nil
	}
	return v.(*auth.Claims)
}
