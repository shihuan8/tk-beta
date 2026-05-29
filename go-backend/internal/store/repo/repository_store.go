package repo

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"go-backend/internal/store/model"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type BalanceWithUser struct {
	UserID      int64   `json:"userId"`
	UserName    string  `json:"userName"`
	Balance     float64 `json:"balance"`
	UpdatedTime int64   `json:"updatedTime"`
}

type UserPlanView struct {
	ID           int64   `json:"id"`
	UserID       int64   `json:"userId"`
	PlanID       int64   `json:"planId"`
	PlanName     string  `json:"planName"`
	TrafficQuota int64   `json:"trafficQuota"`
	SpeedLimit   int64   `json:"speedLimit"`
	RuleQuota    int     `json:"ruleQuota"`
	DurationDays int     `json:"durationDays"`
	UserGroupID  int64   `json:"userGroupId"`
	Price        float64 `json:"price"`
	StartTime    int64   `json:"startTime"`
	EndTime      int64   `json:"endTime"`
	Status       int     `json:"status"`
	TrafficUsed  int64   `json:"trafficUsed"`
	CreatedTime  int64   `json:"createdTime"`
}

type UserPackagePermission struct {
	ID          int64    `json:"id"`
	UserGroupID int64    `json:"userGroupId"`
	Name        string   `json:"name"`
	TunnelNames []string `json:"tunnelNames"`
	FlowLimit   int64    `json:"flowLimit"`
	SpeedLimit  int64    `json:"speedLimit"`
	RuleQuota   int      `json:"ruleQuota"`
	TrafficUsed int64    `json:"trafficUsed"`
	StartTime   int64    `json:"startTime"`
	ExpTime     int64    `json:"expTime"`
	Status      int      `json:"status"`
	Source      string   `json:"source"`
}

type OrderQuery struct {
	Status  int
	Page    int
	Size    int
	Keyword string
	UserID  int64
}

func (r *Repository) ListPlans() ([]model.Plan, error) {
	if r == nil || r.db == nil {
		return nil, nil
	}
	var plans []model.Plan
	if err := r.db.Order("id ASC").Find(&plans).Error; err != nil {
		return nil, err
	}
	return r.attachPlanTunnelGroupIDs(plans)
}

func (r *Repository) ListAvailablePlans() ([]model.Plan, error) {
	if r == nil || r.db == nil {
		return nil, nil
	}
	var plans []model.Plan
	if err := r.db.Where("status = 1").Order("price ASC, id ASC").Find(&plans).Error; err != nil {
		return nil, err
	}
	return r.attachPlanTunnelGroupIDs(plans)
}

func (r *Repository) GetPlan(id int64) (*model.Plan, error) {
	if r == nil || r.db == nil || id <= 0 {
		return nil, nil
	}
	var plan model.Plan
	err := r.db.First(&plan, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	ids, err := r.GetPlanTunnelGroupIDs(plan.ID)
	if err != nil {
		return nil, err
	}
	plan.TunnelGroupIDs = ids
	return &plan, nil
}

func (r *Repository) CreatePlan(plan *model.Plan) error {
	if r == nil || r.db == nil {
		return nil
	}
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(plan).Error; err != nil {
			return err
		}
		return replacePlanTunnelGroupsTx(tx, plan.ID, plan.TunnelGroupIDs)
	})
}

func (r *Repository) UpdatePlan(plan *model.Plan) error {
	if r == nil || r.db == nil {
		return nil
	}
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(plan).Error; err != nil {
			return err
		}
		return replacePlanTunnelGroupsTx(tx, plan.ID, plan.TunnelGroupIDs)
	})
}

func (r *Repository) DeletePlan(id int64) error {
	if r == nil || r.db == nil || id <= 0 {
		return nil
	}
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("plan_id = ?", id).Delete(&model.PlanTunnelGroup{}).Error; err != nil {
			return err
		}
		return tx.Delete(&model.Plan{}, id).Error
	})
}

func (r *Repository) GetPlanTunnelGroupIDs(planID int64) ([]int64, error) {
	if r == nil || r.db == nil || planID <= 0 {
		return nil, nil
	}
	var rows []model.PlanTunnelGroup
	if err := r.db.Where("plan_id = ?", planID).Find(&rows).Error; err != nil {
		return nil, err
	}
	ids := make([]int64, 0, len(rows))
	for _, row := range rows {
		ids = append(ids, row.TunnelGroupID)
	}
	return ids, nil
}

func (r *Repository) attachPlanTunnelGroupIDs(plans []model.Plan) ([]model.Plan, error) {
	if len(plans) == 0 {
		return plans, nil
	}
	planIDs := make([]int64, 0, len(plans))
	for _, plan := range plans {
		planIDs = append(planIDs, plan.ID)
	}
	var rows []model.PlanTunnelGroup
	if err := r.db.Where("plan_id IN ?", planIDs).Find(&rows).Error; err != nil {
		return nil, err
	}
	idsByPlan := make(map[int64][]int64, len(plans))
	for _, row := range rows {
		idsByPlan[row.PlanID] = append(idsByPlan[row.PlanID], row.TunnelGroupID)
	}
	for i := range plans {
		plans[i].TunnelGroupIDs = idsByPlan[plans[i].ID]
	}
	return plans, nil
}

func replacePlanTunnelGroupsTx(tx *gorm.DB, planID int64, tunnelGroupIDs []int64) error {
	if err := tx.Where("plan_id = ?", planID).Delete(&model.PlanTunnelGroup{}).Error; err != nil {
		return err
	}
	seen := make(map[int64]struct{}, len(tunnelGroupIDs))
	rows := make([]model.PlanTunnelGroup, 0, len(tunnelGroupIDs))
	for _, tunnelGroupID := range tunnelGroupIDs {
		if tunnelGroupID <= 0 {
			continue
		}
		if _, ok := seen[tunnelGroupID]; ok {
			continue
		}
		seen[tunnelGroupID] = struct{}{}
		rows = append(rows, model.PlanTunnelGroup{PlanID: planID, TunnelGroupID: tunnelGroupID})
	}
	if len(rows) == 0 {
		return nil
	}
	return tx.Create(&rows).Error
}

func (r *Repository) GetUserBalance(userID int64) (*model.UserBalance, error) {
	if r == nil || r.db == nil || userID <= 0 {
		return nil, nil
	}
	var balance model.UserBalance
	err := r.db.First(&balance, userID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &model.UserBalance{UserID: userID, Balance: 0}, nil
		}
		return nil, err
	}
	return &balance, nil
}

func (r *Repository) SetUserBalance(userID int64, balance float64) error {
	if r == nil || r.db == nil || userID <= 0 {
		return nil
	}
	now := time.Now().UnixMilli()
	return r.db.Transaction(func(tx *gorm.DB) error {
		var count int64
		var before float64
		var user model.User
		if err := tx.Select("id", "user").First(&user, userID).Error; err != nil {
			return err
		}
		var existing model.UserBalance
		if err := tx.First(&existing, userID).Error; err == nil {
			before = existing.Balance
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		if err := tx.Model(&model.UserBalance{}).Where("user_id = ?", userID).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			if err := tx.Create(&model.UserBalance{UserID: userID, Balance: balance, UpdatedTime: now}).Error; err != nil {
				return err
			}
		} else if err := tx.Model(&model.UserBalance{}).Where("user_id = ?", userID).Updates(map[string]interface{}{
			"balance":      balance,
			"updated_time": now,
		}).Error; err != nil {
			return err
		}
		if before == balance {
			return nil
		}
		return tx.Create(&model.BalanceLog{
			UserID:        userID,
			UserName:      user.User,
			Amount:        balance - before,
			BalanceBefore: before,
			BalanceAfter:  balance,
			Reason:        "管理员设置支付余额",
			CreatedTime:   now,
			Signature:     "1",
		}).Error
	})
}

func (r *Repository) ListUserBalances() ([]BalanceWithUser, error) {
	if r == nil || r.db == nil {
		return nil, nil
	}
	var users []model.User
	if err := r.db.Where("role_id != ?", 0).Order("id ASC").Find(&users).Error; err != nil {
		return nil, err
	}
	var balances []model.UserBalance
	if err := r.db.Order("user_id ASC").Find(&balances).Error; err != nil {
		return nil, err
	}
	balanceByUser := make(map[int64]model.UserBalance, len(balances))
	for _, balance := range balances {
		balanceByUser[balance.UserID] = balance
	}
	result := make([]BalanceWithUser, 0, len(users))
	for _, user := range users {
		item := BalanceWithUser{UserID: user.ID, UserName: user.User}
		if balance, ok := balanceByUser[user.ID]; ok {
			item.Balance = balance.Balance
			item.UpdatedTime = balance.UpdatedTime
		}
		result = append(result, item)
	}
	return result, nil
}

func (r *Repository) PurchasePlan(userID, planID int64) (*model.UserPlan, error) {
	if r == nil || r.db == nil || userID <= 0 || planID <= 0 {
		return nil, errors.New("invalid purchase request")
	}
	now := time.Now().UnixMilli()
	var created model.UserPlan
	err := r.db.Transaction(func(tx *gorm.DB) error {
		var plan model.Plan
		if err := tx.Where("id = ? AND status = 1", planID).First(&plan).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("套餐不存在或已下架")
			}
			return err
		}

		var balance model.UserBalance
		if err := tx.First(&balance, userID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("余额不足")
			}
			return err
		}
		if balance.Balance < plan.Price {
			return errors.New("余额不足")
		}

		before := balance.Balance
		after := balance.Balance - plan.Price
		if err := tx.Model(&model.UserBalance{}).Where("user_id = ?", userID).Updates(map[string]interface{}{
			"balance":      gorm.Expr("balance - ?", plan.Price),
			"updated_time": now,
		}).Error; err != nil {
			return err
		}
		var user model.User
		if err := tx.Select("id", "user").First(&user, userID).Error; err != nil {
			return err
		}
		if err := tx.Create(&model.BalanceLog{
			UserID:        userID,
			UserName:      user.User,
			Amount:        -plan.Price,
			BalanceBefore: before,
			BalanceAfter:  after,
			Reason:        "余额购买套餐:" + plan.Name,
			CreatedTime:   now,
			Signature:     "1",
		}).Error; err != nil {
			return err
		}
		meta, _ := json.Marshal(map[string]interface{}{
			"planId":        plan.ID,
			"trafficQuota":  plan.TrafficQuota,
			"speedLimit":    plan.SpeedLimit,
			"ruleQuota":     plan.RuleQuota,
			"durationDays":  plan.DurationDays,
			"userGroupId":   plan.UserGroupID,
			"tunnelGroupIds": plan.TunnelGroupIDs,
		})
		if err := tx.Create(&model.Order{
			OrderNo:     nextOrderNo(),
			UserID:      userID,
			UserName:    user.User,
			ProductID:   plan.ID,
			ProductName: plan.Name,
			ProductType: "plan",
			ProductMeta: string(meta),
			Amount:      int64(plan.Price * 100),
			PayCurrency: "BALANCE",
			Status:      1,
			PayTime:     now / 1000,
			CreatedAt:   now / 1000,
			UpdatedAt:   now / 1000,
		}).Error; err != nil {
			return err
		}
		if plan.UserGroupID > 0 {
			if err := tx.Where("user_id = ?", userID).Delete(&model.UserGroupUser{}).Error; err != nil {
				return err
			}
			if err := tx.Create(&model.UserGroupUser{UserGroupID: plan.UserGroupID, UserID: userID, CreatedTime: now}).Error; err != nil {
				return err
			}
		}
		tunnelIDs, err := getTunnelsInPlanGroupsTx(tx, plan.ID)
		if err != nil {
			return err
		}

		endTime := int64(0)
		if plan.DurationDays > 0 {
			endTime = now + int64(plan.DurationDays)*24*60*60*1000
		}
		if err := tx.Model(&model.UserPlan{}).
			Where("user_id = ? AND status = 1", userID).
			Updates(map[string]interface{}{"status": 2}).Error; err != nil {
			return err
		}
		if err := tx.Model(&model.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
			"flow":            planTrafficQuotaGB(plan),
			"in_flow":         0,
			"out_flow":        0,
			"num":             plan.RuleQuota,
			"exp_time":        endTime,
			"flow_reset_time": int64(0),
			"updated_time":    sql.NullInt64{Int64: now, Valid: true},
		}).Error; err != nil {
			return err
		}
		if err := grantPlanTunnelsTx(tx, userID, tunnelIDs, plan, endTime); err != nil {
			return err
		}
		created = model.UserPlan{
			UserID:      userID,
			PlanID:      plan.ID,
			StartTime:   now,
			EndTime:     endTime,
			Status:      1,
			TrafficUsed: 0,
			CreatedTime: now,
		}
		return tx.Create(&created).Error
	})
	if err != nil {
		return nil, err
	}
	return &created, nil
}

func nextOrderNo() string {
	now := time.Now()
	return fmt.Sprintf("ZX%d%04d", now.UnixMilli(), now.Nanosecond()%10000)
}

func (r *Repository) ListAllOrders(query OrderQuery) ([]model.Order, int64, error) {
	if r == nil || r.db == nil {
		return nil, 0, nil
	}
	if query.Page < 1 {
		query.Page = 1
	}
	if query.Size < 1 || query.Size > 100 {
		query.Size = 10
	}
	db := r.db.Model(&model.Order{})
	if query.UserID > 0 {
		db = db.Where("user_id = ?", query.UserID)
	}
	if query.Status >= 0 {
		db = db.Where("status = ?", query.Status)
	}
	if query.Keyword != "" {
		like := "%" + query.Keyword + "%"
		db = db.Where("order_no LIKE ? OR user_name LIKE ? OR product_name LIKE ?", like, like, like)
	}
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var list []model.Order
	if err := db.Order("id DESC").Offset((query.Page - 1) * query.Size).Limit(query.Size).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *Repository) GetOrder(id int64) (*model.Order, error) {
	if r == nil || r.db == nil || id <= 0 {
		return nil, errors.New("invalid order id")
	}
	var order model.Order
	if err := r.db.First(&order, id).Error; err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *Repository) UpdateOrder(id int64, updates map[string]interface{}) error {
	if r == nil || r.db == nil || id <= 0 {
		return nil
	}
	updates["updated_at"] = time.Now().Unix()
	return r.db.Model(&model.Order{}).Where("id = ?", id).Updates(updates).Error
}

func (r *Repository) DeleteOrder(id int64) error {
	if r == nil || r.db == nil || id <= 0 {
		return nil
	}
	return r.db.Delete(&model.Order{}, id).Error
}

func (r *Repository) RefundOrder(id int64) error {
	if r == nil || r.db == nil || id <= 0 {
		return nil
	}
	return r.db.Transaction(func(tx *gorm.DB) error {
		var order model.Order
		if err := tx.First(&order, id).Error; err != nil {
			return err
		}
		if order.Status != 1 {
			return errors.New("只有已完成订单才能退款")
		}
		var balance model.UserBalance
		before := float64(0)
		if err := tx.First(&balance, order.UserID).Error; err == nil {
			before = balance.Balance
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		after := before + float64(order.Amount)/100
		now := time.Now().UnixMilli()
		if err := tx.Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "user_id"}},
			DoUpdates: clause.Assignments(map[string]interface{}{
				"balance":      after,
				"updated_time": now,
			}),
		}).Create(&model.UserBalance{UserID: order.UserID, Balance: after, UpdatedTime: now}).Error; err != nil {
			return err
		}
		if err := tx.Create(&model.BalanceLog{
			UserID:        order.UserID,
			UserName:      order.UserName,
			Amount:        float64(order.Amount) / 100,
			BalanceBefore: before,
			BalanceAfter:  after,
			Reason:        "订单退款:" + order.ProductName,
			CreatedTime:   now,
			Signature:     "1",
		}).Error; err != nil {
			return err
		}
		if order.ProductType == "plan" {
			planID := order.ProductID
			if planID <= 0 && order.ProductMeta != "" {
				var meta struct {
					PlanID int64 `json:"planId"`
				}
				if err := json.Unmarshal([]byte(order.ProductMeta), &meta); err == nil {
					planID = meta.PlanID
				}
			}
			if planID > 0 {
				if err := tx.Model(&model.UserPlan{}).
					Where("user_id = ? AND plan_id = ? AND status = 1", order.UserID, planID).
					Updates(map[string]interface{}{"status": 3}).Error; err != nil {
					return err
				}
				tunnelIDs, err := getTunnelsInPlanGroupsTx(tx, planID)
				if err != nil {
					return err
				}
				if len(tunnelIDs) > 0 {
					if err := tx.Where("user_id = ? AND tunnel_id IN ?", order.UserID, tunnelIDs).Delete(&model.UserTunnel{}).Error; err != nil {
						return err
					}
				}
			}
			if err := tx.Model(&model.User{}).Where("id = ?", order.UserID).Updates(map[string]interface{}{
				"flow":            0,
				"num":             0,
				"flow_reset_time": 0,
				"exp_time":        int64(0),
				"updated_time":    sql.NullInt64{Int64: now, Valid: true},
			}).Error; err != nil {
				return err
			}
		}
		return tx.Model(&model.Order{}).Where("id = ?", id).Updates(map[string]interface{}{
			"status":     3,
			"updated_at": now / 1000,
		}).Error
	})
}

func getTunnelsInPlanGroupsTx(tx *gorm.DB, planID int64) ([]int64, error) {
	var groupRows []model.PlanTunnelGroup
	if err := tx.Where("plan_id = ?", planID).Find(&groupRows).Error; err != nil {
		return nil, err
	}
	if len(groupRows) == 0 {
		return nil, nil
	}
	groupIDs := make([]int64, 0, len(groupRows))
	for _, row := range groupRows {
		groupIDs = append(groupIDs, row.TunnelGroupID)
	}
	var tunnelIDs []int64
	if err := tx.Model(&model.TunnelGroupTunnel{}).
		Where("tunnel_group_id IN ?", groupIDs).
		Pluck("tunnel_id", &tunnelIDs).Error; err != nil {
		return nil, err
	}
	return tunnelIDs, nil
}

func planGroupSpeedByTunnelTx(tx *gorm.DB, planID int64) (map[int64]int64, error) {
	var rows []struct {
		TunnelID   int64
		SpeedLimit int64
	}
	if err := tx.Table("plan_tunnel_group").
		Select("tunnel_group_tunnel.tunnel_id AS tunnel_id, tunnel_group.speed_limit AS speed_limit").
		Joins("JOIN tunnel_group ON tunnel_group.id = plan_tunnel_group.tunnel_group_id").
		Joins("JOIN tunnel_group_tunnel ON tunnel_group_tunnel.tunnel_group_id = tunnel_group.id").
		Where("plan_tunnel_group.plan_id = ? AND tunnel_group.speed_limit > 0", planID).
		Scan(&rows).Error; err != nil {
		return nil, err
	}
	result := make(map[int64]int64, len(rows))
	for _, row := range rows {
		if row.TunnelID <= 0 || row.SpeedLimit <= 0 {
			continue
		}
		if existing, ok := result[row.TunnelID]; !ok || row.SpeedLimit < existing {
			result[row.TunnelID] = row.SpeedLimit
		}
	}
	return result, nil
}

func speedIDForGroupLimitTx(tx *gorm.DB, speed int64) (sql.NullInt64, error) {
	if speed <= 0 {
		return sql.NullInt64{}, nil
	}
	name := fmt.Sprintf("隧道分组限速 %.1f Mbps", float64(speed)/1000000)
	var item model.SpeedLimit
	if err := tx.Where("name = ? AND speed = ? AND status = 1", name, speed).First(&item).Error; err == nil {
		return sql.NullInt64{Int64: item.ID, Valid: true}, nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return sql.NullInt64{}, err
	}
	now := time.Now().UnixMilli()
	item = model.SpeedLimit{Name: name, Speed: int(speed), CreatedTime: now, UpdatedTime: sql.NullInt64{Int64: now, Valid: true}, Status: 1}
	if err := tx.Create(&item).Error; err != nil {
		return sql.NullInt64{}, err
	}
	return sql.NullInt64{Int64: item.ID, Valid: true}, nil
}

func (r *Repository) GetTunnelsInPlanGroups(planID int64) ([]int64, error) {
	if r == nil || r.db == nil || planID <= 0 {
		return nil, nil
	}
	return getTunnelsInPlanGroupsTx(r.db, planID)
}

func grantPlanTunnelsTx(tx *gorm.DB, userID int64, tunnelIDs []int64, plan model.Plan, expTime int64) error {
	if len(tunnelIDs) == 0 {
		return nil
	}
	speedByTunnel, err := planGroupSpeedByTunnelTx(tx, plan.ID)
	if err != nil {
		return err
	}
	seen := make(map[int64]struct{}, len(tunnelIDs))
	for _, tunnelID := range tunnelIDs {
		if tunnelID <= 0 {
			continue
		}
		if _, ok := seen[tunnelID]; ok {
			continue
		}
		seen[tunnelID] = struct{}{}
		flowGB := planTrafficQuotaGB(plan)
		speedID, err := speedIDForGroupLimitTx(tx, speedByTunnel[tunnelID])
		if err != nil {
			return err
		}
		values := map[string]interface{}{
			"num":             plan.RuleQuota,
			"flow":            flowGB,
			"in_flow":         0,
			"out_flow":        0,
			"speed_id":        speedID,
			"flow_reset_time": int64(0),
			"exp_time":        expTime,
			"status":          1,
		}
		if err := tx.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "user_id"}, {Name: "tunnel_id"}},
			DoUpdates: clause.Assignments(values),
		}).Create(&model.UserTunnel{
			UserID:        userID,
			TunnelID:      tunnelID,
			SpeedID:       speedID,
			Num:           plan.RuleQuota,
			Flow:          flowGB,
			InFlow:        0,
			OutFlow:       0,
			FlowResetTime: 0,
			ExpTime:       expTime,
			Status:        1,
		}).Error; err != nil {
			return err
		}
	}
	return nil
}

func planTrafficQuotaGB(plan model.Plan) int64 {
	if plan.TrafficQuota <= 0 || plan.TrafficQuota == 99999 {
		return plan.TrafficQuota
	}
	return plan.TrafficQuota / storeBytesPerGB
}

func (r *Repository) RestoreActiveUserPlanTunnels(userID int64) error {
	if r == nil || r.db == nil || userID <= 0 {
		return nil
	}
	var userPlan model.UserPlan
	if err := r.db.Where("user_id = ? AND status = 1", userID).Order("id DESC").First(&userPlan).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return err
	}
	var plan model.Plan
	if err := r.db.First(&plan, userPlan.PlanID).Error; err != nil {
		return err
	}
	return r.db.Transaction(func(tx *gorm.DB) error {
		tunnelIDs, err := getTunnelsInPlanGroupsTx(tx, plan.ID)
		if err != nil {
			return err
		}
		return grantPlanTunnelsTx(tx, userID, tunnelIDs, plan, userPlan.EndTime)
	})
}

func (r *Repository) ListBalanceLogs(userID int64, page, size int) ([]model.BalanceLog, int64, error) {
	if r == nil || r.db == nil {
		return nil, 0, nil
	}
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 20
	}
	query := r.db.Model(&model.BalanceLog{})
	if userID > 0 {
		query = query.Where("user_id = ?", userID)
	}
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var logs []model.BalanceLog
	if err := query.Order("id DESC").Offset((page - 1) * size).Limit(size).Find(&logs).Error; err != nil {
		return nil, 0, err
	}
	return logs, total, nil
}

func (r *Repository) DeleteBalanceLog(id int64) error {
	if r == nil || r.db == nil || id <= 0 {
		return nil
	}
	return r.db.Delete(&model.BalanceLog{}, id).Error
}

func (r *Repository) CleanupInvalidBalanceLogs() (int64, error) {
	if r == nil || r.db == nil {
		return 0, nil
	}
	result := r.db.Where("signature = ? OR signature = ''", "0").Delete(&model.BalanceLog{})
	return result.RowsAffected, result.Error
}

func (r *Repository) ListPaymentConfigs() ([]model.PaymentConfig, error) {
	if r == nil || r.db == nil {
		return nil, nil
	}
	var configs []model.PaymentConfig
	err := r.db.Order("id ASC").Find(&configs).Error
	return configs, err
}

func (r *Repository) ListEnabledPaymentConfigs() ([]model.PaymentConfig, error) {
	if r == nil || r.db == nil {
		return nil, nil
	}
	var configs []model.PaymentConfig
	err := r.db.Where("enabled = 1").Order("id ASC").Find(&configs).Error
	return configs, err
}

func (r *Repository) SavePaymentConfig(config *model.PaymentConfig) error {
	if r == nil || r.db == nil || config == nil {
		return nil
	}
	now := time.Now().Unix()
	config.UpdatedAt = now
	var existing model.PaymentConfig
	err := r.db.Where("channel = ?", config.Channel).First(&existing).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			config.CreatedAt = now
			return r.db.Create(config).Error
		}
		return err
	}
	return r.db.Model(&model.PaymentConfig{}).Where("channel = ?", config.Channel).Updates(map[string]interface{}{
		"config":     config.Config,
		"enabled":    config.Enabled,
		"updated_at": now,
	}).Error
}

func (r *Repository) DeletePaymentConfig(channel string) error {
	if r == nil || r.db == nil || channel == "" {
		return nil
	}
	return r.db.Where("channel = ?", channel).Delete(&model.PaymentConfig{}).Error
}

func (r *Repository) PaymentStats() (paidAmount float64, paidOrders int64, pendingOrders int64, err error) {
	if r == nil || r.db == nil {
		return 0, 0, 0, nil
	}
	err = r.db.Model(&model.Order{}).Where("status = 1").Count(&paidOrders).Error
	if err != nil {
		return
	}
	err = r.db.Model(&model.Order{}).Where("status = 0").Count(&pendingOrders).Error
	if err != nil {
		return
	}
	err = r.db.Model(&model.Order{}).Where("status = 1").Select("COALESCE(SUM(amount), 0) / 100.0").Scan(&paidAmount).Error
	return
}

func (r *Repository) ListUserPlanViews(userID int64) ([]UserPlanView, error) {
	if r == nil || r.db == nil || userID <= 0 {
		return nil, nil
	}
	var rows []UserPlanView
	err := r.db.Model(&model.UserPlan{}).
		Select("user_plan.id, user_plan.user_id, user_plan.plan_id, plan.name AS plan_name, plan.traffic_quota, plan.speed_limit, plan.rule_quota, plan.duration_days, plan.user_group_id, plan.price, user_plan.start_time, user_plan.end_time, user_plan.status, user_plan.traffic_used, user_plan.created_time").
		Joins("LEFT JOIN plan ON plan.id = user_plan.plan_id").
		Where("user_plan.user_id = ?", userID).
		Order("user_plan.id DESC").
		Scan(&rows).Error
	return rows, err
}

func (r *Repository) ListUserPackagePermissions(userID int64) ([]UserPackagePermission, error) {
	if r == nil || r.db == nil || userID <= 0 {
		return nil, nil
	}
	now := time.Now().UnixMilli()
	var rows []struct {
		ID          int64
		UserGroupID int64
		Name        string
		FlowLimit   int64
		SpeedLimit  int64
		RuleQuota   int
		TrafficUsed int64
		StartTime   int64
		EndTime     int64
		Status      int
	}
	if err := r.db.Model(&model.UserPlan{}).
		Select("user_plan.id, plan.user_group_id, plan.name, plan.traffic_quota AS flow_limit, plan.speed_limit, plan.rule_quota, user_plan.traffic_used, user_plan.start_time, user_plan.end_time, user_plan.status").
		Joins("JOIN plan ON plan.id = user_plan.plan_id").
		Where("user_plan.user_id = ?", userID).
		Order("user_plan.id DESC").
		Scan(&rows).Error; err != nil {
		return nil, err
	}
	permissions := make([]UserPackagePermission, 0, len(rows))
	for _, row := range rows {
		if row.Status == 1 && row.EndTime > 0 && row.EndTime <= now {
			row.Status = 0
		}
		permissions = append(permissions, UserPackagePermission{
			ID:          row.ID,
			UserGroupID: row.UserGroupID,
			Name:        row.Name,
			TunnelNames: []string{},
			FlowLimit:   row.FlowLimit,
			SpeedLimit:  row.SpeedLimit,
			RuleQuota:   row.RuleQuota,
			TrafficUsed: row.TrafficUsed,
			StartTime:   row.StartTime,
			ExpTime:     row.EndTime,
			Status:      row.Status,
			Source:      "plan",
		})
	}

	groupIDs, err := r.GetUserGroupIDsByUserID(userID)
	if err != nil {
		return nil, err
	}
	for _, groupID := range groupIDs {
		var group model.UserGroup
		if err := r.db.First(&group, groupID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				continue
			}
			return nil, err
		}
		permissions = append(permissions, UserPackagePermission{
			ID:          -group.ID,
			UserGroupID: group.ID,
			Name:        group.Name,
			TunnelNames: []string{},
			FlowLimit:   group.FlowLimit,
			SpeedLimit:  group.SpeedLimit,
			RuleQuota:   group.RuleQuota,
			Status:      group.Status,
			Source:      "manual",
		})
	}
	return permissions, nil
}

func (r *Repository) GetUserGroup(id int64) (*model.UserGroup, error) {
	if r == nil || r.db == nil || id <= 0 {
		return nil, nil
	}
	var group model.UserGroup
	err := r.db.First(&group, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &group, nil
}
