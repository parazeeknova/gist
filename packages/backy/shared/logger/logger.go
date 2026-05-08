// Package logger provides a shared zerolog logger configured for the backy service.
// In non-production environments it writes human-readable colour output to stderr;
// in production it writes JSON to stdout for consumption by log aggregators.
package logger

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/rs/zerolog"
)

var Log zerolog.Logger

func init() {
	level := zerolog.InfoLevel
	if envLevel := os.Getenv("LOG_LEVEL"); envLevel != "" {
		if parsed, err := zerolog.ParseLevel(strings.ToLower(envLevel)); err == nil {
			level = parsed
		}
	}

	zerolog.TimeFieldFormat = time.RFC3339
	zerolog.TimestampFieldName = "time"
	zerolog.LevelFieldName = "level"
	zerolog.MessageFieldName = "msg"

	isProduction := os.Getenv("NODE_ENV") == "production"

	if isProduction {
		Log = zerolog.New(os.Stdout).Level(level).With().Timestamp().Logger()
	} else {
		output := zerolog.ConsoleWriter{
			Out:        os.Stderr,
			TimeFormat: "15:04:05",
			NoColor:    false,
		}
		output.FormatLevel = func(i any) string {
			return strings.ToUpper(fmt.Sprintf("| %-6s|", i))
		}
		Log = zerolog.New(output).Level(level).With().Timestamp().Logger()
	}

	Log.Info().Str("env", os.Getenv("NODE_ENV")).Msg("logger initialised")
}
