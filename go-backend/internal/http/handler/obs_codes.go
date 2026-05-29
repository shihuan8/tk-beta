package handler

import (
	"net/http"
	"strconv"
	"strings"

	"go-backend/internal/auth"
	"go-backend/internal/http/middleware"
	"go-backend/internal/http/response"
	"go-backend/internal/store/model"
)

type obsCodeSaveRequest struct {
	UserID    int64  `json:"userId"`
	UserName  string `json:"userName"`
	PushCode  string `json:"pushCode"`
	InputCode string `json:"inputCode"`
	Remark    string `json:"remark"`
}

func (h *Handler) obsCodeList(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.ListOBSCodeAssignments()
	if err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OK(items))
}

func (h *Handler) obsCodeMine(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.ClaimsContextKey).(auth.Claims)
	if !ok {
		response.WriteJSON(w, response.Err(401, "未登录或token已过期"))
		return
	}
	userID, _ := strconv.ParseInt(claims.Sub, 10, 64)
	item, err := h.repo.GetOBSCodeAssignment(userID)
	if err != nil {
		response.WriteJSON(w, response.OK(nil))
		return
	}
	response.WriteJSON(w, response.OK(item))
}

func (h *Handler) obsCodeSave(w http.ResponseWriter, r *http.Request) {
	var req obsCodeSaveRequest
	if err := decodeJSON(r.Body, &req); err != nil {
		response.WriteJSON(w, response.ErrDefault("请求参数错误"))
		return
	}
	if req.UserID <= 0 {
		response.WriteJSON(w, response.ErrDefault("用户不能为空"))
		return
	}
	if strings.TrimSpace(req.PushCode) == "" || strings.TrimSpace(req.InputCode) == "" {
		response.WriteJSON(w, response.ErrDefault("OBS码不能为空"))
		return
	}
	if err := h.repo.SaveOBSCodeAssignment(model.OBSCodeAssignment{
		UserID:    req.UserID,
		UserName:  strings.TrimSpace(req.UserName),
		PushCode:  strings.TrimSpace(req.PushCode),
		InputCode: strings.TrimSpace(req.InputCode),
		Remark:    strings.TrimSpace(req.Remark),
	}); err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OKEmpty())
}

func (h *Handler) obsCodeDelete(w http.ResponseWriter, r *http.Request) {
	id := idFromBody(r, w)
	if id <= 0 {
		return
	}
	if err := h.repo.DeleteOBSCodeAssignment(id); err != nil {
		response.WriteJSON(w, response.Err(-2, err.Error()))
		return
	}
	response.WriteJSON(w, response.OKEmpty())
}
