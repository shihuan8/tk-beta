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
  useDisclosure,
} from "@/shadcn-bridge/heroui/modal";
import { Radio, RadioGroup } from "@/shadcn-bridge/heroui/radio";
import { Select, SelectItem } from "@/shadcn-bridge/heroui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/shadcn-bridge/heroui/table";
import {
  createPlan,
  deletePlan,
  getPlanList,
  getStoreStatus,
  getTunnelGroupList,
  setStoreStatus,
  updatePlan,
} from "@/api";
import type { PlanApiItem, TunnelGroupApiItem } from "@/api/types";

const GB = 1024 * 1024 * 1024;

const formatTraffic = (bytes: number) => {
  if (bytes <= 0) return "不限";
  const gb = bytes / GB;

  return gb >= 1024 ? `${(gb / 1024).toFixed(1)} TB` : `${gb.toFixed(1)} GB`;
};

const formatSpeed = (bps: number) => {
  if (bps <= 0) return "不限";

  return `${(bps / 1_000_000).toFixed(1)} Mbps`;
};

const formatMoney = (value: number) => Number(value || 0).toFixed(2);

const defaultForm = {
  name: "",
  description: "",
  price: 0,
  trafficQuota: 0,
  speedLimit: 0,
  ruleQuota: 0,
  durationDays: 0,
  userGroupId: 0,
  tunnelGroupIds: [] as number[],
  status: 1,
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanApiItem[]>([]);
  const [tunnelGroups, setTunnelGroups] = useState<TunnelGroupApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeEnabled, setStoreEnabled] = useState(true);
  const [storeSaving, setStoreSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const stats = useMemo(() => {
    const online = plans.filter((plan) => plan.status === 1).length;
    const revenueBase = plans.reduce((sum, plan) => sum + Number(plan.price || 0), 0);

    return { total: plans.length, online, offline: plans.length - online, revenueBase };
  }, [plans]);

  const load = async () => {
    setLoading(true);
    const [planRes, tunnelGroupRes, storeRes] = await Promise.all([
      getPlanList(),
      getTunnelGroupList(),
      getStoreStatus(),
    ]);

    if (planRes.code === 0) setPlans(planRes.data || []);
    if (tunnelGroupRes.code === 0) setTunnelGroups(tunnelGroupRes.data || []);
    if (storeRes.code === 0) setStoreEnabled(Boolean(storeRes.data?.enabled));
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleStoreToggle = async (enabled: boolean) => {
    setStoreEnabled(enabled);
    setStoreSaving(true);
    const res = await setStoreStatus({ enabled });
    setStoreSaving(false);
    if (res.code === 0) {
      toast.success(enabled ? "商店已开启" : "商店已关闭");
    } else {
      setStoreEnabled(!enabled);
      toast.error(res.msg || "商店状态保存失败");
    }
  };

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    onOpen();
  };

  const openEdit = (plan: PlanApiItem) => {
    setEditId(plan.id);
    setForm({
      name: plan.name,
      description: plan.description || "",
      price: plan.price,
      trafficQuota: plan.trafficQuota / GB,
      speedLimit: plan.speedLimit / 1_000_000,
      ruleQuota: plan.ruleQuota,
      durationDays: plan.durationDays,
      userGroupId: plan.userGroupId || 0,
      tunnelGroupIds: plan.tunnelGroupIds || [],
      status: plan.status ?? 1,
    });
    onOpen();
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("请输入套餐名称");

      return;
    }

    const payload = {
      ...form,
      id: editId || undefined,
      name: form.name.trim(),
      description: form.description.trim(),
      trafficQuota: form.trafficQuota * GB,
      speedLimit: form.speedLimit * 1_000_000,
    };
    const res = editId ? await updatePlan(payload) : await createPlan(payload);

    if (res.code === 0) {
      toast.success(editId ? "套餐已更新" : "套餐已创建");
      onClose();
      void load();
    } else {
      toast.error(res.msg || "操作失败");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除此套餐？")) return;
    const res = await deletePlan(id);

    if (res.code === 0) {
      toast.success("套餐已删除");
      void load();
    } else {
      toast.error(res.msg || "删除失败");
    }
  };

  const tunnelGroupSummary = (ids?: number[]) => {
    if (!ids || ids.length === 0) return "未分配";

    return ids.map((id) => tunnelGroups.find((item) => item.id === id)?.name || `隧道组 #${id}`).join("、");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border border-divider bg-gradient-to-br from-background to-default-100/70 shadow-sm dark:to-default-50/10">
          <CardBody className="p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.3em] text-primary">Commerce Console</div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">套餐管理</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-default-500">
                  管理商城展示的套餐、价格、配额、绑定分组和上下架状态。这里的字段会完整显示到用户商店和订单中心。
                </p>
              </div>
              <Button color="primary" onPress={openCreate}>新建套餐</Button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-divider bg-background p-4">
                <div className="text-xs text-default-500">套餐总数</div>
                <div className="mt-1 text-2xl font-semibold">{stats.total}</div>
              </div>
              <div className="rounded-2xl border border-divider bg-background p-4">
                <div className="text-xs text-default-500">已上架</div>
                <div className="mt-1 text-2xl font-semibold text-emerald-600">{stats.online}</div>
              </div>
              <div className="rounded-2xl border border-divider bg-background p-4">
                <div className="text-xs text-default-500">已下架</div>
                <div className="mt-1 text-2xl font-semibold text-default-500">{stats.offline}</div>
              </div>
              <div className="rounded-2xl border border-divider bg-background p-4">
                <div className="text-xs text-default-500">价格合计</div>
                <div className="mt-1 text-2xl font-semibold">¥ {formatMoney(stats.revenueBase)}</div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-divider shadow-sm">
          <CardBody className="flex h-full flex-col justify-between gap-5 p-6">
            <div>
              <div className="text-sm font-semibold text-foreground">商店状态</div>
              <p className="mt-2 text-sm leading-6 text-default-500">
                {storeEnabled
                  ? "普通用户可以进入商店查看并购买已上架套餐。"
                  : "普通用户无法购买套餐，管理员仍可维护套餐数据。"}
              </p>
            </div>
            <div className="rounded-2xl bg-default-100 p-4 dark:bg-default-50/10">
              <div className="flex items-center justify-between">
                <span className="text-sm text-default-500">当前状态</span>
                <Chip color={storeEnabled ? "success" : "warning"} variant="flat">
                  {storeEnabled ? "开放" : "关闭"}
                </Chip>
              </div>
              <Button
                className="mt-4 w-full"
                color={storeEnabled ? "warning" : "success"}
                isLoading={storeSaving}
                variant="flat"
                onPress={() => handleStoreToggle(!storeEnabled)}
              >
                {storeEnabled ? "关闭商店" : "开启商店"}
              </Button>
            </div>
          </CardBody>
        </Card>
      </section>

      <Card className="overflow-hidden border border-divider shadow-sm">
        <CardBody className="p-0">
          <Table aria-label="套餐列表">
            <TableHeader>
              <TableColumn>套餐</TableColumn>
              <TableColumn>价格</TableColumn>
              <TableColumn>配额</TableColumn>
              <TableColumn>交付隧道组</TableColumn>
              <TableColumn>状态</TableColumn>
              <TableColumn>操作</TableColumn>
            </TableHeader>
            <TableBody emptyContent={loading ? "加载中..." : "暂无套餐"}>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div className="font-semibold text-foreground">{plan.name}</div>
                    <div className="mt-1 line-clamp-1 text-xs text-default-500">{plan.description || "暂无描述"}</div>
                  </TableCell>
                  <TableCell className="font-mono">¥ {formatMoney(plan.price)}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs text-default-600">
                      <div>流量 {formatTraffic(plan.trafficQuota)}</div>
                      <div>速度 {formatSpeed(plan.speedLimit)}</div>
                      <div>规则 {plan.ruleQuota > 0 ? plan.ruleQuota : "不限"} / 有效期 {plan.durationDays > 0 ? `${plan.durationDays} 天` : "永久"}</div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-xs" title={tunnelGroupSummary(plan.tunnelGroupIds)}>{tunnelGroupSummary(plan.tunnelGroupIds)}</TableCell>
                  <TableCell>
                    <Chip color={plan.status === 1 ? "success" : "default"} size="sm" variant="flat">
                      {plan.status === 1 ? "上架" : "下架"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="flat" onPress={() => openEdit(plan)}>编辑</Button>
                      <Button color="danger" size="sm" variant="flat" onPress={() => handleDelete(plan.id)}>删除</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <ModalHeader>{editId ? "编辑套餐" : "新建套餐"}</ModalHeader>
          <ModalBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="套餐名称" value={form.name} variant="bordered" onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
              <Input label="价格" type="number" value={String(form.price)} variant="bordered" onChange={(event) => setForm((prev) => ({ ...prev, price: Number(event.target.value) || 0 }))} />
            </div>
            <Input label="描述" value={form.description} variant="bordered" onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input label="流量额度(GB)" type="number" value={String(form.trafficQuota)} variant="bordered" onChange={(event) => setForm((prev) => ({ ...prev, trafficQuota: Number(event.target.value) || 0 }))} />
              <Input label="速率上限(Mbps)" type="number" value={String(form.speedLimit)} variant="bordered" onChange={(event) => setForm((prev) => ({ ...prev, speedLimit: Number(event.target.value) || 0 }))} />
              <Input label="规则数(0=不限)" type="number" value={String(form.ruleQuota)} variant="bordered" onChange={(event) => setForm((prev) => ({ ...prev, ruleQuota: Number(event.target.value) || 0 }))} />
              <Input label="有效期(天)" type="number" value={String(form.durationDays)} variant="bordered" onChange={(event) => setForm((prev) => ({ ...prev, durationDays: Number(event.target.value) || 0 }))} />
            </div>
            <Select
              label="购买后分配隧道分组"
              selectedKeys={(form.tunnelGroupIds || []).map(String)}
              selectionMode="multiple"
              variant="bordered"
              onSelectionChange={(keys) => {
                setForm((prev) => ({
                  ...prev,
                  tunnelGroupIds: Array.from(keys).map((item) => Number(item)).filter(Boolean),
                }));
              }}
            >
              {tunnelGroups.map((group) => (
                <SelectItem key={String(group.id)} textValue={group.name}>{group.name}</SelectItem>
              ))}
            </Select>
            <RadioGroup
              label="上下架状态"
              orientation="horizontal"
              value={String(form.status)}
              onValueChange={(value) => setForm((prev) => ({ ...prev, status: Number(value) }))}
            >
              <Radio value="1">上架</Radio>
              <Radio value="0">下架</Radio>
            </RadioGroup>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>取消</Button>
            <Button color="primary" onPress={handleSave}>保存</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
