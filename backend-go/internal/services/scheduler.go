package services

import (
	"log"
	"os"
	"os/exec"
	"runtime"
	"strings"

	"github.com/robfig/cron/v3"
	"gorm.io/gorm"
)

type SchedulerService struct {
	db                  *gorm.DB
	cron                *cron.Cron
	gameDataService     *GameDataService
	rsiSyncService      *RSISyncService
	notificationService *NotificationService
}

func NewSchedulerService(db *gorm.DB) *SchedulerService {
	return &SchedulerService{
		db:                  db,
		cron:                cron.New(),
		gameDataService:     NewGameDataService(db),
		rsiSyncService:      NewRSISyncService(db),
		notificationService: NewNotificationService(db),
	}
}

func (s *SchedulerService) Start() {
	// 1. Nightly Auto-Update (03:00 AM)
	s.cron.AddFunc("0 3 * * *", s.AutoUpdate)

	// 2. Weekly RSI Member Sync (Sunday 04:00 AM)
	s.cron.AddFunc("0 4 * * 0", s.RSIMemberSync)

	// 3. Weekly Game Data Sync (Saturday 04:00 AM)
	s.cron.AddFunc("0 4 * * 6", s.GameDataSync)

	s.cron.Start()
	log.Println("Background scheduler initialized and started")
}

func (s *SchedulerService) AutoUpdate() {
	log.Println("Checking for hub updates...")
	
	// Check for git repository
	if _, err := os.Stat("../.git"); os.IsNotExist(err) {
		log.Println("Not a git repository, skipping auto-update")
		return
	}

	// Fetch updates
	cmdFetch := exec.Command("git", "fetch", "origin")
	cmdFetch.Dir = ".."
	if err := cmdFetch.Run(); err != nil {
		log.Printf("Auto-update fetch failed: %v", err)
		return
	}

	// Compare HEAD and origin/main
	cmdRevParseLocal := exec.Command("git", "rev-parse", "HEAD")
	cmdRevParseLocal.Dir = ".."
	localOut, _ := cmdRevParseLocal.Output()

	cmdRevParseRemote := exec.Command("git", "rev-parse", "origin/main")
	cmdRevParseRemote.Dir = ".."
	remoteOut, _ := cmdRevParseRemote.Output()

	if strings.TrimSpace(string(localOut)) == strings.TrimSpace(string(remoteOut)) {
		log.Println("Hub is already up to date")
		return
	}

	log.Println("New version detected, applying updates...")

	// Pull changes
	cmdPull := exec.Command("git", "reset", "--hard", "origin/main")
	cmdPull.Dir = ".."
	if err := cmdPull.Run(); err != nil {
		log.Printf("Auto-update pull failed: %v", err)
		return
	}

	// Check for dependency changes
	cmdDiff := exec.Command("git", "diff", "HEAD@{1}", "HEAD", "--", "backend-go/go.mod")
	cmdDiff.Dir = ".."
	diffOut, _ := cmdDiff.Output()
	if len(diffOut) > 0 && strings.Contains(string(diffOut), "+") {
		log.Println("New dependencies detected in go.mod")
		// Extract new dependencies for the alert
		lines := strings.Split(string(diffOut), "\n")
		var newLibs []string
		for _, line := range lines {
			if strings.HasPrefix(line, "+") && !strings.HasPrefix(line, "+++") && strings.Contains(line, "/") {
				newLibs = append(newLibs, strings.TrimSpace(line[1:]))
			}
		}
		
		if len(newLibs) > 0 {
			msg := "The hub was automatically updated and requires new Go libraries: \n" + strings.Join(newLibs, "\n")
			s.notificationService.AlertAdmins("Dependency Update Required", msg)
			
			// Try to tidy/download automatically
			log.Println("Running go mod tidy...")
			exec.Command("go", "mod", "tidy").Run()
		}
	}

	// Rebuild backend
	// We use the same name for the binary to replace it
	var binaryName string
	if runtime.GOOS == "windows" {
		binaryName = "server.exe"
	} else {
		binaryName = "server"
	}

	log.Println("Rebuilding backend binary...")
	cmdBuild := exec.Command("go", "build", "-o", binaryName, "./cmd/server/main.go")
	// cmdBuild.Dir should be backend-go, which is where we are usually running from or we can specify it
	if err := cmdBuild.Run(); err != nil {
		log.Printf("Auto-update rebuild failed: %v", err)
		return
	}

	log.Println("Update applied successfully. Restarting process...")
	
	// Exit and let systemd/pm2 restart us
	os.Exit(0)
}

func (s *SchedulerService) RSIMemberSync() {
	log.Println("Starting scheduled RSI member sync...")
	if err := s.rsiSyncService.SyncOrganizationMembers(); err != nil {
		log.Printf("Scheduled RSI sync failed: %v", err)
	}
}

func (s *SchedulerService) GameDataSync() {
	log.Println("Starting scheduled Game Data sync...")
	if err := s.gameDataService.SyncFromCommunityData(); err != nil {
		log.Printf("Scheduled Game Data sync failed: %v", err)
	}
}
