import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { getAdminOrderList, getPaymentStats, deleteOrder, refundOrder, updateOrder } from "@/api";
import type { OrderApiItem } from "@/api/types";
import { Button } from "@/shadcn-bridge/heroui/button";
import { Card, CardBody } from "@/shadcn-bridge/heroui/card";
import { Chip } from "@/shadcn-bridge/heroui/chip";
import { Input } from "@/shadcn-bridge/heroui/input";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/shadcn-bridge/heroui/modal";
import { Select, SelectItem } from "@/shadcn-bridge/heroui/select";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@/shadcn-bridge/heroui/table";

const statusMap: Record<number, { label: string; color: "warning" | "success" | "default" | "danger" }> = {
  0: { label: "待支付", color: "warning" },
  1: { label: "已完成", color: "success" },
  2: { label: "已取消", color: "default" },
  3: { label: "已退款", color: "danger" },
};

const payLabel: Record<string, string> = {
  BALANCE: "余额",
  USDT: "USDT",
  YIPAY: "微信/支付宝",
};

const money = (cents: number) => (Number(cents || 0) / 100).toFixed(2);
const date = (seconds: number) => seconds ? new Date(seconds * 1000).toLocaleString("zh-CN") : "-";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderApiItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("-1");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ paidAmount: 0, paidOrders: 0, pendingOrders: 0 });
  const [detail, setDetail] = useState<OrderApiItem | null>(null);
  const [editing, setEditing] = useState<OrderApiItem | null>(null);
  const [editForm, setEditForm] = useState({ status: "", amount: "", productName: "", payCurrency: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [orderRes, statsRes] = await Promise.all([
      getAdminOrderList({ page, size: 10, status: Number(status), keyword }),
      getPaymentStats(),
    ]);
    setLoading(false);
    if (orderRes.code === 0) {
      setOrders(orderRes.data?.list || []);
      setTotal(orderRes.data?.total || 0);
    } else {
      toast.error(orderRes.msg || "获取订单失败");
    }
    if (statsRes.code === 0) {
      setStats(statsRes.data || { paidAmount: 0, paidOrders: 0, pendingOrders: 0 });
    }
  }, [keyword, page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEdit = (order: OrderApiItem) => {
    setEditing(order);
    setEditForm({
      status: String(order.status),
      amount: money(order.amount),
      productName: order.productName,
      payCurrency: order.payCurrency,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const res = await updateOrder({
      id: editing.id,
      status: Number(editForm.status),
      amount: Math.round(Number(editForm.amount || 0) * 100),
      productName: editForm.productName,
      payCurrency: editForm.payCurrency,
    });
    if (res.code === 0) {
      toast.success("保存成功");
      setEditing(null);
      void load();
    } else {
      toast.error(res.msg || "保存失败");
    }
  };

  const remove = async (order: OrderApiItem) => {
    const res = await deleteOrder(order.id);
    if (res.code === 0) {
      toast.success("删除成功");
      void load();
    } else {
      toast.error(res.msg || "删除失败");
    }
  };

  const refund = async (order: OrderApiItem) => {
    const res = await refundOrder(order.id);
    if (res.code === 0) {
      toast.success("退款成功");
      void load();
    } else {
      toast.error(res.msg || "退款失败");
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">订单管理</h1>
          <p className="text-sm text-default-500">管理套餐购买订单、支付状态、退款和删除。</p>
        </div>
        <Input className="sm:w-72" placeholder="搜索订单号/用户/商品" value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(1); }} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-divider shadow-md">
          <CardBody className="flex min-h-28 flex-col justify-center gap-4 p-6">
            <div className="text-sm text-default-500">已收金额</div>
            <div className="text-2xl font-bold text-success">¥ {Number(stats.paidAmount || 0).toFixed(2)}</div>
          </CardBody>
        </Card>
        <Card className="border border-divider shadow-md">
          <CardBody className="flex min-h-28 flex-col justify-center gap-4 p-6">
            <div className="text-sm text-default-500">已完成订单</div>
            <div className="text-2xl font-bold text-foreground">{stats.paidOrders}</div>
          </CardBody>
        </Card>
        <Card className="border border-divider shadow-md">
          <CardBody className="flex min-h-28 flex-col justify-center gap-4 p-6">
            <div className="text-sm text-default-500">待支付订单</div>
            <div className="text-2xl font-bold text-foreground">{stats.pendingOrders}</div>
          </CardBody>
        </Card>
        <Card className="border border-divider shadow-md">
          <CardBody className="flex min-h-28 flex-col justify-center gap-4 p-6">
            <div className="text-sm text-default-500">总订单数</div>
            <div className="text-2xl font-bold text-foreground">{total}</div>
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {[["-1", "全部"], ["0", "待支付"], ["1", "已完成"], ["2", "已取消"], ["3", "已退款"]].map(([key, label]) => (
          <Button key={key} color={status === key ? "primary" : "default"} size="sm" variant={status === key ? "solid" : "flat"} onPress={() => { setStatus(key); setPage(1); }}>{label}</Button>
        ))}
      </div>

      <Card className="overflow-hidden border border-divider">
        <CardBody className="p-0">
          <Table aria-label="订单管理">
            <TableHeader>
              <TableColumn>订单号</TableColumn><TableColumn>用户</TableColumn><TableColumn>商品</TableColumn><TableColumn>金额</TableColumn><TableColumn>支付</TableColumn><TableColumn>状态</TableColumn><TableColumn>时间</TableColumn><TableColumn>操作</TableColumn>
            </TableHeader>
            <TableBody emptyContent={loading ? "加载中" : "暂无订单"}>
              {orders.map((order) => {
                const statusInfo = statusMap[order.status] || statusMap[0];
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.orderNo}</TableCell>
                    <TableCell>{order.userName}</TableCell>
                    <TableCell>{order.productName}</TableCell>
                    <TableCell>¥ {money(order.amount)}</TableCell>
                    <TableCell>{payLabel[order.payCurrency] || order.payCurrency}</TableCell>
                    <TableCell><Chip color={statusInfo.color} size="sm" variant="flat">{statusInfo.label}</Chip></TableCell>
                    <TableCell className="text-xs text-default-500">{date(order.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Button size="sm" variant="flat" onPress={() => setDetail(order)}>详情</Button>
                        <Button color="warning" size="sm" variant="flat" onPress={() => openEdit(order)}>编辑</Button>
                        {order.status === 1 && <Button color="secondary" size="sm" variant="flat" onPress={() => refund(order)}>退款</Button>}
                        <Button color="danger" size="sm" variant="flat" onPress={() => remove(order)}>删除</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {total > 10 && <div className="flex justify-center gap-2"><Button isDisabled={page <= 1} size="sm" onPress={() => setPage((p) => Math.max(1, p - 1))}>上一页</Button><span className="flex items-center text-sm text-default-500">{page} / {Math.ceil(total / 10)}</span><Button isDisabled={page >= Math.ceil(total / 10)} size="sm" onPress={() => setPage((p) => p + 1)}>下一页</Button></div>}

      <Modal isOpen={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <ModalContent><ModalHeader>订单详情</ModalHeader><ModalBody>{detail && <div className="space-y-2 text-sm"><div>订单号: {detail.orderNo}</div><div>用户: {detail.userName}</div><div>商品: {detail.productName}</div><div>金额: ¥ {money(detail.amount)}</div><div>支付方式: {payLabel[detail.payCurrency] || detail.payCurrency}</div><div>创建时间: {date(detail.createdAt)}</div></div>}</ModalBody><ModalFooter><Button onPress={() => setDetail(null)}>关闭</Button></ModalFooter></ModalContent>
      </Modal>

      <Modal isOpen={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <ModalContent><ModalHeader>编辑订单</ModalHeader><ModalBody><div className="space-y-3"><Select label="状态" selectedKeys={[editForm.status]} onSelectionChange={(keys) => setEditForm((prev) => ({ ...prev, status: String(Array.from(keys)[0] || prev.status) }))}><SelectItem key="0">待支付</SelectItem><SelectItem key="1">已完成</SelectItem><SelectItem key="2">已取消</SelectItem><SelectItem key="3">已退款</SelectItem></Select><Input label="金额(元)" type="number" value={editForm.amount} onChange={(event) => setEditForm((prev) => ({ ...prev, amount: event.target.value }))} /><Input label="商品名称" value={editForm.productName} onChange={(event) => setEditForm((prev) => ({ ...prev, productName: event.target.value }))} /><Input label="支付方式" value={editForm.payCurrency} onChange={(event) => setEditForm((prev) => ({ ...prev, payCurrency: event.target.value }))} /></div></ModalBody><ModalFooter><Button variant="light" onPress={() => setEditing(null)}>取消</Button><Button color="primary" onPress={saveEdit}>保存</Button></ModalFooter></ModalContent>
      </Modal>
    </div>
  );
}
