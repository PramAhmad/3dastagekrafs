package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Standard Response Structures
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Meta    interface{} `json:"meta,omitempty"`
	Error   *APIError   `json:"error,omitempty"`
}

type APIError struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

type PaginationMeta struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	TotalItems int64 `json:"total_items"`
	TotalPages int   `json:"total_pages"`
}

// Helper Functions
func Success(c *gin.Context, statusCode int, message string, data interface{}) {
	c.JSON(statusCode, APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func SuccessWithMeta(c *gin.Context, statusCode int, message string, data interface{}, meta interface{}) {
	c.JSON(statusCode, APIResponse{
		Success: true,
		Message: message,
		Data:    data,
		Meta:    meta,
	})
}

func Error(c *gin.Context, statusCode int, errCode string, message string, details interface{}) {
	c.JSON(statusCode, APIResponse{
		Success: false,
		Error: &APIError{
			Code:    errCode,
			Message: message,
			Details: details,
		},
	})
}

func InternalServerError(c *gin.Context, message string) {
	if message == "" {
		message = "Terjadi kesalahan internal pada server"
	}
	Error(c, http.StatusInternalServerError, "INTERNAL_SERVER_ERROR", message, nil)
}

func BadRequest(c *gin.Context, message string, details interface{}) {
	Error(c, http.StatusBadRequest, "BAD_REQUEST", message, details)
}

func Unauthorized(c *gin.Context, message string) {
	if message == "" {
		message = "Akses tidak diizinkan atau token kadaluarsa"
	}
	Error(c, http.StatusUnauthorized, "UNAUTHORIZED", message, nil)
}

func NotFound(c *gin.Context, message string) {
	if message == "" {
		message = "Data atau sumber daya tidak ditemukan"
	}
	Error(c, http.StatusNotFound, "NOT_FOUND", message, nil)
}
