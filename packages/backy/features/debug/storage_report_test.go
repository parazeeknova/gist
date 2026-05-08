package debug

import "testing"

func TestParseStorageObjectReference(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		raw        string
		wantBucket string
		wantKey    string
		wantOK     bool
	}{
		{
			name:   "data url ignored",
			raw:    "data:image/jpeg;base64,abc123",
			wantOK: false,
		},
		{
			name:       "path style url",
			raw:        "http://localhost:9000/avatars-workspaces/123/avatar.jpg",
			wantBucket: "avatars-workspaces",
			wantKey:    "123/avatar.jpg",
			wantOK:     true,
		},
		{
			name:       "virtual host style url",
			raw:        "https://avatars-spaces.storage.local/folder/icon.png?signature=1",
			wantBucket: "avatars-spaces",
			wantKey:    "folder/icon.png",
			wantOK:     true,
		},
		{
			name:       "plain bucket path",
			raw:        "avatars-profiles/user-1.png",
			wantBucket: "avatars-profiles",
			wantKey:    "user-1.png",
			wantOK:     true,
		},
		{
			name:   "unknown bucket ignored",
			raw:    "https://example.com/uploads/avatar.png",
			wantOK: false,
		},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			gotBucket, gotKey, gotOK := parseStorageObjectReference(tc.raw)
			if gotOK != tc.wantOK {
				t.Fatalf("ok mismatch: got %v, want %v", gotOK, tc.wantOK)
			}
			if gotBucket != tc.wantBucket {
				t.Fatalf("bucket mismatch: got %q, want %q", gotBucket, tc.wantBucket)
			}
			if gotKey != tc.wantKey {
				t.Fatalf("key mismatch: got %q, want %q", gotKey, tc.wantKey)
			}
		})
	}
}
