package handlers

import (
	"github.com/gin-gonic/gin"
	"su-intelligence/internal/auth"
	"su-intelligence/internal/middleware"
	"su-intelligence/internal/models"
	"su-intelligence/pkg/response"
)

type AuthHandler struct {
	store  *auth.UserStore
	jwtSvc *auth.JWTService
}

func NewAuthHandler(store *auth.UserStore, jwtSvc *auth.JWTService) *AuthHandler {
	return &AuthHandler{store: store, jwtSvc: jwtSvc}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	user, err := h.store.FindByEmail(req.Email)
	if err != nil || !h.store.CheckPassword(user, req.Password) {
		response.Unauthorized(c, "invalid email or password")
		return
	}
	if !user.Active {
		response.Unauthorized(c, "account is disabled")
		return
	}
	token, err := h.jwtSvc.Generate(user)
	if err != nil {
		response.InternalError(c, err)
		return
	}
	response.OK(c, models.LoginResponse{Token: token, User: *user})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	response.OK(c, gin.H{"message": "logged out"})
}

func (h *AuthHandler) Me(c *gin.Context) {
	claims := middleware.GetClaims(c)
	user, err := h.store.FindByID(claims.UserID)
	if err != nil {
		response.NotFound(c, "user not found")
		return
	}
	response.OK(c, user)
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	claims := middleware.GetClaims(c)
	user, err := h.store.FindByID(claims.UserID)
	if err != nil {
		response.NotFound(c, "user not found")
		return
	}
	token, err := h.jwtSvc.Generate(user)
	if err != nil {
		response.InternalError(c, err)
		return
	}
	response.OK(c, gin.H{"token": token})
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	claims := middleware.GetClaims(c)
	var req models.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	user, err := h.store.FindByID(claims.UserID)
	if err != nil {
		response.NotFound(c, "user not found")
		return
	}
	if !h.store.CheckPassword(user, req.OldPassword) {
		response.BadRequest(c, "current password is incorrect")
		return
	}
	if err := h.store.UpdatePassword(user.Email, req.NewPassword); err != nil {
		response.InternalError(c, err)
		return
	}
	response.OK(c, gin.H{"message": "password updated"})
}
