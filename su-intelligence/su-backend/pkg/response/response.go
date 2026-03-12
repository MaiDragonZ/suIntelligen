package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Envelope struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

func OK(c *gin.Context, data interface{})           { c.JSON(http.StatusOK, Envelope{Success: true, Data: data}) }
func Created(c *gin.Context, data interface{})      { c.JSON(http.StatusCreated, Envelope{Success: true, Data: data}) }
func BadRequest(c *gin.Context, msg string)         { c.AbortWithStatusJSON(http.StatusBadRequest, Envelope{Success: false, Error: msg}) }
func Unauthorized(c *gin.Context, msg string)       { c.AbortWithStatusJSON(http.StatusUnauthorized, Envelope{Success: false, Error: msg}) }
func Forbidden(c *gin.Context)                      { c.AbortWithStatusJSON(http.StatusForbidden, Envelope{Success: false, Error: "forbidden"}) }
func NotFound(c *gin.Context, msg string)           { c.AbortWithStatusJSON(http.StatusNotFound, Envelope{Success: false, Error: msg}) }
func InternalError(c *gin.Context, err error)       { c.AbortWithStatusJSON(http.StatusInternalServerError, Envelope{Success: false, Error: err.Error()}) }
