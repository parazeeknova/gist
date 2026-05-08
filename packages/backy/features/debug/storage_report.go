package debug

import (
	"context"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/jackc/pgx/v5/pgxpool"

	"verso/backy/shared/storage"
)

var avatarBuckets = []string{
	"avatars-workspaces",
	"avatars-spaces",
	"avatars-profiles",
}

type storageOrphanBucketReport struct {
	Bucket            string   `json:"bucket"`
	OrphanObjectCount int      `json:"orphanObjectCount"`
	OrphanSample      []string `json:"orphanSample"`
	ReferencedCount   int      `json:"referencedCount"`
	TotalObjectCount  int      `json:"totalObjectCount"`
}

type storageOrphanReport struct {
	GeneratedAtUTC    string                      `json:"generatedAtUtc"`
	TotalBuckets      int                         `json:"totalBuckets"`
	TotalObjectCount  int                         `json:"totalObjectCount"`
	TotalOrphanCount  int                         `json:"totalOrphanCount"`
	TotalReferenceSet int                         `json:"totalReferenceSet"`
	Buckets           []storageOrphanBucketReport `json:"buckets"`
}

type storageObjectItem struct {
	Bucket string `json:"bucket"`
	Key    string `json:"key"`
}

type storageBucketObjects struct {
	Bucket      string              `json:"bucket"`
	ObjectCount int                 `json:"objectCount"`
	Objects     []storageObjectItem `json:"objects"`
	Truncated   bool                `json:"truncated"`
}

type storageObjectsResponse struct {
	Buckets          []storageBucketObjects `json:"buckets"`
	GeneratedAtUTC   string                 `json:"generatedAtUtc"`
	TotalBucketCount int                    `json:"totalBucketCount"`
	TotalObjectCount int                    `json:"totalObjectCount"`
}

const maxStorageObjectKeys = 1000

func buildStorageOrphanReport(ctx context.Context, pool *pgxpool.Pool) (storageOrphanReport, error) {
	references, err := collectReferencedObjects(ctx, pool)
	if err != nil {
		return storageOrphanReport{}, err
	}

	client, err := storage.NewClient()
	if err != nil {
		return storageOrphanReport{}, fmt.Errorf("create storage client: %w", err)
	}

	report := storageOrphanReport{
		Buckets:        make([]storageOrphanBucketReport, 0, len(avatarBuckets)),
		GeneratedAtUTC: time.Now().UTC().Format(time.RFC3339),
		TotalBuckets:   len(avatarBuckets),
	}

	for _, bucket := range avatarBuckets {
		objects, err := listBucketObjectKeys(ctx, client.S3(), bucket)
		if err != nil {
			return storageOrphanReport{}, fmt.Errorf("list bucket %q: %w", bucket, err)
		}

		referencedKeys := references[bucket]
		if referencedKeys == nil {
			referencedKeys = map[string]struct{}{}
		}

		orphanSample := make([]string, 0, 20)
		orphanCount := 0
		for _, key := range objects {
			if _, ok := referencedKeys[key]; ok {
				continue
			}

			orphanCount++
			if len(orphanSample) < 20 {
				orphanSample = append(orphanSample, key)
			}
		}

		report.TotalObjectCount += len(objects)
		report.TotalOrphanCount += orphanCount
		report.TotalReferenceSet += len(referencedKeys)

		report.Buckets = append(report.Buckets, storageOrphanBucketReport{
			Bucket:            bucket,
			OrphanObjectCount: orphanCount,
			OrphanSample:      orphanSample,
			ReferencedCount:   len(referencedKeys),
			TotalObjectCount:  len(objects),
		})
	}

	return report, nil
}

func collectReferencedObjects(ctx context.Context, pool *pgxpool.Pool) (map[string]map[string]struct{}, error) {
	rows, err := pool.Query(ctx, `
		SELECT icon FROM workspaces WHERE deleted_at IS NULL AND icon <> ''
		UNION ALL
		SELECT icon FROM spaces WHERE deleted_at IS NULL AND icon <> ''
		UNION ALL
		SELECT avatar_url FROM users WHERE avatar_url <> ''
	`)
	if err != nil {
		return nil, fmt.Errorf("query referenced image URLs: %w", err)
	}
	defer rows.Close()

	references := map[string]map[string]struct{}{}
	for rows.Next() {
		var raw string
		if err := rows.Scan(&raw); err != nil {
			return nil, fmt.Errorf("scan referenced image URL: %w", err)
		}

		bucket, key, ok := parseStorageObjectReference(raw)
		if !ok {
			continue
		}

		if references[bucket] == nil {
			references[bucket] = map[string]struct{}{}
		}
		references[bucket][key] = struct{}{}
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate referenced image URLs: %w", err)
	}

	return references, nil
}

func listBucketObjectKeys(ctx context.Context, client *s3.Client, bucket string) ([]string, error) {
	paginator := s3.NewListObjectsV2Paginator(client, &s3.ListObjectsV2Input{
		Bucket: aws.String(bucket),
	})

	keys := []string{}
	for paginator.HasMorePages() {
		page, err := paginator.NextPage(ctx)
		if err != nil {
			return nil, err
		}

		for _, object := range page.Contents {
			if object.Key == nil {
				continue
			}
			keys = append(keys, *object.Key)
		}
	}

	return keys, nil
}

func parseStorageObjectReference(raw string) (bucket, key string, ok bool) {
	candidate := strings.TrimSpace(raw)
	if candidate == "" {
		return "", "", false
	}
	if strings.HasPrefix(strings.ToLower(candidate), "data:") {
		return "", "", false
	}

	if strings.Contains(candidate, "://") {
		parsed, err := url.Parse(candidate)
		if err == nil {
			hostBucket := bucketFromHost(parsed.Hostname())
			if hostBucket != "" {
				hostKey := strings.TrimPrefix(parsed.Path, "/")
				if hostKey != "" {
					return hostBucket, hostKey, true
				}
			}

			pathBucket, pathKey, pathOK := bucketAndKeyFromPath(parsed.Path)
			if pathOK {
				return pathBucket, pathKey, true
			}
		}
	}

	return bucketAndKeyFromPath(candidate)
}

func buildStorageObjectsResponse(ctx context.Context) (storageObjectsResponse, error) {
	client, err := storage.NewClient()
	if err != nil {
		return storageObjectsResponse{}, fmt.Errorf("create storage client: %w", err)
	}

	response := storageObjectsResponse{
		Buckets:          make([]storageBucketObjects, 0, len(avatarBuckets)),
		GeneratedAtUTC:   time.Now().UTC().Format(time.RFC3339),
		TotalBucketCount: len(avatarBuckets),
	}

	for _, bucket := range avatarBuckets {
		keys, err := listBucketObjectKeys(ctx, client.S3(), bucket)
		if err != nil {
			return storageObjectsResponse{}, fmt.Errorf("list bucket %q: %w", bucket, err)
		}

		totalCount := len(keys)
		truncated := totalCount > maxStorageObjectKeys
		if truncated {
			keys = keys[:maxStorageObjectKeys]
		}

		objects := make([]storageObjectItem, 0, len(keys))
		for _, key := range keys {
			objects = append(objects, storageObjectItem{
				Bucket: bucket,
				Key:    key,
			})
		}

		response.TotalObjectCount += totalCount
		response.Buckets = append(response.Buckets, storageBucketObjects{
			Bucket:      bucket,
			ObjectCount: totalCount,
			Objects:     objects,
			Truncated:   truncated,
		})
	}

	return response, nil
}

func bucketAndKeyFromPath(path string) (bucket, key string, ok bool) {
	trimmed := strings.TrimPrefix(strings.TrimSpace(path), "/")
	if trimmed == "" {
		return "", "", false
	}

	parts := strings.Split(trimmed, "/")
	if len(parts) < 2 {
		return "", "", false
	}

	bucket = parts[0]
	if !isAvatarBucket(bucket) {
		return "", "", false
	}

	key = strings.Join(parts[1:], "/")
	if key == "" {
		return "", "", false
	}

	return bucket, key, true
}

func bucketFromHost(host string) string {
	if host == "" {
		return ""
	}

	parts := strings.Split(host, ".")
	if len(parts) < 2 {
		return ""
	}

	candidate := parts[0]
	if isAvatarBucket(candidate) {
		return candidate
	}

	return ""
}

func isAvatarBucket(bucket string) bool {
	for _, known := range avatarBuckets {
		if bucket == known {
			return true
		}
	}
	return false
}
