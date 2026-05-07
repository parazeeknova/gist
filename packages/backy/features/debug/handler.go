package debug

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"verso/backy/database"
	"verso/backy/shared/logger"
)

type DebugHandlers struct{}

func NewDebugHandlers() *DebugHandlers {
	return &DebugHandlers{}
}

func (h *DebugHandlers) GetDebugTables(c *gin.Context) {
	pool := database.GetPool()
	if pool == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database not available"})
		return
	}
	rows, err := pool.Query(c.Request.Context(), `
		SELECT table_name FROM information_schema.tables
		WHERE table_schema = 'public' ORDER BY table_name
	`)
	if err != nil {
		logger.Log.Error().Err(err).Msg("get debug tables error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list tables"})
		return
	}
	defer rows.Close()
	var tables []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			continue
		}
		tables = append(tables, name)
	}
	c.JSON(http.StatusOK, gin.H{"tables": tables})
}

func (h *DebugHandlers) GetDebugTableData(c *gin.Context) {
	pool := database.GetPool()
	if pool == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database not available"})
		return
	}
	tableName := c.Param("tableName")
	if !isValidTableName(tableName) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid table name"})
		return
	}
	limit := c.DefaultQuery("limit", "100")
	offset := c.DefaultQuery("offset", "0")
	query := fmt.Sprintf("SELECT * FROM %s ORDER BY created_at DESC LIMIT %s OFFSET %s", tableName, limit, offset)
	rows, err := pool.Query(c.Request.Context(), query)
	if err != nil {
		logger.Log.Error().Err(err).Str("table", tableName).Msg("get debug table data error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query table"})
		return
	}
	defer rows.Close()
	columns := rows.FieldDescriptions()
	var results []map[string]interface{}
	for rows.Next() {
		values, err := rows.Values()
		if err != nil {
			continue
		}
		row := make(map[string]interface{})
		for i, col := range columns {
			row[string(col.Name)] = values[i]
		}
		results = append(results, row)
	}
	c.JSON(http.StatusOK, gin.H{"rows": results, "columns": columns})
}

func (h *DebugHandlers) DeleteDebugTableData(c *gin.Context) {
	pool := database.GetPool()
	if pool == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database not available"})
		return
	}
	tableName := c.Param("tableName")
	if !isValidTableName(tableName) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid table name"})
		return
	}
	_, err := pool.Exec(c.Request.Context(), fmt.Sprintf("DELETE FROM %s", tableName))
	if err != nil {
		logger.Log.Error().Err(err).Str("table", tableName).Msg("delete debug table data error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete data"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *DebugHandlers) DeleteDebugTableRows(c *gin.Context) {
	pool := database.GetPool()
	if pool == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database not available"})
		return
	}
	tableName := c.Param("tableName")
	if !isValidTableName(tableName) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid table name"})
		return
	}
	var req struct {
		IDs []string `json:"ids"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || len(req.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ids are required"})
		return
	}
	placeholders := make([]string, len(req.IDs))
	args := make([]interface{}, len(req.IDs))
	for i, id := range req.IDs {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = id
	}
	query := fmt.Sprintf("DELETE FROM %s WHERE id IN (%s)", tableName, strings.Join(placeholders, ","))
	_, err := pool.Exec(c.Request.Context(), query, args...)
	if err != nil {
		logger.Log.Error().Err(err).Str("table", tableName).Msg("delete debug table rows error")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete rows"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func isValidTableName(name string) bool {
	if len(name) == 0 || len(name) > 63 {
		return false
	}
	for _, c := range name {
		if !((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_') {
			return false
		}
	}
	return true
}
