import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/shadcn-bridge/heroui/button";
import { Card, CardBody } from "@/shadcn-bridge/heroui/card";
import { Chip } from "@/shadcn-bridge/heroui/chip";
import { Input } from "@/shadcn-bridge/heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/shadcn-bridge/heroui/modal";
import { Select, SelectItem } from "@/shadcn-bridge/heroui/select";
import { Switch } from "@/shadcn-bridge/heroui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/shadcn-bridge/heroui/table";
import {
  cleanupBalanceLogs,
  deleteBalanceLog,
  getAllPaymentConfigs,
  getBalanceList,
  getBalanceLogs,
  getPaymentStats,
  savePaymentConfig,
  setUserBalance,
} from "@/api";
import type {
  BalanceLogApiItem,
  BalanceWithUserApiItem,
  PaymentConfigApiItem,
  PaymentStatsApiData,
} from "@/api/types";

type UsdtForm = {
  enabled: boolean;
  api_url: string;
  pid: string;
  secret_key: string;
  notify_url: string;
  return_url: string;
  currency: string;
  token: string;
  network: string;
};

type YiPayForm = {
  enabled: boolean;
  gateway_url: string;
  pid: string;
  key: string;
  notify_url: string;
  return_url: string;
};

const defaultUsdt: UsdtForm = {
  enabled: false,
  api_url: "",
  pid: "",
  secret_key: "",
  notify_url: "",
  return_url: "",
  currency: "cny",
  token: "usdt",
  network: "tron",
};

const defaultYiPay: YiPayForm = {
  enabled: false,
  gateway_url: "",
  pid: "",
  key: "",
  notify_url: "",
  return_url: "",
};

const formatMoney = (value: number) => Number(value || 0).toFixed(2);
const formatTime = (value?: number) => (value ? new Date(value).toLocaleString("zh-CN") : "-");

const parseConfig = <T,>(configs: PaymentConfigApiItem[], channel: string, fallback: T): T => {
  const found = configs.find((item) => item.channel === channel);
  if (!found) return fallback;
  try {
    return { ...fallback, ...JSON.parse(found.config || "{}"), enabled: found.enabled === 1 };
  } catch {
    return { ...fallback, enabled: found.enabled === 1 };
  }
};

export default function AdminBalancesPage() {
  const [tab, setTab] = useState<"payment" | "logs">("payment");
  const [balances, setBalances] = useState<BalanceWithUserApiItem[]>([]);
  const [logs, setLogs] = useState<BalanceLogApiItem[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [logUserId, setLogUserId] = useState("all");
  const [stats, setStats] = useState<PaymentStatsApiData>({ paidAmount: 0, paidOrders: 0, pendingOrders: 0 });
  const [usdt, setUsdt] = useState<UsdtForm>(defaultUsdt);
  const [yipay, setYipay] = useState<YiPayForm>(defaultYiPay);
  const [providerTab, setProviderTab] = useState<"USDT" | "YIPAY">("USDT");
  const [editUser, setEditUser] = useState<BalanceWithUserApiItem | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteLog, setDeleteLog] = useState<BalanceLogApiItem | null>(null);

  const panelUrl = typeof window !== "undefined" ? window.location.origin : "";

  const balanceStats = useMemo(() => {
    const total = balances.reduce((sum, item) => sum + Number(item.balance || 0), 0);
    const funded = balances.filter((item) => Number(item.balance || 0) > 0).length;

    return { total, funded, users: balances.length };
  }, [balances]);

  const loadPayment = async () => {
    const [configRes, statsRes, balanceRes] = await Promise.all([
      getAllPaymentConfigs(),
      getPaymentStats(),
      getBalanceList(),
    ]);
    if (configRes.code === 0) {
      const configs = configRes.data || [];
      setUsdt(parseConfig(configs, "USDT", { ...defaultUsdt, notify_url: `${panelUrl}/api/v1/payment/callback/usdt`, return_url: panelUrl }));
      setYipay(parseConfig(configs, "YIPAY", { ...defaultYiPay, notify_url: `${panelUrl}/api/v1/payment/callback/yipay`, return_url: panelUrl }));
    }
    if (statsRes.code === 0) setStats(statsRes.data);
    if (balanceRes.code === 0) setBalances(balanceRes.data || []);
  };

  const loadLogs = async () => {
    const res = await getBalanceLogs({
      page: logPage,
      size: 20,
      userId: logUserId === "all" ? undefined : Number(logUserId),
    });
    if (res.code === 0) {
      setLogs(res.data?.list || []);
      setLogTotal(res.data?.total || 0);
    }
  };

  useEffect(() => {
    void loadPayment();
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [logPage, logUserId]);

  const saveUsdt = async () => {
    setSaving(true);
    const { enabled, ...config } = usdt;
    const res = await savePaymentConfig({ channel: "USDT", enabled: enabled ? 1 : 0, config });
    setSaving(false);
    if (res.code === 0) {
      toast.success("USDT 支付配置已保存");
      void loadPayment();
    } else {
      toast.error(res.msg || "保存失败");
    }
  };

  const saveYiPay = async () => {
    setSaving(true);
    const { enabled, ...config } = yipay;
    const res = await savePaymentConfig({ channel: "YIPAY", enabled: enabled ? 1 : 0, config });
    setSaving(false);
    if (res.code === 0) {
      toast.success("易支付配置已保存");
      void loadPayment();
    } else {
      toast.error(res.msg || "保存失败");
    }
  };

  const saveBalance = async () => {
    if (!editUser) return;
    const value = Number(editAmount);
    if (!Number.isFinite(value) || value < 0) {
      toast.error("请输入有效余额");
      return;
    }
    const res = await setUserBalance(editUser.userId, value);
    if (res.code === 0) {
      toast.success("余额已更新，并已写入流水");
      setEditUser(null);
      void loadPayment();
      void loadLogs();
    } else {
      toast.error(res.msg || "保存失败");
    }
  };

  const confirmDeleteLog = async () => {
    if (!deleteLog) return;
    const res = await deleteBalanceLog(deleteLog.id);
    if (res.code === 0) {
      toast.success("流水已删除");
      setDeleteLog(null);
      void loadLogs();
    } else {
      toast.error(res.msg || "删除失败");
    }
  };

  const cleanupInvalid = async () => {
    const res = await cleanupBalanceLogs();
    if (res.code === 0) {
      toast.success(`已清理 ${res.data?.deleted || 0} 条异常流水`);
      void loadLogs();
    } else {
      toast.error(res.msg || "清理失败");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <section className="rounded-3xl border border-divider bg-gradient-to-br from-background to-default-100/70 p-6 shadow-sm dark:to-default-50/10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.3em] text-primary">Payment Center</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">支付管理</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-default-500">
              管理余额流水账单、USDT 支付和易支付。兑换码和折扣码按要求未迁入。
            </p>
          </div>
          <div className="grid min-w-full gap-3 sm:grid-cols-3 lg:min-w-[560px]">
            <div className="rounded-2xl border border-divider bg-background p-4">
              <div className="text-xs text-default-500">支付总额</div>
              <div className="mt-1 text-2xl font-semibold">¥ {formatMoney(stats.paidAmount)}</div>
            </div>
            <div className="rounded-2xl border border-divider bg-background p-4">
              <div className="text-xs text-default-500">完成订单</div>
              <div className="mt-1 text-2xl font-semibold">{stats.paidOrders}</div>
            </div>
            <div className="rounded-2xl border border-divider bg-background p-4">
              <div className="text-xs text-default-500">余额总计</div>
              <div className="mt-1 text-2xl font-semibold">¥ {formatMoney(balanceStats.total)}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button color={tab === "payment" ? "primary" : "default"} variant={tab === "payment" ? "solid" : "flat"} onPress={() => setTab("payment")}>支付配置</Button>
        <Button color={tab === "logs" ? "primary" : "default"} variant={tab === "logs" ? "solid" : "flat"} onPress={() => setTab("logs")}>余额流水</Button>
      </div>

      {tab === "payment" ? (
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Card className="border border-divider shadow-sm">
            <CardBody className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-foreground">支付渠道</div>
                  <div className="text-sm text-default-500">配置 USDT 和易支付</div>
                </div>
                <Chip color={usdt.enabled || yipay.enabled ? "success" : "default"} variant="flat">
                  {usdt.enabled || yipay.enabled ? "已启用" : "未启用"}
                </Chip>
              </div>
              <div className="grid gap-3">
                <button className={`rounded-2xl border p-4 text-left transition ${providerTab === "USDT" ? "border-primary bg-primary/5" : "border-divider"}`} onClick={() => setProviderTab("USDT")}>
                  <div className="flex justify-between">
                    <span className="font-semibold">USDT 支付</span>
                    <Chip color={usdt.enabled ? "success" : "default"} size="sm" variant="flat">{usdt.enabled ? "开启" : "关闭"}</Chip>
                  </div>
                  <p className="mt-1 text-xs text-default-500">Epusdt / GMPay，自托管 USDT 网关</p>
                </button>
                <button className={`rounded-2xl border p-4 text-left transition ${providerTab === "YIPAY" ? "border-primary bg-primary/5" : "border-divider"}`} onClick={() => setProviderTab("YIPAY")}>
                  <div className="flex justify-between">
                    <span className="font-semibold">易支付</span>
                    <Chip color={yipay.enabled ? "success" : "default"} size="sm" variant="flat">{yipay.enabled ? "开启" : "关闭"}</Chip>
                  </div>
                  <p className="mt-1 text-xs text-default-500">支付宝/微信扫码聚合支付</p>
                </button>
              </div>
            </CardBody>
          </Card>

          {providerTab === "USDT" ? (
            <Card className="border border-divider shadow-sm">
              <CardBody className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold">USDT 支付</div>
                    <div className="text-sm text-default-500">对接 Epusdt / GMPay 网关</div>
                  </div>
                  <Switch isSelected={usdt.enabled} onValueChange={(enabled) => setUsdt((prev) => ({ ...prev, enabled }))}>启用</Switch>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="API 地址" placeholder="https://epusdt.example.com" value={usdt.api_url} variant="bordered" onChange={(e) => setUsdt((p) => ({ ...p, api_url: e.target.value }))} />
                  <Input label="商户 PID" value={usdt.pid} variant="bordered" onChange={(e) => setUsdt((p) => ({ ...p, pid: e.target.value }))} />
                  <Input label="商户密钥" value={usdt.secret_key} variant="bordered" onChange={(e) => setUsdt((p) => ({ ...p, secret_key: e.target.value }))} />
                  <Select label="网络" selectedKeys={[usdt.network]} variant="bordered" onSelectionChange={(keys) => setUsdt((p) => ({ ...p, network: String(Array.from(keys)[0] || "tron") }))}>
                    <SelectItem key="tron">TRC-20</SelectItem>
                    <SelectItem key="bsc">BEP-20</SelectItem>
                    <SelectItem key="ethereum">ERC-20</SelectItem>
                    <SelectItem key="polygon">Polygon</SelectItem>
                  </Select>
                  <Input label="币种" value={usdt.currency} variant="bordered" onChange={(e) => setUsdt((p) => ({ ...p, currency: e.target.value }))} />
                  <Input label="Token" value={usdt.token} variant="bordered" onChange={(e) => setUsdt((p) => ({ ...p, token: e.target.value }))} />
                  <Input label="回调地址" value={usdt.notify_url} variant="bordered" onChange={(e) => setUsdt((p) => ({ ...p, notify_url: e.target.value }))} />
                  <Input label="返回地址" value={usdt.return_url} variant="bordered" onChange={(e) => setUsdt((p) => ({ ...p, return_url: e.target.value }))} />
                </div>
                <Button color="primary" isLoading={saving} onPress={saveUsdt}>保存 USDT 配置</Button>
              </CardBody>
            </Card>
          ) : (
            <Card className="border border-divider shadow-sm">
              <CardBody className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold">易支付</div>
                    <div className="text-sm text-default-500">支付宝/微信扫码支付网关</div>
                  </div>
                  <Switch isSelected={yipay.enabled} onValueChange={(enabled) => setYipay((prev) => ({ ...prev, enabled }))}>启用</Switch>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="易支付网关" placeholder="https://pay.example.com/" value={yipay.gateway_url} variant="bordered" onChange={(e) => setYipay((p) => ({ ...p, gateway_url: e.target.value }))} />
                  <Input label="商户 PID" value={yipay.pid} variant="bordered" onChange={(e) => setYipay((p) => ({ ...p, pid: e.target.value }))} />
                  <Input label="商户 Key" value={yipay.key} variant="bordered" onChange={(e) => setYipay((p) => ({ ...p, key: e.target.value }))} />
                  <Input label="回调地址" value={yipay.notify_url} variant="bordered" onChange={(e) => setYipay((p) => ({ ...p, notify_url: e.target.value }))} />
                  <Input label="返回地址" value={yipay.return_url} variant="bordered" onChange={(e) => setYipay((p) => ({ ...p, return_url: e.target.value }))} />
                </div>
                <Button color="primary" isLoading={saving} onPress={saveYiPay}>保存易支付配置</Button>
              </CardBody>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold">余额流水账单</h2>
              <p className="text-sm text-default-500">记录管理员调整余额、余额购买套餐等账单流水。</p>
            </div>
            <div className="flex gap-2">
              <Select selectedKeys={[logUserId]} className="w-52" size="sm" onSelectionChange={(keys) => { setLogUserId(String(Array.from(keys)[0] || "all")); setLogPage(1); }}>
                <SelectItem key="all">全部用户</SelectItem>
                {balances.map((user) => <SelectItem key={String(user.userId)}>{user.userName}</SelectItem>)}
              </Select>
              <Button size="sm" variant="flat" onPress={cleanupInvalid}>清理异常流水</Button>
            </div>
          </div>
          <Card className="overflow-hidden border border-divider shadow-sm">
            <CardBody className="p-0">
              <Table aria-label="余额流水">
                <TableHeader>
                  <TableColumn>用户</TableColumn>
                  <TableColumn>变动金额</TableColumn>
                  <TableColumn>变动前</TableColumn>
                  <TableColumn>变动后</TableColumn>
                  <TableColumn>原因</TableColumn>
                  <TableColumn>时间</TableColumn>
                  <TableColumn>操作</TableColumn>
                </TableHeader>
                <TableBody emptyContent="暂无流水">
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell><div className="font-medium">{log.userName}</div><div className="text-xs text-default-500">#{log.userId}</div></TableCell>
                      <TableCell className={log.amount >= 0 ? "text-emerald-600" : "text-danger"}>{log.amount >= 0 ? "+" : ""}{formatMoney(log.amount)}</TableCell>
                      <TableCell>¥ {formatMoney(log.balanceBefore)}</TableCell>
                      <TableCell>¥ {formatMoney(log.balanceAfter)}</TableCell>
                      <TableCell className="text-xs">{log.reason}</TableCell>
                      <TableCell className="text-xs">{formatTime(log.createdTime)}</TableCell>
                      <TableCell><Button color="danger" size="sm" variant="flat" onPress={() => setDeleteLog(log)}>删除</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
          <div className="flex items-center justify-between text-sm text-default-500">
            <span>共 {logTotal} 条</span>
            <div className="flex gap-2">
              <Button isDisabled={logPage <= 1} size="sm" variant="flat" onPress={() => setLogPage((p) => Math.max(1, p - 1))}>上一页</Button>
              <Button isDisabled={logPage * 20 >= logTotal} size="sm" variant="flat" onPress={() => setLogPage((p) => p + 1)}>下一页</Button>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={Boolean(editUser)} onClose={() => setEditUser(null)}>
        <ModalContent>
          <ModalHeader>设置支付余额</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="rounded-2xl border border-divider p-4">
                <div className="text-sm text-default-500">用户</div>
                <div className="mt-1 font-semibold">{editUser?.userName}</div>
              </div>
              <Input label="余额" type="number" value={editAmount} variant="bordered" onChange={(e) => setEditAmount(e.target.value)} />
            </div>
          </ModalBody>
          <ModalFooter><Button variant="light" onPress={() => setEditUser(null)}>取消</Button><Button color="primary" onPress={saveBalance}>保存</Button></ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={Boolean(deleteLog)} onClose={() => setDeleteLog(null)}>
        <ModalContent>
          <ModalHeader>删除流水</ModalHeader>
          <ModalBody>删除流水后不可恢复，用户余额不会自动变动。</ModalBody>
          <ModalFooter><Button variant="light" onPress={() => setDeleteLog(null)}>取消</Button><Button color="danger" onPress={confirmDeleteLog}>删除</Button></ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
