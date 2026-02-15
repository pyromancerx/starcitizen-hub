package main

import (
	"fmt"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/database"
	"github.com/pyromancerx/starcitizen-hub/backend-go/internal/models"
)

func main() {
	database.Connect()
	
	var sm models.ShipModel
	database.DB.Where("name LIKE ?", "%Arrow%").First(&sm)
	fmt.Printf("Ship: %s\n", sm.Name)
    fmt.Printf("Class: %s\n", sm.ClassName)
	fmt.Printf("Hardpoints: %s\n", sm.Hardpoints)
}
