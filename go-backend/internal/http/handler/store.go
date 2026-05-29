package handler

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"go-backend/internal/http/response"
	"go-backend/internal/store/model"
	"go-backend/internal/store/repo"
)

const storeEnabledConfigKey = "store_enabled"

func (h *Handler) planList(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteJSON(w, response.ErrDefault("请求失败"))
		return
	}
	plans, err := h.repo.ListPlans()
	if err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OK(plans))
}

func (h *Handler) planAvailable(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteJSON(w, response.ErrDefault("请求失败"))
		return
	}
	if !h.storeEnabled() {
		response.WriteJSON(w, response.OK([]model.Plan{}))
		return
	}
	plans, err := h.repo.ListAvailablePlans()
	if err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OK(plans))
}

func (h *Handler) listAutoBuyTrafficPackages(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		response.WriteJSON(w, response.ErrDefault("请求失败"))
		return
	}
	plans, err := h.repo.ListAvailablePlans()
	if err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	items := make([]map[string]interface{}, 0, len(plans))
	for _, plan := range plans {
		items = append(items, map[string]interface{}{
			"id":           plan.ID,
			"name":         plan.Name,
			"trafficLimit": plan.TrafficQuota,
			"price":        plan.Price,
		})
	}
	response.WriteJSON(w, response.OK(items))
}

func (h *Handler) planCreate(w http.ResponseWriter, r *http.Request) {
	var req model.Plan
	if err := decodeJSON(r.Body, &req); err != nil {
		response.WriteJSON(w, response.ErrDefault("请求参数错误"))
		return
	}
	name := strings.TrimSpace(req.Name)
	if name == "" {
		response.WriteJSON(w, response.ErrDefault("套餐名称不能为空"))
		return
	}
	now := time.Now().UnixMilli()
	plan := &model.Plan{
		Name:           name,
		Description:    strings.TrimSpace(req.Description),
		Price:          req.Price,
		TrafficQuota:   req.TrafficQuota,
		SpeedLimit:     req.SpeedLimit,
		RuleQuota:      req.RuleQuota,
		DurationDays:   req.DurationDays,
		UserGroupID:    req.UserGroupID,
		TunnelGroupIDs: req.TunnelGroupIDs,
		Status:         req.Status,
		CreatedTime:    now,
		UpdatedTime:    now,
	}
	if plan.Status == 0 {
		plan.Status = 1
	}
	if err := h.repo.CreatePlan(plan); err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OK(plan))
}

func (h *Handler) planUpdate(w http.ResponseWriter, r *http.Request) {
	var req model.Plan
	if err := decodeJSON(r.Body, &req); err != nil || req.ID <= 0 {
		response.WriteJSON(w, response.ErrDefault("请求参数错误"))
		return
	}
	plan, err := h.repo.GetPlan(req.ID)
	if err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	if plan == nil {
		response.WriteJSON(w, response.ErrDefault("套餐不存在"))
		return
	}
	name := strings.TrimSpace(req.Name)
	if name == "" {
		response.WriteJSON(w, response.ErrDefault("套餐名称不能为空"))
		return
	}
	plan.Name = name
	plan.Description = strings.TrimSpace(req.Description)
	plan.Price = req.Price
	plan.TrafficQuota = req.TrafficQuota
	plan.SpeedLimit = req.SpeedLimit
	plan.RuleQuota = req.RuleQuota
	plan.DurationDays = req.DurationDays
	plan.UserGroupID = req.UserGroupID
	plan.TunnelGroupIDs = req.TunnelGroupIDs
	plan.Status = req.Status
	plan.UpdatedTime = time.Now().UnixMilli()
	if err := h.repo.UpdatePlan(plan); err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OK(plan))
}

func (h *Handler) planDelete(w http.ResponseWriter, r *http.Request) {
	id := idFromBody(r, w)
	if id <= 0 {
		return
	}
	if err := h.repo.DeletePlan(id); err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OKEmpty())
}

func (h *Handler) planPurchase(w http.ResponseWriter, r *http.Request) {
	if !h.storeEnabled() {
		response.WriteJSON(w, response.ErrDefault("商店暂未开启"))
		return
	}
	var req struct {
		PlanID int64 `json:"planId"`
	}
	if err := decodeJSON(r.Body, &req); err != nil || req.PlanID <= 0 {
		response.WriteJSON(w, response.ErrDefault("请求参数错误"))
		return
	}
	userID, err := userIDFromRequest(r)
	if err != nil {
		response.WriteJSON(w, response.Err(401, "无效的token或token已过期"))
		return
	}
	userPlan, err := h.repo.PurchasePlan(userID, req.PlanID)
	if err != nil {
		response.WriteJSON(w, response.ErrDefault(err.Error()))
		return
	}
	response.WriteJSON(w, response.OK(userPlan))
}

func (h *Handler) userPlanList(w http.ResponseWriter, r *http.Request) {
	userID, err := userIDFromRequest(r)
	if err != nil {
		response.WriteJSON(w, response.Err(401, "无效的token或token已过期"))
		return
	}
	plans, err := h.repo.ListUserPlanViews(userID)
	if err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OK(plans))
}

func (h *Handler) userBalance(w http.ResponseWriter, r *http.Request) {
	userID, err := userIDFromRequest(r)
	if err != nil {
		response.WriteJSON(w, response.Err(401, "无效的token或token已过期"))
		return
	}
	balance, err := h.repo.GetUserBalance(userID)
	if err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OK(balance))
}

func (h *Handler) balanceSet(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID  int64   `json:"userId"`
		Balance float64 `json:"balance"`
	}
	if err := decodeJSON(r.Body, &req); err != nil || req.UserID <= 0 || req.Balance < 0 {
		response.WriteJSON(w, response.ErrDefault("请求参数错误"))
		return
	}
	if err := h.repo.SetUserBalance(req.UserID, req.Balance); err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OKEmpty())
}

func (h *Handler) balanceList(w http.ResponseWriter, r *http.Request) {
	balances, err := h.repo.ListUserBalances()
	if err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OK(balances))
}

func (h *Handler) getStoreStatus(w http.ResponseWriter, r *http.Request) {
	response.WriteJSON(w, response.OK(map[string]bool{"enabled": h.storeEnabled()}))
}

func (h *Handler) setStoreStatus(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Enabled bool `json:"enabled"`
	}
	if err := decodeJSON(r.Body, &req); err != nil {
		response.WriteJSON(w, response.ErrDefault("请求参数错误"))
		return
	}
	value := "0"
	if req.Enabled {
		value = "1"
	}
	if err := h.repo.UpsertConfig(storeEnabledConfigKey, value, time.Now().UnixMilli()); err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OKEmpty())
}

func (h *Handler) storeEnabled() bool {
	cfg, err := h.repo.GetConfigByName(storeEnabledConfigKey)
	if err != nil || cfg == nil {
		return true
	}
	return cfg.Value != "0"
}

func (h *Handler) balanceLogList(w http.ResponseWriter, r *http.Request) {
	var req map[string]interface{}
	if err := decodeJSON(r.Body, &req); err != nil {
		response.WriteJSON(w, response.ErrDefault("请求参数错误"))
		return
	}
	logs, total, err := h.repo.ListBalanceLogs(asInt64(req["userId"], 0), asInt(req["page"], 1), asInt(req["size"], 20))
	if err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OK(map[string]interface{}{"list": logs, "total": total}))
}

func (h *Handler) balanceLogDelete(w http.ResponseWriter, r *http.Request) {
	id := idFromBody(r, w)
	if id <= 0 {
		return
	}
	if err := h.repo.DeleteBalanceLog(id); err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OKEmpty())
}

func (h *Handler) balanceLogCleanup(w http.ResponseWriter, r *http.Request) {
	count, err := h.repo.CleanupInvalidBalanceLogs()
	if err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OK(map[string]int64{"deleted": count}))
}

func (h *Handler) paymentStats(w http.ResponseWriter, r *http.Request) {
	paidAmount, paidOrders, pendingOrders, err := h.repo.PaymentStats()
	if err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OK(map[string]interface{}{
		"paidAmount":    paidAmount,
		"paidOrders":    paidOrders,
		"pendingOrders": pendingOrders,
	}))
}

func (h *Handler) adminOrderList(w http.ResponseWriter, r *http.Request) {
	var req map[string]interface{}
	if err := decodeJSON(r.Body, &req); err != nil {
		response.WriteJSON(w, response.ErrDefault("请求参数错误"))
		return
	}
	list, total, err := h.repo.ListAllOrders(repo.OrderQuery{
		Status:  asInt(req["status"], -1),
		Page:    asInt(req["page"], 1),
		Size:    asInt(req["size"], 10),
		Keyword: strings.TrimSpace(asString(req["keyword"])),
		UserID:  asInt64(req["userId"], 0),
	})
	if err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OK(map[string]interface{}{"list": list, "total": total}))
}

func (h *Handler) userOrderList(w http.ResponseWriter, r *http.Request) {
	var req map[string]interface{}
	if err := decodeJSON(r.Body, &req); err != nil {
		response.WriteJSON(w, response.ErrDefault("请求参数错误"))
		return
	}
	userID, err := userIDFromRequest(r)
	if err != nil {
		response.WriteJSON(w, response.Err(401, "无效的token或token已过期"))
		return
	}
	list, total, err := h.repo.ListAllOrders(repo.OrderQuery{
		Status:  asInt(req["status"], -1),
		Page:    asInt(req["page"], 1),
		Size:    asInt(req["size"], 10),
		Keyword: strings.TrimSpace(asString(req["keyword"])),
		UserID:  userID,
	})
	if err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OK(map[string]interface{}{"list": list, "total": total}))
}

func (h *Handler) adminOrderUpdate(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ID          int64   `json:"id"`
		Status      *int    `json:"status"`
		Amount      *int64  `json:"amount"`
		PayCurrency string  `json:"payCurrency"`
		ProductName string  `json:"productName"`
		PayTime     *int64  `json:"payTime"`
	}
	if err := decodeJSON(r.Body, &req); err != nil || req.ID <= 0 {
		response.WriteJSON(w, response.ErrDefault("请求参数错误"))
		return
	}
	updates := make(map[string]interface{})
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.Amount != nil {
		updates["amount"] = *req.Amount
	}
	if strings.TrimSpace(req.PayCurrency) != "" {
		updates["pay_currency"] = strings.ToUpper(strings.TrimSpace(req.PayCurrency))
	}
	if strings.TrimSpace(req.ProductName) != "" {
		updates["product_name"] = strings.TrimSpace(req.ProductName)
	}
	if req.PayTime != nil {
		updates["pay_time"] = *req.PayTime
	}
	if len(updates) == 0 {
		response.WriteJSON(w, response.ErrDefault("无更新字段"))
		return
	}
	if err := h.repo.UpdateOrder(req.ID, updates); err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OKEmpty())
}

func (h *Handler) adminOrderDelete(w http.ResponseWriter, r *http.Request) {
	id := idFromBody(r, w)
	if id <= 0 {
		return
	}
	if err := h.repo.DeleteOrder(id); err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OKEmpty())
}

func (h *Handler) adminOrderRefund(w http.ResponseWriter, r *http.Request) {
	id := idFromBody(r, w)
	if id <= 0 {
		return
	}
	order, err := h.repo.GetOrder(id)
	if err != nil {
		response.WriteJSON(w, response.ErrDefault("订单不存在"))
		return
	}
	forwards := make([]model.ForwardRecord, 0)
	if order.ProductType == "plan" && order.ProductID > 0 {
		tunnelIDs, tunnelErr := h.repo.GetTunnelsInPlanGroups(order.ProductID)
		if tunnelErr == nil {
			for _, tunnelID := range tunnelIDs {
				items, listErr := h.repo.ListActiveForwardsByUserTunnel(order.UserID, tunnelID)
				if listErr == nil {
					forwards = append(forwards, items...)
				}
			}
		}
	}
	if err := h.repo.RefundOrder(id); err != nil {
		response.WriteJSON(w, response.ErrDefault(err.Error()))
		return
	}
	now := time.Now().UnixMilli()
	for i := range forwards {
		_ = h.controlForwardServices(&forwards[i], "PauseService", false)
		_ = h.repo.UpdateForwardStatus(forwards[i].ID, 0, now)
	}
	response.WriteJSON(w, response.OKEmpty())
}

func (h *Handler) getPaymentConfigs(w http.ResponseWriter, r *http.Request) {
	configs, err := h.repo.ListEnabledPaymentConfigs()
	if err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OK(configs))
}

func (h *Handler) listAllPaymentConfigs(w http.ResponseWriter, r *http.Request) {
	configs, err := h.repo.ListPaymentConfigs()
	if err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OK(configs))
}

func (h *Handler) savePaymentConfig(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Channel string          `json:"channel"`
		Config  json.RawMessage `json:"config"`
		Enabled int             `json:"enabled"`
	}
	if err := decodeJSON(r.Body, &req); err != nil || strings.TrimSpace(req.Channel) == "" {
		response.WriteJSON(w, response.ErrDefault("请求参数错误"))
		return
	}
	config := strings.TrimSpace(string(req.Config))
	if config == "" || config == "null" {
		config = "{}"
	}
	if err := h.repo.SavePaymentConfig(&model.PaymentConfig{
		Channel: strings.ToUpper(strings.TrimSpace(req.Channel)),
		Config:  config,
		Enabled: req.Enabled,
	}); err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OKEmpty())
}

func (h *Handler) deletePaymentConfig(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Channel string `json:"channel"`
	}
	if err := decodeJSON(r.Body, &req); err != nil || strings.TrimSpace(req.Channel) == "" {
		response.WriteJSON(w, response.ErrDefault("请求参数错误"))
		return
	}
	if err := h.repo.DeletePaymentConfig(strings.ToUpper(strings.TrimSpace(req.Channel))); err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OKEmpty())
}
