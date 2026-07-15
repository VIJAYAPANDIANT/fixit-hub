package main

import (
	"context"
	"crypto/md5"
	"crypto/tls"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/ClickHouse/clickhouse-go/v2"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
)

// EventPayload represents the raw payload sent by the SDK
type EventPayload struct {
	ExceptionType    string            `json:"exception_type"`
	ExceptionMessage string            `json:"exception_message"`
	Stacktrace       string            `json:"stacktrace"`
	Environment      string            `json:"environment"`
	Release          string            `json:"release"`
	Breadcrumbs      string            `json:"breadcrumbs"` // Stringified JSON array
	Tags             map[string]string `json:"tags"`
	UserContext      map[string]string `json:"user_context"`
	Fingerprint      string            `json:"fingerprint"` // Optional client override
}

// Config stores environment variables
type Config struct {
	Port          string
	RedisURL      string
	ClickHouseURL string
	ClickHouseDB  string
}

var (
	redisClient *redis.Client
	chConn      clickhouse.Conn
	ctx         = context.Background()
)

func main() {
	cfg := loadConfig()

	// 1. Connect & Retry Redis
	initRedis(cfg.RedisURL)

	// 2. Connect & Retry ClickHouse
	initClickHouse(cfg.ClickHouseURL, cfg.ClickHouseDB)
	defer chConn.Close()

	// 3. Create ClickHouse Schema
	createSchema()

	// 4. Set Up Server
	mux := http.NewServeMux()
	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/api/v1/store/", handleIngestion)

	port := cfg.Port
	if port == "" {
		port = "5001"
	}

	log.Printf("FixIt Ingestion Service starting on port %s...", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Server startup failed: %v", err)
	}
}

func loadConfig() Config {
	return Config{
		Port:          os.Getenv("PORT"),
		RedisURL:      os.Getenv("REDIS_URL"),
		ClickHouseURL: os.Getenv("CLICKHOUSE_URL"),
		ClickHouseDB:  os.Getenv("CLICKHOUSE_DB"),
	}
}

func initRedis(url string) {
	if url == "" {
		url = "redis://localhost:6379"
	}
	opt, err := redis.ParseURL(url)
	if err != nil {
		log.Fatalf("Invalid Redis URL: %v", err)
	}

	redisClient = redis.NewClient(opt)

	for i := 1; i <= 10; i++ {
		_, err := redisClient.Ping(ctx).Result()
		if err == nil {
			log.Println("Connected to Redis successfully.")
			return
		}
		log.Printf("[%d/10] Waiting for Redis connection... %v", i, err)
		time.Sleep(2 * time.Second)
	}
	log.Fatal("Could not connect to Redis after 10 attempts.")
}

func initClickHouse(url string, db string) {
	if url == "" {
		url = "http://localhost:8123"
	}
	if db == "" {
		db = "fixit_events"
	}

	// Parsing basic options
	var addr []string
	if strings.Contains(url, "://") {
		parts := strings.Split(url, "://")
		if len(parts) > 1 {
			addr = []string{parts[1]}
		}
	} else {
		addr = []string{url}
	}

	// Setting up Connection options
	options := &clickhouse.Options{
		Addr: addr,
		Auth: clickhouse.Auth{
			Database: "default", // Connect to default first, create our database if needed
			Username: "default",
			Password: "",
		},
		TLS: &tls.Config{
			InsecureSkipVerify: true,
		},
		Settings: clickhouse.Settings{
			"max_execution_time": 60,
		},
		DialTimeout: 5 * time.Second,
	}

	var err error
	for i := 1; i <= 15; i++ {
		chConn, err = clickhouse.Open(options)
		if err == nil {
			err = chConn.Ping(ctx)
			if err == nil {
				log.Println("Connected to ClickHouse successfully.")
				
				// Create database if not exists
				createDBQuery := fmt.Sprintf("CREATE DATABASE IF NOT EXISTS %s", db)
				if err := chConn.Exec(ctx, createDBQuery); err != nil {
					log.Printf("Failed to create ClickHouse database %s: %v", db, err)
				} else {
					log.Printf("ClickHouse database %s verified/created.", db)
				}

				// Reconnect using specific database
				options.Auth.Database = db
				chConn.Close()
				chConn, err = clickhouse.Open(options)
				if err == nil && chConn.Ping(ctx) == nil {
					return
				}
			}
		}
		log.Printf("[%d/15] Waiting for ClickHouse connection... %v", i, err)
		time.Sleep(3 * time.Second)
	}
	log.Fatalf("Could not connect to ClickHouse after 15 attempts. Last err: %v", err)
}

func createSchema() {
	query := `
	CREATE TABLE IF NOT EXISTS events (
		event_id UUID,
		project_id UUID,
		issue_id UUID,
		timestamp DateTime64(3),
		environment LowCardinality(String),
		release String,
		exception_type LowCardinality(String),
		exception_message String,
		stacktrace String,
		breadcrumbs String,
		tags Map(String, String),
		user_context Map(String, String),
		fingerprint String
	) ENGINE = MergeTree()
	PARTITION BY toYYYYMM(timestamp)
	ORDER BY (project_id, issue_id, timestamp);
	`
	if err := chConn.Exec(ctx, query); err != nil {
		log.Fatalf("Failed to create ClickHouse schema: %v", err)
	}
	log.Println("ClickHouse events table schema verified.")
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"OK"}`))
}

func handleIngestion(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	// 1. DSN Authentication Check
	dsn := r.URL.Query().Get("dsn")
	if dsn == "" {
		dsn = r.Header.Get("X-FixIt-DSN")
	}
	if dsn == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error":"Missing DSN parameter or header"}`))
		return
	}

	// Note: In production, we validate the DSN in PostgreSQL. 
	// To minimize direct database load, we look up Project ID by DSN from a Redis cache.
	// If it doesn't exist in Redis, we assign a placeholder or fetch it.
	projectIDStr, err := redisClient.Get(ctx, "dsn:"+dsn).Result()
	if err == redis.Nil {
		// Mock/Auto-provision project UUID if not found locally for testing
		// Create a hash of the DSN to simulate a consistent project UUID
		hash := md5.Sum([]byte(dsn))
		pUUID, _ := uuid.FromBytes(hash[:])
		projectIDStr = pUUID.String()
		redisClient.Set(ctx, "dsn:"+dsn, projectIDStr, 24*time.Hour)
	} else if err != nil {
		log.Printf("Redis error looking up DSN: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	projectID, err := uuid.Parse(projectIDStr)
	if err != nil {
		projectID = uuid.New()
	}

	// 2. Rate Limiting check via Redis
	rlKey := fmt.Sprintf("ratelimit:%s", projectID.String())
	cnt, err := redisClient.Incr(ctx, rlKey).Result()
	if err == nil {
		if cnt == 1 {
			redisClient.Expire(ctx, rlKey, 60*time.Second)
		}
		if cnt > 1000 { // Max 1000 EPS per project
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte(`{"error":"Rate limit exceeded. Max 1000 events/minute."}`))
			return
		}
	}

	// 3. Decode payload
	var payload EventPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(`{"error":"Malformed JSON payload"}`))
		return
	}

	// 4. Process Fingerprint (Deduplication)
	fingerprint := payload.Fingerprint
	if fingerprint == "" {
		// Calculate default fingerprint by hashing ExceptionType and Stacktrace/Message
		hasher := md5.New()
		hasher.Write([]byte(payload.ExceptionType))
		hasher.Write([]byte(payload.ExceptionMessage))
		// Use clean path files if stacktrace is large
		hasher.Write([]byte(payload.Stacktrace))
		fingerprint = hex.EncodeToString(hasher.Sum(nil))
	}

	// Derive a consistent issue ID from the fingerprint
	fpBytes := md5.Sum([]byte(fingerprint))
	issueID, _ := uuid.FromBytes(fpBytes[:])
	eventID := uuid.New()
	timestamp := time.Now()

	// Set default environment/release if empty
	if payload.Environment == "" {
		payload.Environment = "production"
	}
	if payload.Release == "" {
		payload.Release = "unknown"
	}
	if payload.Breadcrumbs == "" {
		payload.Breadcrumbs = "[]"
	}

	// 5. Save Event to ClickHouse
	chQuery := `
		INSERT INTO events (
			event_id, project_id, issue_id, timestamp, environment, release, 
			exception_type, exception_message, stacktrace, breadcrumbs, tags, user_context, fingerprint
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	err = chConn.Exec(ctx, chQuery,
		eventID,
		projectID,
		issueID,
		timestamp,
		payload.Environment,
		payload.Release,
		payload.ExceptionType,
		payload.ExceptionMessage,
		payload.Stacktrace,
		payload.Breadcrumbs,
		payload.Tags,
		payload.UserContext,
		fingerprint,
	)

	if err != nil {
		log.Printf("Failed to insert event into ClickHouse: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error":"Failed to save event log"}`))
		return
	}

	// 6. Notify Event Broker / Worker to update issue metadata in PostgreSQL
	// We push a notification task to Redis list: `queue:events`
	notifyPayload := map[string]interface{}{
		"event_id":          eventID.String(),
		"project_id":        projectID.String(),
		"issue_id":          issueID.String(),
		"fingerprint":       fingerprint,
		"exception_type":    payload.ExceptionType,
		"exception_message": payload.ExceptionMessage,
		"stacktrace":        payload.Stacktrace,
		"environment":       payload.Environment,
		"timestamp":         timestamp.Format(time.RFC3339),
	}
	notifyJSON, _ := json.Marshal(notifyPayload)
	redisClient.LPush(ctx, "queue:events", notifyJSON)

	// Also increment counts in Redis cache for instant real-time stats
	statsKey := fmt.Sprintf("stats:issue:%s:count", issueID.String())
	redisClient.Incr(ctx, statsKey)
	redisClient.Set(ctx, fmt.Sprintf("stats:issue:%s:last_seen", issueID.String()), timestamp.Format(time.RFC3339), 0)

	// 7. Return success response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]string{
		"event_id": eventID.String(),
		"issue_id": issueID.String(),
		"status":   "accepted",
	})
}
