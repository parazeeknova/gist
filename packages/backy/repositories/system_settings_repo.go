package repositories

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"verso/backy/database"
)

type SystemSetting struct {
	Key       string  `json:"key"`
	Value     bool    `json:"value"`
	UpdatedAt string  `json:"updatedAt"`
	UpdatedBy *string `json:"updatedBy,omitempty"`
}

type SystemSettingsRepo struct {
	pool *pgxpool.Pool
}

func NewSystemSettingsRepo() *SystemSettingsRepo {
	return &SystemSettingsRepo{pool: database.GetPool()}
}

func (r *SystemSettingsRepo) GetAll(ctx context.Context) ([]SystemSetting, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT key, value, updated_at, updated_by
		FROM system_settings
		ORDER BY key
	`)
	if err != nil {
		return nil, fmt.Errorf("querying system settings: %w", err)
	}
	defer rows.Close()

	var results []SystemSetting
	for rows.Next() {
		var s SystemSetting
		var updatedAt time.Time
		var updatedBy *string
		if err := rows.Scan(&s.Key, &s.Value, &updatedAt, &updatedBy); err != nil {
			return nil, fmt.Errorf("scanning system setting: %w", err)
		}
		s.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
		s.UpdatedBy = updatedBy
		results = append(results, s)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating system settings: %w", err)
	}
	if results == nil {
		results = []SystemSetting{}
	}
	return results, nil
}

func (r *SystemSettingsRepo) Get(ctx context.Context, key string) (*SystemSetting, error) {
	var s SystemSetting
	var updatedAt time.Time
	var updatedBy *string
	err := r.pool.QueryRow(ctx, `
		SELECT key, value, updated_at, updated_by
		FROM system_settings
		WHERE key = $1
	`, key).Scan(&s.Key, &s.Value, &updatedAt, &updatedBy)
	if err != nil {
		return nil, fmt.Errorf("getting system setting %s: %w", key, err)
	}
	s.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	s.UpdatedBy = updatedBy
	return &s, nil
}

func (r *SystemSettingsRepo) Set(ctx context.Context, key string, value bool, updatedBy string) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO system_settings (key, value, updated_at, updated_by)
		VALUES ($1, $2, now(), $3)
		ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now(), updated_by = $3
	`, key, value, updatedBy)
	if err != nil {
		return fmt.Errorf("setting system setting %s: %w", key, err)
	}
	return nil
}

func (r *SystemSettingsRepo) IsEnabled(ctx context.Context, key string) bool {
	s, err := r.Get(ctx, key)
	if err != nil {
		return false
	}
	return s.Value
}
