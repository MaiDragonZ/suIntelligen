package handlers

import (
	"github.com/gin-gonic/gin"
	"su-intelligence/internal/auth"
	"su-intelligence/pkg/response"
)

type UsersHandler struct{ store *auth.UserStore }

func NewUsersHandler(store *auth.UserStore) *UsersHandler { return &UsersHandler{store: store} }

func (h *UsersHandler) List(c *gin.Context) { response.OK(c, h.store.All()) }
func (h *UsersHandler) Get(c *gin.Context)  { response.OK(c, gin.H{"message": "wire to store"}) }
