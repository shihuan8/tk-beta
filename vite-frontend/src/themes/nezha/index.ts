import type { ThemePackage } from "../types";

const nezhaTheme: ThemePackage = {
  id: "nezha",
  name: "哪吒探针",
  author: "FLVX",
  version: "3.0.0",
  description: "哪吒探针风格 · 纯白 · 浅紫点缀",

  tokens: {
    light: {
      "--background": "#f0f2f5",
      "--foreground": "#1e293b",
      "--border": "#e4e7ed",
      "--input": "#dfe2e9",
      "--ring": "#a5b4fc",
      "--content1": "#ffffff",
      "--divider": "#e8eaef",

      "--default-50": "#f7f8fa",
      "--default-100": "#eff1f5",
      "--default-200": "#e4e7ed",
      "--default-300": "#cdd0d8",
      "--default-400": "#a4a8b4",
      "--default-500": "#7a7f8e",
      "--default-600": "#585d6d",
      "--default-700": "#3d4252",
      "--default-800": "#2c3141",
      "--default-900": "#1e293b",

      "--primary": "#6366f1",
      "--primary-foreground": "#ffffff",
      "--primary-50": "#eef2ff",
      "--primary-100": "#e0e7ff",
      "--primary-200": "#c7d2fe",
      "--primary-300": "#a5b4fc",
      "--primary-400": "#818cf8",
      "--primary-500": "#6366f1",
      "--primary-600": "#4f46e5",
      "--primary-700": "#4338ca",
      "--primary-800": "#3730a3",
      "--primary-900": "#312e81",

      "--secondary": "#a5b4fc",
      "--secondary-foreground": "#ffffff",

      "--danger": "#e11d48",
      "--danger-50": "#fff1f2",
      "--danger-100": "#ffe4e6",
      "--danger-200": "#fecdd3",
      "--danger-300": "#fda4af",
      "--danger-400": "#fb7185",
      "--danger-500": "#e11d48",
      "--danger-600": "#be123c",
      "--danger-700": "#9f1239",
      "--danger-800": "#881337",
      "--danger-900": "#4c0519",

      "--success": "#10b981",
      "--success-50": "#ecfdf5",
      "--success-100": "#d1fae5",
      "--success-200": "#a7f3d0",
      "--success-300": "#6ee7b7",
      "--success-400": "#34d399",
      "--success-500": "#10b981",
      "--success-600": "#059669",
      "--success-700": "#047857",
      "--success-800": "#065f46",
      "--success-900": "#064e3b",

      "--warning": "#f59e0b",
      "--warning-50": "#fffbeb",
      "--warning-100": "#fef3c7",
      "--warning-200": "#fde68a",
      "--warning-300": "#fcd34d",
      "--warning-400": "#fbbf24",
      "--warning-500": "#f59e0b",
      "--warning-600": "#d97706",
      "--warning-700": "#b45309",
      "--warning-800": "#92400e",
      "--warning-900": "#78350f",
    },

    dark: {
      "--background": "#0d0f15",
      "--foreground": "#e5e9f0",
      "--border": "#1a1c24",
      "--input": "#16181f",
      "--ring": "#a5b4fc",
      "--content1": "#14161d",
      "--divider": "#1a1c24",

      "--default-50": "#0d0f15",
      "--default-100": "#14161d",
      "--default-200": "#1a1c24",
      "--default-300": "#262833",
      "--default-400": "#3b3e4d",
      "--default-500": "#5d6172",
      "--default-600": "#7a7e90",
      "--default-700": "#a0a5b8",
      "--default-800": "#c6cbd8",
      "--default-900": "#e5e9f0",

      "--primary": "#818cf8",
      "--primary-foreground": "#0d0f15",
      "--secondary": "#a5b4fc",
      "--danger": "#fb7185",
      "--danger-50": "#2d0a12",
      "--danger-100": "#4c0519",
      "--danger-200": "#881337",
      "--danger-300": "#9f1239",
      "--danger-400": "#be123c",
      "--danger-500": "#e11d48",
      "--danger-600": "#fb7185",
      "--danger-700": "#fda4af",
      "--danger-800": "#fecdd3",
      "--danger-900": "#ffe4e6",

      "--success": "#34d399",
      "--success-50": "#022c22",
      "--success-100": "#064e3b",
      "--success-200": "#065f46",
      "--success-300": "#047857",
      "--success-400": "#059669",
      "--success-500": "#10b981",
      "--success-600": "#34d399",
      "--success-700": "#6ee7b7",
      "--success-800": "#a7f3d0",
      "--success-900": "#d1fae5",

      "--warning": "#fbbf24",
      "--warning-50": "#451a03",
      "--warning-100": "#78350f",
      "--warning-200": "#92400e",
      "--warning-300": "#b45309",
      "--warning-400": "#d97706",
      "--warning-500": "#f59e0b",
      "--warning-600": "#fbbf24",
      "--warning-700": "#fcd34d",
      "--warning-800": "#fde68a",
      "--warning-900": "#fef3c7",
    },
  },

  css: `
    body {
      font-feature-settings: "cv02", "cv03", "cv04", "cv11";
      -webkit-font-smoothing: antialiased;
    }

    /* ── SCROLLBAR ─────────────────────────────────── */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cdd0d8; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #a4a8b4; }

    /* ── MAIN ──────────────────────────────────────── */
    [class*="h-screen"] {
      background: #f0f2f5 !important;
    }

    /* ── SIDEBAR ──────────────────────────────────── */
    aside[class*="flex"][class*="flex-col"][class*="h-full"] {
      background: #ffffff !important;
      border-right: 1px solid #e8eaef !important;
    }

    /* ── HEADER ─────────────────────────────────────── */
    header[class*="top-0"] {
      background: #ffffff !important;
      border-bottom: 1px solid #e8eaef !important;
    }

    /* ── PAGE CONTENT SPACING ─────────────────────── */
    [class*="AnimatedPage"] {
      padding: 20px 28px !important;
    }

    /* ═══════════════════════════════════════════════════
       CARDS — 哪吒探针风格: 白色 + 左侧浅紫竖条
       ═══════════════════════════════════════════════════ */
    [data-slot="card"] {
      background: #ffffff !important;
      border: none !important;
      border-radius: 10px !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02) !important;
      position: relative !important;
      overflow: visible !important;
    }

    [data-slot="card"]::before {
      content: "" !important;
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      bottom: 0 !important;
      width: 3px !important;
      background: #a5b4fc !important;
      border-radius: 3px 0 0 3px !important;
    }

    [data-slot="card-header"] {
      padding: 16px 20px 12px !important;
      border-bottom: 1px solid #f0f2f5 !important;
    }

    [data-slot="card-title"] {
      font-size: 15px !important;
      font-weight: 600 !important;
      color: #1e293b !important;
    }

    [data-slot="card-description"] {
      font-size: 12px !important;
      color: #7a7f8e !important;
      margin-top: 2px !important;
    }

    [data-slot="card-content"] {
      padding: 16px 20px !important;
    }

    /* ── METRIC CARD ───────────────────────────────── */
    [class*="metric-card"],
    [class*="MetricCard"] {
      background: #ffffff !important;
      border: none !important;
      border-radius: 10px !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02) !important;
      padding: 18px 20px !important;
      position: relative !important;
      overflow: visible !important;
      transition: box-shadow 0.2s ease !important;
    }

    [class*="metric-card"]::before,
    [class*="MetricCard"]::before {
      content: "" !important;
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      bottom: 0 !important;
      width: 3px !important;
      background: #a5b4fc !important;
      border-radius: 3px 0 0 3px !important;
    }

    [class*="metric-card"]:hover,
    [class*="MetricCard"]:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.03) !important;
    }

    /* ═══════════════════════════════════════════════════
       BUTTONS
       ═══════════════════════════════════════════════════ */
    [data-slot="button"] {
      border-radius: 8px !important;
      font-weight: 500 !important;
      font-size: 13px !important;
      transition: all 0.12s ease !important;
      line-height: 1.4 !important;
    }

    [data-slot="button"][class*="variant-default"]:not([class*="ghost"]):not([class*="link"]):not([class*="outline"]) {
      background: #f0f2f5 !important;
      color: #374151 !important;
      border: none !important;
      box-shadow: none !important;
    }

    [data-slot="button"][class*="variant-default"]:hover:not([class*="ghost"]):not([class*="link"]):not([class*="outline"]) {
      background: #e4e7ed !important;
    }

    [data-slot="button"][class*="variant-primary"]:not([class*="ghost"]):not([class*="link"]):not([class*="outline"]) {
      background: #6366f1 !important;
      color: #ffffff !important;
      border: none !important;
      box-shadow: 0 2px 6px rgba(99,102,241,0.15) !important;
    }

    [data-slot="button"][class*="variant-primary"]:hover:not([class*="ghost"]):not([class*="link"]):not([class*="outline"]) {
      background: #4f46e5 !important;
    }

    [data-slot="button"][class*="variant-danger"]:not([class*="ghost"]):not([class*="link"]):not([class*="outline"]) {
      background: #e11d48 !important;
      color: #ffffff !important;
      border: none !important;
    }

    [data-slot="button"][class*="variant-ghost"]:hover,
    [data-slot="button"][class*="variant-link"]:hover {
      background: #f0f2f5 !important;
    }

    [data-slot="button"][class*="variant-outline"] {
      border: 1px solid #dfe2e9 !important;
      background: transparent !important;
      color: #374151 !important;
    }

    [data-slot="button"][class*="variant-outline"]:hover {
      background: #f7f8fa !important;
      border-color: #cdd0d8 !important;
    }

    /* same for shadcn variant styles (no "variant-" prefix) */
    [data-slot="button"][class*="bg-primary"] {
      background: #6366f1 !important;
      color: #ffffff !important;
      border: none !important;
      box-shadow: 0 2px 6px rgba(99,102,241,0.15) !important;
    }
    [data-slot="button"][class*="bg-primary"]:hover {
      background: #4f46e5 !important;
    }
    [data-slot="button"][class*="bg-destructive"] {
      background: #e11d48 !important;
      color: #ffffff !important;
      border: none !important;
    }
    [data-slot="button"][class*="bg-secondary"] {
      background: #f0f2f5 !important;
      color: #374151 !important;
      border: none !important;
    }
    [data-slot="button"][class*="bg-secondary"]:hover {
      background: #e4e7ed !important;
    }

    /* ═══════════════════════════════════════════════════
       INPUT
       ═══════════════════════════════════════════════════ */
    [data-slot="input"] {
      border: 1px solid #dfe2e9 !important;
      border-radius: 8px !important;
      font-size: 13px !important;
      padding: 8px 12px !important;
      transition: all 0.12s ease !important;
      background: #ffffff !important;
      box-shadow: none !important;
    }

    [data-slot="input"]:focus {
      border-color: #a5b4fc !important;
      box-shadow: 0 0 0 3px rgba(165,180,252,0.15) !important;
    }

    /* ═══════════════════════════════════════════════════
       SELECT
       ═══════════════════════════════════════════════════ */
    [data-slot="select-trigger"] {
      border: 1px solid #dfe2e9 !important;
      border-radius: 8px !important;
      font-size: 13px !important;
      height: 36px !important;
      background: #ffffff !important;
    }

    [data-slot="select-trigger"]:focus-within {
      border-color: #a5b4fc !important;
      box-shadow: 0 0 0 3px rgba(165,180,252,0.15) !important;
    }

    [data-slot="select-content"] {
      background: #ffffff !important;
      border: 1px solid #e8eaef !important;
      border-radius: 10px !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.06) !important;
      padding: 4px !important;
    }

    [data-slot="select-item"] {
      border-radius: 6px !important;
      padding: 7px 12px !important;
      font-size: 13px !important;
    }

    [data-slot="select-item"][data-highlighted] {
      background: #f0f2f5 !important;
    }

    /* ═══════════════════════════════════════════════════
       TABLE — 哪吒探针浮动行
       ═══════════════════════════════════════════════════ */
    [data-slot="table-wrapper"] {
      border: none !important;
      background: transparent !important;
    }

    [data-slot="table"] {
      border-collapse: separate !important;
      border-spacing: 0 4px !important;
      background: transparent !important;
    }

    [data-slot="table-header"] {
      background: transparent !important;
    }

    [data-slot="table-head"] {
      background: transparent !important;
      border: none !important;
      color: #a4a8b4 !important;
      font-weight: 600 !important;
      font-size: 11px !important;
      text-transform: uppercase !important;
      letter-spacing: 0.06em !important;
      padding: 6px 14px !important;
    }

    [data-slot="table-body"] [data-slot="table-row"] {
      background: #ffffff !important;
      border-radius: 8px !important;
      box-shadow: 0 1px 2px rgba(0,0,0,0.02), 0 2px 6px rgba(0,0,0,0.02) !important;
      transition: box-shadow 0.15s ease !important;
    }

    [data-slot="table-body"] [data-slot="table-row"]:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.04), 0 4px 12px rgba(99,102,241,0.04) !important;
    }

    [data-slot="table-cell"] {
      border: none !important;
      padding: 10px 14px !important;
      font-size: 13px !important;
      color: #374151 !important;
    }

    /* ═══════════════════════════════════════════════════
       TABS
       ═══════════════════════════════════════════════════ */
    [data-slot="tabs-list"] {
      background: transparent !important;
      border-bottom: 1px solid #e8eaef !important;
    }

    [data-slot="tabs-trigger"] {
      padding: 8px 18px !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      color: #7a7f8e !important;
      transition: color 0.12s ease !important;
    }

    [data-slot="tabs-trigger"]:hover {
      color: #6366f1 !important;
    }

    [data-slot="tabs-trigger"][data-state="active"] {
      color: #6366f1 !important;
      box-shadow: inset 0 -2px 0 #6366f1 !important;
    }

    /* ═══════════════════════════════════════════════════
       BADGE
       ═══════════════════════════════════════════════════ */
    [data-slot="badge"] {
      border-radius: 6px !important;
      font-weight: 500 !important;
      font-size: 11px !important;
      padding: 2px 10px !important;
      border: none !important;
    }

    [data-slot="badge"][class*="secondary"] {
      background: #f0f2f5 !important;
      color: #585d6d !important;
    }

    [data-slot="badge"][class*="outline"] {
      border: 1px solid #e4e7ed !important;
      background: transparent !important;
      color: #585d6d !important;
    }

    /* ═══════════════════════════════════════════════════
       SWITCH
       ═══════════════════════════════════════════════════ */
    [data-slot="switch"] {
      height: 22px !important;
      width: 36px !important;
      border: none !important;
      background: #cdd0d8 !important;
    }

    [data-slot="switch"][data-state="checked"] {
      background: #6366f1 !important;
    }

    [data-slot="switch-thumb"] {
      height: 16px !important;
      width: 16px !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
    }

    /* ═══════════════════════════════════════════════════
       DIALOG / MODAL
       ═══════════════════════════════════════════════════ */
    [data-slot="dialog-content"] {
      background: #ffffff !important;
      border: none !important;
      border-radius: 14px !important;
      box-shadow: 0 24px 64px rgba(0,0,0,0.08) !important;
    }

    [data-slot="dialog-header"] {
      padding: 20px 24px 14px !important;
      border-bottom: 1px solid #f0f2f5 !important;
    }

    [data-slot="dialog-content"] > div:not([data-slot="dialog-header"]):not([data-slot="dialog-footer"]) {
      padding: 18px 24px !important;
    }

    [data-slot="dialog-footer"] {
      padding: 14px 24px 20px !important;
      border-top: 1px solid #f0f2f5 !important;
    }

    /* ═══════════════════════════════════════════════════
       DROPDOWN
       ═══════════════════════════════════════════════════ */
    [data-slot="dropdown-menu-content"] {
      background: #ffffff !important;
      border: 1px solid #e8eaef !important;
      border-radius: 10px !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.06) !important;
      padding: 4px !important;
    }

    [data-slot="dropdown-menu-item"] {
      border-radius: 6px !important;
      padding: 8px 12px !important;
      font-size: 13px !important;
    }

    [data-slot="dropdown-menu-item"]:hover {
      background: #f0f2f5 !important;
    }

    /* ═══════════════════════════════════════════════════
       PROGRESS — 纯色浅紫
       ═══════════════════════════════════════════════════ */
    [data-slot="progress"] {
      background: #eff1f5 !important;
      border-radius: 4px !important;
      overflow: hidden !important;
      height: 6px !important;
    }

    [data-slot="progress-indicator"] {
      background: #a5b4fc !important;
      border-radius: 4px !important;
      transition: width 0.3s ease !important;
    }

    /* ═══════════════════════════════════════════════════
       ACCORDION
       ═══════════════════════════════════════════════════ */
    [data-slot="accordion-item"] {
      border-bottom: 1px solid #e8eaef !important;
    }

    [data-slot="accordion-trigger"] {
      padding: 12px 0 !important;
      font-weight: 500 !important;
    }

    [data-slot="accordion-trigger"]:hover {
      background: transparent !important;
    }

    /* ═══════════════════════════════════════════════════
       SEPARATOR
       ═══════════════════════════════════════════════════ */
    [data-slot="separator"] {
      background: #e8eaef !important;
    }

    /* ═══════════════════════════════════════════════════
       ALERT
       ═══════════════════════════════════════════════════ */
    [data-slot="alert"] {
      border-radius: 10px !important;
      border: 1px solid #e4e7ed !important;
    }

    /* ═══════════════════════════════════════════════════
       TEXTAREA
       ═══════════════════════════════════════════════════ */
    [data-slot="textarea"] {
      border: 1px solid #dfe2e9 !important;
      border-radius: 8px !important;
      font-size: 13px !important;
      transition: all 0.12s ease !important;
      background: #ffffff !important;
    }

    [data-slot="textarea"]:focus {
      border-color: #a5b4fc !important;
      box-shadow: 0 0 0 3px rgba(165,180,252,0.15) !important;
    }

    /* ═══════════════════════════════════════════════════
       CHECKBOX
       ═══════════════════════════════════════════════════ */
    [data-slot="checkbox"][data-state="checked"] {
      background: #6366f1 !important;
      border-color: #6366f1 !important;
    }

    /* ═══════════════════════════════════════════════════
       RADIO
       ═══════════════════════════════════════════════════ */
    [data-slot="radio-group-item"][data-state="checked"] {
      border-color: #6366f1 !important;
    }

    [data-slot="radio-group-item"][data-state="checked"] [data-slot="radio-group-indicator"] {
      background: #6366f1 !important;
    }

    /* ═══════════════════════════════════════════════════
       诊断 UI — 模态框内表格/卡片/统计
       ═══════════════════════════════════════════════════ */
    /* 诊断进度条 */
    [data-slot="dialog-content"] [class*="border-primary/20"] {
      background: #ffffff !important;
      border: 1px solid #e0e7ff !important;
      border-radius: 10px !important;
    }
    [data-slot="dialog-content"] [class*="border-primary/20"] .text-primary {
      color: #6366f1 !important;
    }

    /* 诊断统计摘要卡片 */
    [data-slot="dialog-content"] .grid-cols-3 > div:not([class*="bg-success"]):not([class*="bg-danger"]) {
      background: #ffffff !important;
      border: 1px solid #e8eaef !important;
      border-radius: 10px !important;
    }
    [data-slot="dialog-content"] [class*="bg-success-50"] {
      background: #ecfdf5 !important;
      border-color: #a7f3d0 !important;
    }
    [data-slot="dialog-content"] [class*="bg-danger-50"] {
      background: #fff1f2 !important;
      border-color: #fecdd3 !important;
    }

    /* 诊断表格分区容器 */
    [data-slot="dialog-content"] [class*="border-divider"][class*="rounded-lg"] {
      border: none !important;
      background: #ffffff !important;
      border-radius: 10px !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02) !important;
      overflow: hidden !important;
    }

    /* 分区标题栏 — 白色 + 左侧浅紫竖条 */
    [data-slot="dialog-content"] [class*="bg-primary/10"] {
      background: #ffffff !important;
      border-bottom: 1px solid #f0f2f5 !important;
      position: relative !important;
      padding: 12px 16px !important;
    }
    [data-slot="dialog-content"] [class*="bg-primary/10"]::before {
      content: "" !important;
      position: absolute !important;
      left: 0 !important;
      top: 4px !important;
      bottom: 4px !important;
      width: 3px !important;
      background: #a5b4fc !important;
      border-radius: 0 2px 2px 0 !important;
    }
    [data-slot="dialog-content"] [class*="bg-primary/10"] h3 {
      font-size: 13px !important;
      font-weight: 600 !important;
      color: #374151 !important;
    }

    /* 诊断表格表头 */
    [data-slot="dialog-content"] thead[class*="bg-default-100"] {
      background: #f7f8fa !important;
    }
    [data-slot="dialog-content"] thead th {
      font-weight: 600 !important;
      font-size: 11px !important;
      color: #7a7f8e !important;
      text-transform: uppercase !important;
      letter-spacing: 0.04em !important;
    }

    /* 诊断表格行 */
    [data-slot="dialog-content"] tbody tr {
      transition: background 0.1s ease !important;
    }
    [data-slot="dialog-content"] tbody tr:hover {
      background: #f7f8fa !important;
    }

    /* 诊断状态圆点 */
    [data-slot="dialog-content"] [class*="rounded-full"][class*="bg-success"] {
      background: #10b981 !important;
    }
    [data-slot="dialog-content"] [class*="rounded-full"][class*="bg-danger"] {
      background: #e11d48 !important;
    }

    /* 诊断空状态 */
    [data-slot="dialog-content"] [class*="py-16"] [class*="rounded-full"] {
      background: #eff1f5 !important;
    }

    /* 诊断移动端卡片 */
    [data-slot="dialog-content"] [class*="md:hidden"] [class*="border-warning-200"],
    [data-slot="dialog-content"] [class*="md:hidden"] [class*="border-danger-200"] {
      border-radius: 10px !important;
    }
    [data-slot="dialog-content"] [class*="md:hidden"] [class*="border-divider"][class*="bg-white"] {
      background: #ffffff !important;
      border: 1px solid #e8eaef !important;
      border-radius: 10px !important;
    }

    /* 诊断移动端分组标题 */
    [data-slot="dialog-content"] [class*="md:hidden"] [class*="bg-primary/10"] {
      background: #ffffff !important;
      border: 1px solid #e0e7ff !important;
      border-radius: 10px !important;
      position: relative !important;
    }
    [data-slot="dialog-content"] [class*="md:hidden"] [class*="bg-primary/10"]::before {
      content: "" !important;
      position: absolute !important;
      left: 0 !important;
      top: 4px !important;
      bottom: 4px !important;
      width: 3px !important;
      background: #a5b4fc !important;
      border-radius: 0 2px 2px 0 !important;
    }

    /* 诊断"失败详情"标题 */
    [data-slot="dialog-content"] h4[class*="text-danger"] {
      font-size: 13px !important;
      font-weight: 600 !important;
    }

    /* ═══════════════════════════════════════════════════
       COLOR FIXES — 全局颜色统一
       ═══════════════════════════════════════════════════ */
    [class*="bg-gray-50"] { background: #f7f8fa !important; }
    [class*="bg-gray-100"] { background: #eff1f5 !important; }
    [class*="bg-gray-200"] { background: #e4e7ed !important; }
    [class*="bg-gray-700"] { background: #2c3141 !important; }
    [class*="bg-gray-800"] { background: #1a1c24 !important; }
    [class*="bg-gray-900"] { background: #0d0f15 !important; }
    [class*="border-gray-200"] { border-color: #e4e7ed !important; }
    [class*="text-gray-500"], [class*="text-gray-400"] { color: #7a7f8e !important; }

    /* ═══════════════════════════════════════════════════
       RECHARTS
       ═══════════════════════════════════════════════════ */
    .recharts-default-tooltip {
      background: #ffffff !important;
      border: 1px solid #e8eaef !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 16px rgba(0,0,0,0.04) !important;
    }
    .recharts-cartesian-grid-horizontal line,
    .recharts-cartesian-grid-vertical line {
      stroke: #eff1f5 !important;
    }

    /* ═══════════════════════════════════════════════════
       ANNOUNCEMENT BANNER
       ═══════════════════════════════════════════════════ */
    [class*="from-blue-50"] {
      background: #ffffff !important;
      border: 1px solid #e0e7ff !important;
      border-radius: 10px !important;
    }

    /* ═══════════════════════════════════════════════════
       DARK MODE
       ═══════════════════════════════════════════════════ */
    .dark [data-slot="card"],
    .dark [class*="metric-card"],
    .dark [class*="MetricCard"] {
      background: #14161d !important;
    }

    .dark [data-slot="card-header"] {
      border-bottom: 1px solid #1a1c24 !important;
    }

    .dark [data-slot="card-title"] {
      color: #e5e9f0 !important;
    }

    .dark [data-slot="button"][class*="variant-default"]:not([class*="ghost"]):not([class*="link"]):not([class*="outline"]),
    .dark [data-slot="button"][class*="bg-secondary"] {
      background: #1a1c24 !important;
      color: #c6cbd8 !important;
    }

    .dark [data-slot="button"][class*="variant-default"]:hover:not([class*="ghost"]):not([class*="link"]):not([class*="outline"]),
    .dark [data-slot="button"][class*="bg-secondary"]:hover {
      background: #262833 !important;
    }

    .dark [data-slot="input"],
    .dark [data-slot="select-trigger"],
    .dark [data-slot="textarea"] {
      background: #16181f !important;
      border-color: #1a1c24 !important;
    }

    .dark [data-slot="input"]:focus,
    .dark [data-slot="select-trigger"]:focus-within,
    .dark [data-slot="textarea"]:focus {
      border-color: #a5b4fc !important;
    }

    .dark [data-slot="select-content"] {
      background: #14161d !important;
      border-color: #1a1c24 !important;
    }

    .dark [data-slot="select-item"][data-highlighted] {
      background: #1a1c24 !important;
    }

    .dark [data-slot="table-body"] [data-slot="table-row"] {
      background: #14161d !important;
    }

    .dark [data-slot="table-cell"] {
      color: #c6cbd8 !important;
    }

    .dark [data-slot="table-head"] {
      color: #5d6172 !important;
    }

    .dark [data-slot="dialog-content"] {
      background: #14161d !important;
    }

    .dark [data-slot="dialog-header"],
    .dark [data-slot="dialog-footer"] {
      border-color: #1a1c24 !important;
    }

    .dark [data-slot="dropdown-menu-content"] {
      background: #14161d !important;
      border-color: #1a1c24 !important;
    }

    .dark [data-slot="dropdown-menu-item"]:hover {
      background: #1a1c24 !important;
    }

    .dark [data-slot="progress"] {
      background: #1a1c24 !important;
    }

    .dark [data-slot="tabs-list"] {
      border-bottom: 1px solid #1a1c24 !important;
    }

    .dark [data-slot="separator"] {
      background: #1a1c24 !important;
    }

    .dark [class*="h-screen"] {
      background: #0d0f15 !important;
    }

    .dark aside[class*="flex"][class*="flex-col"][class*="h-full"],
    .dark header[class*="top-0"] {
      background: #0d0f15 !important;
      border-color: #1a1c24 !important;
    }

    .dark ::-webkit-scrollbar-thumb { background: #262833; }
    .dark ::-webkit-scrollbar-thumb:hover { background: #3b3e4d; }

    /* 暗色: 诊断进度条 */
    .dark [data-slot="dialog-content"] [class*="border-primary/20"] {
      background: #14161d !important;
      border-color: #1e2228 !important;
    }
    .dark [data-slot="dialog-content"] [class*="border-primary/20"] .text-primary {
      color: #818cf8 !important;
    }
    .dark [data-slot="dialog-content"] .grid-cols-3 > div:not([class*="bg-success"]):not([class*="bg-danger"]) {
      background: #14161d !important;
      border-color: #1a1c24 !important;
    }
    .dark [data-slot="dialog-content"] [class*="bg-success-50"] {
      background: #022c22 !important;
      border-color: #065f46 !important;
    }
    .dark [data-slot="dialog-content"] [class*="bg-danger-50"] {
      background: #2d0a12 !important;
      border-color: #881337 !important;
    }
    .dark [data-slot="dialog-content"] [class*="border-divider"][class*="rounded-lg"] {
      background: #14161d !important;
      box-shadow: none !important;
    }
    .dark [data-slot="dialog-content"] [class*="bg-primary/10"] {
      background: #14161d !important;
      border-bottom: 1px solid #1a1c24 !important;
    }
    .dark [data-slot="dialog-content"] [class*="bg-primary/10"] h3 {
      color: #c6cbd8 !important;
    }
    .dark [data-slot="dialog-content"] thead[class*="bg-default-100"] {
      background: #0d0f15 !important;
    }
    .dark [data-slot="dialog-content"] thead th {
      color: #5d6172 !important;
    }
    .dark [data-slot="dialog-content"] tbody tr:hover {
      background: #0d0f15 !important;
    }
    .dark [data-slot="dialog-content"] [class*="py-16"] [class*="rounded-full"] {
      background: #1a1c24 !important;
    }
    .dark [data-slot="dialog-content"] [class*="md:hidden"] [class*="border-divider"][class*="bg-white"] {
      background: #14161d !important;
      border-color: #1a1c24 !important;
    }
    .dark [data-slot="dialog-content"] [class*="md:hidden"] [class*="bg-primary/10"] {
      background: #14161d !important;
      border-color: #1e2228 !important;
    }

    .dark [class*="bg-gray-50"],
    .dark [class*="bg-gray-100"] { background: #0d0f15 !important; }
    .dark [class*="bg-gray-200"] { background: #1a1c24 !important; }
    .dark [class*="bg-gray-700"] { background: #1a1c24 !important; }
    .dark [class*="bg-gray-800"] { background: #14161d !important; }
    .dark [class*="bg-gray-900"] { background: #0d0f15 !important; }
    .dark [class*="border-gray-200"] { border-color: #1a1c24 !important; }
    .dark [class*="text-gray-500"], .dark [class*="text-gray-400"] { color: #5d6172 !important; }
    .dark [class*="from-blue-50"] { background: #14161d !important; border-color: #1a1c24 !important; }
    .dark .recharts-default-tooltip { background: #14161d !important; border-color: #1a1c24 !important; }
    .dark .recharts-cartesian-grid-horizontal line,
    .dark .recharts-cartesian-grid-vertical line { stroke: #1a1c24 !important; }
  `,
};

export default nezhaTheme;
