package middleware

import (
	"context"
	"net/http"
	"strings"

	"go-backend/internal/auth"
	"go-backend/internal/http/response"
)

type contextKey string

const ClaimsContextKey contextKey = "claims"

type AuthOptions struct {
	JWTSecret string
}

func JWT(opts AuthOptions) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if shouldSkip(r.URL.Path) {
				next.ServeHTTP(w, r)
				return
			}

			if !strings.HasPrefix(r.URL.Path, "/api/") {
				next.ServeHTTP(w, r)
				return
			}

			token := strings.TrimSpace(r.Header.Get("Authorization"))
			if token == "" {
				response.WriteJSON(w, response.Err(401, "未登录或token已过期"))
				return
			}

			claims, ok := auth.ValidateToken(token, opts.JWTSecret)
			if !ok {
				response.WriteJSON(w, response.Err(401, "无效的token或token已过期"))
				return
			}

            if requiresAdmin(r.URL.Path) && !isAdminRole(claims.RoleID) {
				response.WriteJSON(w, response.Err(403, "权限不足，仅管理员可操作"))
				return
			}

			ctx := context.WithValue(r.Context(), ClaimsContextKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		raw := r.Context().Value(ClaimsContextKey)
		claims, ok := raw.(auth.Claims)
		if !ok {
			response.WriteJSON(w, response.Err(401, "无法获取用户权限信息"))
			return
		}
        if !isAdminRole(claims.RoleID) {
			response.WriteJSON(w, response.Err(403, "权限不足，仅管理员可操作"))
			return
		}
		next.ServeHTTP(w, r)
	})
}

func isAdminRole(roleID int) bool {
    return roleID == 0 || roleID == 2
}

func shouldSkip(path string) bool {
	switch {
	case strings.HasPrefix(path, "/flow/"):
		return true
	case strings.HasPrefix(path, "/api/v1/open_api/"):
		return true
	case strings.HasPrefix(path, "/api/v1/captcha/"):
		return true
	case path == "/api/v1/config/get":
		return true
	case path == "/api/v1/user/login":
		return true
	case path == "/api/v1/federation/connect":
		return true
	case path == "/api/v1/federation/tunnel/create":
		return true
	case path == "/api/v1/federation/runtime/reserve-port":
		return true
	case path == "/api/v1/federation/runtime/apply-role":
		return true
	case path == "/api/v1/federation/runtime/release-role":
		return true
	case path == "/api/v1/federation/runtime/diagnose":
		return true
	case path == "/api/v1/federation/runtime/command":
		return true
	default:
		return false
	}
}

func requiresAdmin(path string) bool {
	if strings.HasPrefix(path, "/api/v1/monitor/permission/") {
		return true
	}

	if strings.HasPrefix(path, "/api/v1/group/") {
		return true
	}

	if strings.HasPrefix(path, "/api/v1/federation/share/") {
		return true
	}

	if strings.HasPrefix(path, "/api/v1/node/") {
		return true
	}

	if strings.HasPrefix(path, "/api/v1/speed-limit/") {
		return true
	}

	if strings.HasPrefix(path, "/api/v1/plan/") {
		switch path {
		case "/api/v1/plan/available", "/api/v1/plan/purchase", "/api/v1/plan/store-status":
			return false
		default:
			return true
		}
	}

	if strings.HasPrefix(path, "/api/v1/payment/config") {
		return path != "/api/v1/payment/config"
	}

	if strings.HasPrefix(path, "/api/v1/payment/stats") || strings.HasPrefix(path, "/api/v1/balance/log") {
		return true
	}

	if strings.HasPrefix(path, "/api/v1/order/admin/") {
		return true
	}

	if strings.HasPrefix(path, "/api/v1/obs-code/") {
		return path != "/api/v1/obs-code/mine"
	}

	if strings.HasPrefix(path, "/api/v1/backup/") {
		return true
	}

	if strings.HasPrefix(path, "/api/v1/api/v1/backup/") {
		return true
	}

	if strings.HasPrefix(path, "/api/v1/tunnel/") {
		if strings.HasPrefix(path, "/api/v1/tunnel/user/tunnel") {
			return false
		}
		return true
	}

	switch path {
	case "/api/v1/user/create", "/api/v1/user/list", "/api/v1/user/update", "/api/v1/user/delete", "/api/v1/user/reset":
		return true
	case "/api/v1/config/update", "/api/v1/config/update-single":
		return true
	case "/api/v1/announcement/update":
		return true
	case "/api/v1/balance/set", "/api/v1/balance/list":
		return true
	default:
		return false
	}
}
