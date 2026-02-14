package services

import (
	"fmt"
	"net/smtp"
	"strconv"

	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
	"gorm.io/gorm"
)

type MailService struct {
	db *gorm.DB
}

func NewMailService(db *gorm.DB) *MailService {
	return &MailService{db: db}
}

func (s *MailService) SendEmail(to, subject, body string) error {
	settings, err := s.getSMTPSettings()
	if err != nil {
		return err
	}

	if settings["smtp_host"] == "" {
		return fmt.Errorf("SMTP not configured")
	}

	auth := smtp.PlainAuth("", settings["smtp_user"], settings["smtp_pass"], settings["smtp_host"])
	
	msg := fmt.Sprintf("From: %s
"+
		"To: %s
"+
		"Subject: %s
"+
		"MIME-version: 1.0;
Content-Type: text/html; charset="UTF-8";

"+
		"%s", settings["smtp_from"], to, subject, body)

	addr := settings["smtp_host"] + ":" + settings["smtp_port"]
	return smtp.SendMail(addr, auth, settings["smtp_from"], []string{to}, []byte(msg))
}

func (s *MailService) getSMTPSettings() (map[string]string, error) {
	var dbSettings []models.SystemSetting
	err := s.db.Where("key LIKE ?", "smtp_%").Find(&dbSettings).Error
	if err != nil {
		return nil, err
	}

	mapped := make(map[string]string)
	for _, s := range dbSettings {
		mapped[s.key] = s.value
	}
	return mapped, nil
}
