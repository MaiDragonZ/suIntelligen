package auth

import (
	"errors"
	"sync"
	"time"

	"golang.org/x/crypto/bcrypt"
	"su-intelligence/internal/models"
)

type UserStore struct {
	mu    sync.RWMutex
	users map[string]*models.User
	seq   uint
}

func NewUserStore() *UserStore {
	s := &UserStore{users: make(map[string]*models.User)}
	s.seed()
	return s
}

func (s *UserStore) seed() {
	hash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	s.seq++
	s.users["admin@su.ai"] = &models.User{
		ID: s.seq, Name: "Admin User", Email: "admin@su.ai",
		Password: string(hash), Role: models.RoleAdmin,
		Active: true, CreatedAt: time.Now(), UpdatedAt: time.Now(),
	}
	hash2, _ := bcrypt.GenerateFromPassword([]byte("user1234"), bcrypt.DefaultCost)
	s.seq++
	s.users["demo@su.ai"] = &models.User{
		ID: s.seq, Name: "Demo User", Email: "demo@su.ai",
		Password: string(hash2), Role: models.RoleViewer,
		Active: true, CreatedAt: time.Now(), UpdatedAt: time.Now(),
	}
}

func (s *UserStore) FindByEmail(email string) (*models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	u, ok := s.users[email]
	if !ok {
		return nil, errors.New("user not found")
	}
	return u, nil
}

func (s *UserStore) FindByID(id uint) (*models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, u := range s.users {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, errors.New("user not found")
}

func (s *UserStore) All() []*models.User {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]*models.User, 0, len(s.users))
	for _, u := range s.users {
		out = append(out, u)
	}
	return out
}

func (s *UserStore) CheckPassword(user *models.User, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)) == nil
}

func (s *UserStore) UpdatePassword(email, newPassword string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	u, ok := s.users[email]
	if !ok {
		return errors.New("user not found")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hash)
	u.UpdatedAt = time.Now()
	return nil
}
