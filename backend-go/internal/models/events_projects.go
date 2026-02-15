package models

import (
	"time"

	"gorm.io/gorm"
)

type Operation struct {
	ID                uint           `gorm:"primaryKey" json:"id"`
	Title             string         `gorm:"size:200" json:"title"`
	Description       string         `gorm:"type:text" json:"description"`
	Type              string         `gorm:"size:50" json:"type"`
	ScheduledAt       time.Time      `json:"scheduled_at"`
	EstimatedDuration int            `json:"estimated_duration"` // In minutes
	Status            string         `gorm:"size:50;default:'planning'" json:"status"`
	MaxParticipants   int            `json:"max_participants"`
	Requirements      string         `gorm:"type:text" json:"requirements"`
	RequiredRoles     string         `gorm:"type:json" json:"required_roles"`
	RequiredShipTypes string         `gorm:"type:json" json:"required_ship_types"`
	ObjectiveList     string         `gorm:"type:json" json:"objective_list"` // JSON array of {title, completed}
	CommsFrequency    string         `gorm:"size:100" json:"comms_frequency"`
	IntelURL          string         `gorm:"size:255" json:"intel_url"`
	SecurityLevel     string         `gorm:"size:50;default:'public'" json:"security_level"` // public, internal, restricted, classified
	Hazards           string         `gorm:"type:text" json:"hazards"`
	IsPublic          bool           `gorm:"default:true" json:"is_public"`
	CreatedByID       uint           `json:"created_by_id"`
	EventID           *uint          `gorm:"index" json:"event_id"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`

	Creator           User               `gorm:"foreignKey:CreatedByID" json:"-"`
	Participants      []OperationParticipant `gorm:"foreignKey:OperationID" json:"participants,omitempty"`
	SubLeaders        []OperationSubLeader   `gorm:"foreignKey:OperationID" json:"sub_leaders,omitempty"`
}

type OperationSubLeader struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	OperationID uint      `gorm:"index" json:"operation_id"`
	UserID      uint      `gorm:"index" json:"user_id"`
	RoleTitle   string    `gorm:"size:100" json:"role_title"`
	Status      string    `gorm:"size:20;default:'candidate'" json:"status"` // candidate, active, rejected
	JoinedAt    time.Time `json:"joined_at"`

	User User `gorm:"foreignKey:UserID" json:"user"`
}

type Event struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Title       string         `gorm:"size:200" json:"title"`
	Description string         `gorm:"type:text" json:"description"`
	StartTime   time.Time      `json:"start_time"`
	EndTime     *time.Time     `json:"end_time"`
	Location    string         `gorm:"size:200" json:"location"`
	Type        string         `gorm:"size:50" json:"type"` // Meeting, Operation, Social, Training
	CreatedByID uint           `json:"created_by_id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Creator User `gorm:"foreignKey:CreatedByID" json:"-"`
}

type OperationParticipant struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	OperationID    uint      `gorm:"index" json:"operation_id"`
	UserID         uint      `gorm:"index" json:"user_id"`
	ShipID         *uint     `json:"ship_id"`
	RolePreference string    `gorm:"size:100" json:"role_preference"`
	Status         string    `gorm:"size:20;default:'signed_up'" json:"status"`
	JoinedAt       time.Time `json:"joined_at"`

	User User `gorm:"foreignKey:UserID" json:"-"`
	Ship Ship `gorm:"foreignKey:ShipID" json:"-"`
}

type Project struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	Title            string         `gorm:"size:200" json:"title"`
	Description      string         `gorm:"type:text" json:"description"`
	Status           string         `gorm:"size:50;default:'planning'" json:"status"`
	ManagerID        uint           `gorm:"index" json:"manager_id"`
	StartDate        *time.Time     `json:"start_date"`
	TargetDate       *time.Time     `json:"target_date"`
	CompletedDate    *time.Time     `json:"completed_date"`
	CustomAttributes string         `gorm:"type:json" json:"custom_attributes"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`

	Manager           User               `gorm:"foreignKey:ManagerID" json:"-"`
	Phases            []ProjectPhase     `gorm:"foreignKey:ProjectID" json:"phases,omitempty"`
	ContributionGoals []ContributionGoal `gorm:"foreignKey:ProjectID" json:"contribution_goals,omitempty"`
}

type ProjectPhase struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	ProjectID   uint   `gorm:"index" json:"project_id"`
	Name        string `gorm:"size:100" json:"name"`
	Description string `gorm:"type:text" json:"description"`
	SortOrder   int    `gorm:"default:0" json:"sort_order"`

	Tasks []Task `gorm:"foreignKey:PhaseID" json:"tasks,omitempty"`
}

type Task struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	PhaseID     uint      `gorm:"index" json:"phase_id"`
	AssigneeID  *uint     `gorm:"index" json:"assignee_id"`
	Title       string    `gorm:"size:200" json:"title"`
	Description string    `gorm:"type:text" json:"description"`
	Status      string    `gorm:"size:50;default:'todo'" json:"status"`
	Priority    int       `gorm:"default:0" json:"priority"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Assignee User `gorm:"foreignKey:AssigneeID" json:"-"`
}

type ContributionGoal struct {
	ID            uint    `gorm:"primaryKey" json:"id"`
	ProjectID     uint    `gorm:"index" json:"project_id"`
	ResourceType  string  `gorm:"size:50" json:"resource_type"`
	TargetAmount  float64 `json:"target_amount"`
	CurrentAmount float64 `gorm:"default:0" json:"current_amount"`
	Unit          string  `gorm:"size:20;default:'units'" json:"unit"`

	Contributions []Contribution `gorm:"foreignKey:GoalID" json:"contributions,omitempty"`
}

type Contribution struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	GoalID    uint      `gorm:"index" json:"goal_id"`
	UserID    uint      `gorm:"index" json:"user_id"`
	Amount    float64   `json:"amount"`
	Notes     string    `gorm:"size:200" json:"notes"`
	CreatedAt time.Time `json:"created_at"`

	User User `gorm:"foreignKey:UserID" json:"-"`
}
