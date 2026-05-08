package notification

import (
	"encoding/json"
	"sync"

	"verso/backy/database/models"
)

// NotificationHub is an in-memory pub/sub hub that streams new notifications
// to subscribed SSE connections keyed by user ID.
type NotificationHub struct {
	mu   sync.RWMutex
	subs map[string]map[chan string]struct{} // userID → set of channels
}

// NewNotificationHub creates a new notification hub.
func NewNotificationHub() *NotificationHub {
	return &NotificationHub{
		subs: make(map[string]map[chan string]struct{}),
	}
}

// Subscribe registers a channel for a user. Returns the unsubscribe function.
func (h *NotificationHub) Subscribe(userID string, ch chan string) func() {
	h.mu.Lock()
	if h.subs[userID] == nil {
		h.subs[userID] = make(map[chan string]struct{})
	}
	h.subs[userID][ch] = struct{}{}
	h.mu.Unlock()

	return func() {
		h.mu.Lock()
		delete(h.subs[userID], ch)
		if len(h.subs[userID]) == 0 {
			delete(h.subs, userID)
		}
		h.mu.Unlock()
	}
}

// Publish sends a notification to all subscribers for the given user.
func (h *NotificationHub) Publish(userID string, notif models.NotificationWithActor) {
	data, err := json.Marshal(notif)
	if err != nil {
		return
	}
	msg := string(data)

	h.mu.RLock()
	channels := h.subs[userID]
	h.mu.RUnlock()

	for ch := range channels {
		select {
		case ch <- msg:
		default:
			// drop if channel buffer is full (slow client)
		}
	}
}
