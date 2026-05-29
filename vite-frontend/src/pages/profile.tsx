import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { Card, CardBody } from "@/shadcn-bridge/heroui/card";
import { Button } from "@/shadcn-bridge/heroui/button";
import { Chip } from "@/shadcn-bridge/heroui/chip";
import { Spinner } from "@/shadcn-bridge/heroui/spinner";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@/shadcn-bridge/heroui/modal";
import { Input } from "@/shadcn-bridge/heroui/input";
import { getMyOBSCode, getUserBalance, getUserOrderList, getUserPackageInfo, getUserPlans, updatePassword } from "@/api";
import type { OBSCodeAssignmentApiItem, OrderApiItem, UserPackageInfoApiData, UserPlanApiItem } from "@/api/types";
import { safeLogout } from "@/utils/logout";
import { getAdminFlag, getRoleId, getSessionName } from "@/utils/session";

const GB = 1024 * 1024 * 1024;

const formatBytes = (bytes: number) => {
  if (!bytes || bytes <= 0) return "0 GB";
  const gb = bytes / GB;
  if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`;
  return `${gb.toFixed(1)} GB`;
};

const formatTimestamp = (value?: number | string) => {
  if (!value || value === "permanent") return "永久";
  const time = typeof value === "string" ? Number(value) || Date.parse(value) : value;
  if (!time || Number.isNaN(time)) return "永久";
  return new Date(time).toLocaleDateString("zh-CN");
};

const orderDate = (seconds: number) => seconds ? new Date(seconds * 1000).toLocaleString("zh-CN") : "-";

const orderStatus: Record<number, { label: string; color: "warning" | "success" | "default" | "danger" }> = {
  0: { label: "待支付", color: "warning" },
  1: { label: "已完成", color: "success" },
  2: { label: "已取消", color: "default" },
  3: { label: "已退款", color: "danger" },
};

const payName: Record<string, string> = {
  BALANCE: "余额",
  USDT: "USDT",
  YIPAY: "微信/支付宝",
};

const isActivePlan = (plan: UserPlanApiItem) => {
  if (plan.status !== 1) return false;
  if (!plan.endTime) return true;
  return plan.endTime > Date.now();
};

interface PasswordForm {
  newUsername: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [packageInfo, setPackageInfo] = useState<UserPackageInfoApiData | null>(null);
  const [userPlans, setUserPlans] = useState<UserPlanApiItem[]>([]);
  const [orders, setOrders] = useState<OrderApiItem[]>([]);
  const [obsAssignment, setObsAssignment] = useState<OBSCodeAssignmentApiItem | null>(null);
  const [balance, setBalance] = useState(0);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    newUsername: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // 获取用户信息
    setUsername(getSessionName() || "Admin");
    setRoleId(getRoleId());
    setIsAdmin(getAdminFlag());
    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const [pkgRes, planRes, balanceRes, orderRes, obsRes] = await Promise.all([
          getUserPackageInfo(),
          getUserPlans(),
          getUserBalance(),
          getUserOrderList({ page: 1, size: 10 }),
          getMyOBSCode(),
        ]);
        if (pkgRes.code === 0) setPackageInfo(pkgRes.data || null);
        if (planRes.code === 0) setUserPlans(planRes.data || []);
        if (balanceRes.code === 0) setBalance(balanceRes.data?.balance || 0);
        if (orderRes.code === 0) setOrders(orderRes.data?.list || []);
        if (obsRes.code === 0) setObsAssignment(obsRes.data || null);
      } finally {
        setProfileLoading(false);
      }
    };
    void loadProfile();
  }, []);

  const userInfo = (packageInfo?.userInfo || {}) as UserPackageInfoApiData["userInfo"];
  const activePlans = userPlans.filter(isActivePlan).slice(0, 1);
  const planTrafficBytes = activePlans.reduce(
    (sum, plan) => sum + Number(plan.trafficQuota || 0),
    0,
  );
  const usedTrafficBytes = Number(userInfo.inFlow || 0) + Number(userInfo.outFlow || 0);
  const totalTrafficBytes = planTrafficBytes > 0 ? planTrafficBytes : Number(userInfo.flow || 0) * GB;
  const remainingTrafficBytes = Math.max(totalTrafficBytes - usedTrafficBytes, 0);
  const planRules = activePlans.reduce((sum, plan) => sum + Number(plan.ruleQuota || 0), 0);
  const totalRules = planRules > 0 ? planRules : Number(userInfo.num || 0);

  // 管理员菜单项
  const adminMenuItems: MenuItem[] = [
    {
      path: "/limit",
      label: "限速管理",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            clipRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            fillRule="evenodd"
          />
        </svg>
      ),
      color:
        "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400",
      description: "管理用户限速策略",
    },
    {
      path: "/panel-sharing",
      label: "面板共享",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
        </svg>
      ),
      color:
        "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
      description: "与其他面板进行联邦共享",
    },
    {
      path: "/group",
      label: "分组管理",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a3 3 0 100 6 3 3 0 000-6zM4 9a3 3 0 100 6 3 3 0 000-6zm12 0a3 3 0 100 6 3 3 0 000-6M4 16a2 2 0 00-2 2h4a2 2 0 00-2-2zm12 0a2 2 0 00-2 2h4a2 2 0 00-2-2zm-6 0a2 2 0 00-2 2h4a2 2 0 00-2-2z" />
        </svg>
      ),
      color:
        "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400",
      description: "管理用户和隧道分组",
    },
    {
      path: "/user",
      label: "用户管理",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
      ),
      color: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
      description: "管理系统用户",
    },
    {
      path: "/config",
      label: "网站配置",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            clipRule="evenodd"
            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
            fillRule="evenodd"
          />
        </svg>
      ),
      color:
        "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400",
      description: "配置网站设置",
    },
  ];

  // 退出登录
  const handleLogout = () => {
    safeLogout();
    navigate("/", { replace: true });
  };

  // 密码表单验证
  const validatePasswordForm = (): boolean => {
    if (!passwordForm.newUsername.trim()) {
      toast.error("请输入新用户名");

      return false;
    }
    if (passwordForm.newUsername.length < 3) {
      toast.error("用户名长度至少3位");

      return false;
    }
    if (!passwordForm.currentPassword) {
      toast.error("请输入当前密码");

      return false;
    }
    if (!passwordForm.newPassword) {
      toast.error("请输入新密码");

      return false;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("新密码长度不能少于6位");

      return false;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("两次输入密码不一致");

      return false;
    }

    return true;
  };

  // 提交密码修改
  const handlePasswordSubmit = async () => {
    if (!validatePasswordForm()) return;

    setPasswordLoading(true);
    try {
      const response = await updatePassword(passwordForm);

      if (response.code === 0) {
        toast.success("密码修改成功，请重新登录");
        onOpenChange();
        handleLogout();
      } else {
        toast.error(response.msg || "密码修改失败");
      }
    } catch {
      toast.error("修改密码时发生错误");
    } finally {
      setPasswordLoading(false);
    }
  };

  // 重置密码表单
  const resetPasswordForm = () => {
    setPasswordForm({
      newUsername: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="px-3 lg:px-6 py-8 flex flex-col h-full">
      <div className="space-y-5 flex-1">
        {/* 用户信息卡片 */}
        <Card className="border border-gray-200 dark:border-default-200 shadow-md hover:shadow-lg transition-shadow">
          <CardBody className="p-5">
            <div className="flex items-center justify-center gap-4 md:justify-start md:pl-8">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    fillRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-medium text-foreground">
                  {username}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-medium ${
                      isAdmin
                        ? "bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300"
                        : "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                    }`}
                  >
                    {roleId === 2 ? "副管理员" : isAdmin ? "管理员" : "普通用户"}
                  </span>
                  <span className="text-xs text-default-500">
                    {new Date().toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 个人中心额度 */}
        <Card className="border border-gray-200 dark:border-default-200 shadow-md">
          <CardBody className="p-4 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-foreground">个人中心</h3>
                <p className="text-sm text-default-500">余额、套餐余量、到期时间和规则数量</p>
              </div>
              {profileLoading && <Spinner size="sm" />}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="flex min-h-24 flex-col justify-between rounded-xl bg-default-50 p-4 dark:bg-default-100/40">
                <div className="text-xs text-default-500">账户余额</div>
                <div className="text-2xl font-bold text-foreground">{balance}</div>
              </div>
              <div className="flex min-h-24 flex-col justify-between rounded-xl bg-default-50 p-4 dark:bg-default-100/40">
                <div className="text-xs text-default-500">流量余量</div>
                <div className="text-2xl font-bold text-foreground">{formatBytes(remainingTrafficBytes)}</div>
                <div className="text-xs text-default-400">总量 {formatBytes(totalTrafficBytes)}</div>
              </div>
              <div className="flex min-h-24 flex-col justify-between rounded-xl bg-default-50 p-4 dark:bg-default-100/40">
                <div className="text-xs text-default-500">规则数量</div>
                <div className="text-2xl font-bold text-foreground">{totalRules || "不限"}</div>
                <div className="text-xs text-default-400">{planRules > 0 ? "套餐配额" : "账号配额"}</div>
              </div>
              <div className="flex min-h-24 flex-col justify-between rounded-xl bg-default-50 p-4 dark:bg-default-100/40">
                <div className="text-xs text-default-500">账号到期</div>
                <div className="text-xl font-bold text-foreground">{formatTimestamp(userInfo.expTime as string | number | undefined)}</div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-200 dark:border-default-200 shadow-md">
          <CardBody className="p-4 space-y-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">OBS 推流信息</h3>
              <p className="text-xs text-default-500">管理员分配的本地推流码和异地端输入码</p>
            </div>
            {obsAssignment ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-default-50 p-3 dark:bg-default-100/40">
                  <div className="text-xs text-default-500">本地 OBS 推流码</div>
                  <div className="mt-2 break-all font-mono text-sm text-foreground">{obsAssignment.pushCode}</div>
                </div>
                <div className="rounded-xl bg-default-50 p-3 dark:bg-default-100/40">
                  <div className="text-xs text-default-500">异地端 OBS 输入码</div>
                  <div className="mt-2 break-all font-mono text-sm text-foreground">{obsAssignment.inputCode}</div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-default-50 p-4 text-sm text-default-500 dark:bg-default-100/40">
                暂未分配 OBS 推流信息。
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="border border-gray-200 dark:border-default-200 shadow-md hover:shadow-lg transition-shadow">
          <CardBody className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">我的套餐</h3>
              <Chip color="primary" size="sm" variant="flat">{activePlans.length} 个有效</Chip>
            </div>
            {activePlans.length === 0 ? (
              <div className="rounded-xl bg-default-50 p-4 text-center text-sm text-default-500">暂无已购套餐</div>
            ) : (
              <div>
                {activePlans.map((plan) => {
                  const trafficQuota = Number(plan.trafficQuota || 0);
                  const trafficUsed = Number(plan.trafficUsed || 0);
                  const trafficRemaining = Math.max(trafficQuota - trafficUsed, 0);
                  const active = isActivePlan(plan);
                  return (
                    <div key={plan.id} className="rounded-xl border border-default-200 bg-background p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-foreground">{plan.planName || `套餐#${plan.planId}`}</div>
                          <div className="mt-1 text-xs text-default-500">到期时间: {formatTimestamp(plan.endTime)}</div>
                        </div>
                        <Chip color={active ? "success" : "default"} size="sm" variant="flat">
                          {active ? "有效" : "已失效"}
                        </Chip>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                        <div className="rounded-lg bg-default-50 p-2">
                          <div className="text-default-500">套餐余量</div>
                          <div className="mt-1 font-mono text-foreground">{trafficQuota > 0 ? formatBytes(trafficRemaining) : "不限"}</div>
                        </div>
                        <div className="rounded-lg bg-default-50 p-2">
                          <div className="text-default-500">规则数量</div>
                          <div className="mt-1 font-mono text-foreground">{plan.ruleQuota || "不限"}</div>
                        </div>
                        <div className="rounded-lg bg-default-50 p-2">
                          <div className="text-default-500">速率</div>
                          <div className="mt-1 font-mono text-foreground">{plan.speedLimit ? `${(plan.speedLimit / 1000000).toFixed(1)} Mbps` : "不限"}</div>
                        </div>
                        <div className="rounded-lg bg-default-50 p-2">
                          <div className="text-default-500">倍率</div>
                          <div className="mt-1 font-mono text-foreground">{plan.billingRatio || 1}x</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="border border-gray-200 dark:border-default-200 shadow-md hover:shadow-lg transition-shadow">
          <CardBody className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">订单记录</h3>
              <Chip color="primary" size="sm" variant="flat">{orders.length} 条</Chip>
            </div>
            {orders.length === 0 ? (
              <div className="rounded-xl bg-default-50 p-4 text-center text-sm text-default-500">暂无订单记录</div>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => {
                  const status = orderStatus[order.status] || orderStatus[0];
                  return (
                    <div key={order.id} className="rounded-xl border border-default-200 bg-background p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="font-mono text-xs text-default-500">{order.orderNo}</div>
                          <div className="mt-1 font-medium text-foreground">{order.productName}</div>
                          <div className="mt-1 text-xs text-default-500">{orderDate(order.createdAt)}</div>
                        </div>
                        <div className="flex items-center gap-2 sm:justify-end">
                          <span className="font-mono text-sm text-foreground">¥ {(order.amount / 100).toFixed(2)}</span>
                          <Chip color={status.color} size="sm" variant="flat">{status.label}</Chip>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-default-500">支付方式: {payName[order.payCurrency] || order.payCurrency}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* 功能网格 */}
        <Card className="border border-gray-200 dark:border-default-200 shadow-md hover:shadow-lg transition-shadow">
          <CardBody className="p-4">
            <div className="grid grid-cols-3 gap-3">
              {/* 管理员功能 */}
              {isAdmin &&
                adminMenuItems.map((item) => (
                  <button
                    key={item.path}
                    className="flex flex-col items-center p-3 rounded-2xl bg-gray-50 dark:bg-default-100 hover:bg-gray-100 dark:hover:bg-default-200 transition-colors duration-200"
                    onClick={() => navigate(item.path)}
                  >
                    <div
                      className={`w-10 h-10 ${item.color} rounded-full flex items-center justify-center mb-2`}
                    >
                      {item.icon}
                    </div>
                    <span className="text-xs text-foreground text-center">
                      {item.label}
                    </span>
                  </button>
                ))}

              {/* 修改密码 */}
              <button
                className="flex flex-col items-center p-3 rounded-2xl bg-gray-50 dark:bg-default-100 hover:bg-gray-100 dark:hover:bg-default-200 transition-colors duration-200"
                onClick={onOpen}
              >
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      clipRule="evenodd"
                      d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
                      fillRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-xs text-foreground text-center">
                  修改密码
                </span>
              </button>

              {/* 退出登录 */}
              <button
                className="flex flex-col items-center p-3 rounded-2xl bg-gray-50 dark:bg-default-100 hover:bg-gray-100 dark:hover:bg-default-200 transition-colors duration-200"
                onClick={handleLogout}
              >
                <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      clipRule="evenodd"
                      d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                      fillRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-xs text-foreground text-center">
                  退出登录
                </span>
              </button>
            </div>
          </CardBody>
        </Card>

      </div>

      {/* 修改密码弹窗 */}
      <Modal
        backdrop="blur"
        classNames={{
          base: "!w-[calc(100%-32px)] !mx-auto sm:!w-full rounded-2xl overflow-hidden",
        }}
        isOpen={isOpen}
        placement="center"
        scrollBehavior="outside"
        size="2xl"
        onOpenChange={() => {
          onOpenChange();
          resetPasswordForm();
        }}
      >
        <ModalContent>
          {(onClose: () => void) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                修改密码
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="新用户名"
                    placeholder="请输入新用户名（至少3位）"
                    value={passwordForm.newUsername}
                    variant="bordered"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newUsername: e.target.value,
                      }))
                    }
                  />
                  <Input
                    label="当前密码"
                    placeholder="请输入当前密码"
                    type="password"
                    value={passwordForm.currentPassword}
                    variant="bordered"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                  />
                  <Input
                    label="新密码"
                    placeholder="请输入新密码（至少6位）"
                    type="password"
                    value={passwordForm.newPassword}
                    variant="bordered"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                  />
                  <Input
                    label="确认密码"
                    placeholder="请再次输入新密码"
                    type="password"
                    value={passwordForm.confirmPassword}
                    variant="bordered"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  取消
                </Button>
                <Button
                  color="primary"
                  isLoading={passwordLoading}
                  onPress={handlePasswordSubmit}
                >
                  确定
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
