package repo

import (
	"time"

	"go-backend/internal/store/model"

	"gorm.io/gorm/clause"
)

func (r *Repository) ListOBSCodeAssignments() ([]model.OBSCodeAssignment, error) {
	if r == nil || r.db == nil {
		return nil, nil
	}
	var items []model.OBSCodeAssignment
	err := r.db.Order("updated_time DESC").Find(&items).Error
	return items, err
}

func (r *Repository) GetOBSCodeAssignment(userID int64) (*model.OBSCodeAssignment, error) {
	if r == nil || r.db == nil || userID <= 0 {
		return nil, nil
	}
	var item model.OBSCodeAssignment
	if err := r.db.Where("user_id = ?", userID).First(&item).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *Repository) SaveOBSCodeAssignment(item model.OBSCodeAssignment) error {
	if r == nil || r.db == nil || item.UserID <= 0 {
		return nil
	}
	item.UpdatedTime = time.Now().UnixMilli()
	return r.db.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "user_id"}},
		DoUpdates: clause.Assignments(map[string]interface{}{
			"user_name":    item.UserName,
			"push_code":    item.PushCode,
			"input_code":   item.InputCode,
			"remark":       item.Remark,
			"updated_time": item.UpdatedTime,
		}),
	}).Create(&item).Error
}

func (r *Repository) DeleteOBSCodeAssignment(userID int64) error {
	if r == nil || r.db == nil || userID <= 0 {
		return nil
	}
	return r.db.Delete(&model.OBSCodeAssignment{}, userID).Error
}
