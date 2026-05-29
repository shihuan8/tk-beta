import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/shadcn-bridge/heroui/button";
import { Card, CardBody } from "@/shadcn-bridge/heroui/card";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@/shadcn-bridge/heroui/modal";
import { Spinner } from "@/shadcn-bridge/heroui/spinner";
import {
  getAvailablePlans,
  getPaymentConfigs,
  getStoreStatus,
  getUserBalance,
  purchasePlan,
} from "@/api";
import type { PaymentConfigApiItem, PlanApiItem } from "@/api/types";

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

export default function StorePage() {
  const [plans, setPlans] = useState<PlanApiItem[]>([]);
  const [balance, setBalance] = useState(0);
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfigApiItem[]>([]);
  const [storeEnabled, setStoreEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanApiItem | null>(null);
  const [purchaseStep, setPurchaseStep] = useState<"methods" | "balance">("methods");
  const { isOpen, onOpen, onClose } = useDisclosure();

  const load = async () => {
    setLoading(true);
    const [planRes, balRes, storeRes, paymentRes] = await Promise.all([
      getAvailablePlans(),
      getUserBalance(),
      getStoreStatus(),
      getPaymentConfigs(),
    ]);

    if (planRes.code === 0) setPlans(planRes.data || []);
    if (balRes.code === 0) setBalance(balRes.data?.balance || 0);
    if (storeRes.code === 0) setStoreEnabled(Boolean(storeRes.data?.enabled));
    if (paymentRes.code === 0) setPaymentConfigs(paymentRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const confirmPurchase = (plan: PlanApiItem) => {
    setSelectedPlan(plan);
    setPurchaseStep("methods");
    onOpen();
  };

  const closePurchaseModal = () => {
    setPurchaseStep("methods");
    onClose();
  };

  const isPaymentEnabled = (channel: string) =>
    paymentConfigs.some(
      (config) => config.channel === channel && Number(config.enabled) === 1,
    );

  const handleExternalPayment = (channel: "USDT" | "YIPAY") => {
    if (!isPaymentEnabled(channel)) {
      toast.error("暂未开放");

      return;
    }

    toast.error("暂未开放");
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    if (balance < selectedPlan.price) {
      toast.error("余额不足，请联系管理员充值");
      closePurchaseModal();

      return;
    }

    setPurchasing(true);
    const res = await purchasePlan(selectedPlan.id);
    setPurchasing(false);
    closePurchaseModal();

    if (res.code === 0) {
      toast.success("购买成功，订单已生成");
      void load();
    } else {
      toast.error(res.msg || "购买失败");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <section className="overflow-hidden rounded-3xl border border-divider bg-gradient-to-br from-zinc-950 via-slate-900 to-zinc-900 text-white shadow-xl">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_0.9fr] lg:p-8">
          <div className="space-y-5">
            <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70">
              Store / Orders / Balance Payment
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                套餐商店
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
                选择套餐、余额支付、生成订单。所有购买记录都会进入订单中心，方便追踪有效期和套餐状态。
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <div className="text-xs text-white/50">可用余额</div>
                <div className="mt-2 text-2xl font-semibold">¥ {formatMoney(balance)}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <div className="text-xs text-white/50">可购套餐</div>
                <div className="mt-2 text-2xl font-semibold">{plans.length}</div>
              </div>
            </div>
          </div>
          <div className="flex min-h-56 flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur">
            <div className="relative h-24 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/20 via-sky-500/10 to-emerald-400/10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.28),transparent_26%),radial-gradient(circle_at_80%_30%,rgba(125,211,252,0.22),transparent_24%)]" />
              <div className="absolute left-4 top-4">
                <div className="text-xs uppercase tracking-[0.24em] text-white/45">FLVX STORE</div>
                <div className="mt-1 text-lg font-semibold text-white">今日也要稳定转发</div>
              </div>
              <svg className="absolute bottom-0 right-5 h-24 w-24 text-white/80" fill="none" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="38" fill="currentColor" opacity="0.92" r="22" />
                <path d="M40 35c6-22 34-22 40 0-10-8-30-8-40 0Z" fill="#111827" opacity="0.85" />
                <circle cx="52" cy="38" fill="#111827" r="2.5" />
                <circle cx="68" cy="38" fill="#111827" r="2.5" />
                <path d="M54 48c4 3 8 3 12 0" stroke="#111827" strokeLinecap="round" strokeWidth="2" />
                <path d="M33 100c4-26 50-26 54 0" fill="currentColor" opacity="0.78" />
                <path d="M30 52c-8-10-7-21 2-28 2 12 8 18 18 20" fill="#111827" opacity="0.82" />
                <path d="M90 52c8-10 7-21-2-28-2 12-8 18-18 20" fill="#111827" opacity="0.82" />
                <path d="M86 80c10-6 18-3 22 7" stroke="currentColor" strokeLinecap="round" strokeWidth="8" opacity="0.65" />
              </svg>
            </div>
            <div className="space-y-3 text-sm text-white/60">
              <div className="flex justify-between rounded-2xl bg-black/20 px-4 py-3">
                <span>支付方式</span>
                <span className="text-white">USDT/微信/支付宝/余额</span>
              </div>
              <div className="flex justify-between rounded-2xl bg-black/20 px-4 py-3">
                <span>订单生成</span>
                <span className="text-white">支付成功后自动生成</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!storeEnabled && (
        <Card className="border-warning-300 bg-warning-50 dark:bg-warning-950/20">
          <CardBody className="text-sm text-warning-700 dark:text-warning-300">
            商店暂未开启，请联系管理员购买或分配套餐。
          </CardBody>
        </Card>
      )}

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-semibold text-foreground">可购买套餐</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const disabled = plan.status !== 1 || !storeEnabled;

            return (
              <Card
                key={plan.id}
                className="group overflow-hidden border border-divider bg-background shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <CardBody className="space-y-4 p-5 pt-6">
                  <div className="relative top-2 flex min-h-16 items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-xl font-semibold leading-7 text-foreground">
                        {plan.name}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-default-500">
                        {plan.description || "暂无描述"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-default-100/70 px-0 py-4 dark:bg-default-50/10">
                    <div className="text-xs text-default-500">套餐价格</div>
                    <div className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
                      ¥ {formatMoney(plan.price)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl border border-divider p-3">
                      <div className="text-xs text-default-500">流量额度</div>
                      <div className="mt-1 font-medium">{formatTraffic(plan.trafficQuota)}</div>
                    </div>
                    <div className="rounded-xl border border-divider p-3">
                      <div className="text-xs text-default-500">速率上限</div>
                      <div className="mt-1 font-medium">{formatSpeed(plan.speedLimit)}</div>
                    </div>
                    <div className="rounded-xl border border-divider p-3">
                      <div className="text-xs text-default-500">规则数量</div>
                      <div className="mt-1 font-medium">{plan.ruleQuota > 0 ? plan.ruleQuota : "不限"}</div>
                    </div>
                    <div className="rounded-xl border border-divider p-3">
                      <div className="text-xs text-default-500">有效期</div>
                      <div className="mt-1 font-medium">{plan.durationDays > 0 ? `${plan.durationDays} 天` : "永久"}</div>
                    </div>
                  </div>

                  {disabled ? (
                    <Button className="w-full" color="primary" isDisabled>
                      暂不可购买
                    </Button>
                  ) : (
                    <Button className="w-full" color="primary" onPress={() => confirmPurchase(plan)}>
                      立即购买
                    </Button>
                  )}
                </CardBody>
              </Card>
            );
          })}
          {plans.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-divider p-12 text-center text-default-400">
              暂无可用套餐
            </div>
          )}
        </div>
      </section>

      <Modal isOpen={isOpen} onClose={closePurchaseModal}>
        <ModalContent>
          <ModalHeader>{purchaseStep === "methods" ? "选择支付方式" : "确认余额支付"}</ModalHeader>
          <ModalBody>
            {selectedPlan && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-divider p-4">
                  <div className="text-lg font-semibold">{selectedPlan.name}</div>
                  <div className="mt-1 text-sm text-default-500">{selectedPlan.description || "暂无描述"}</div>
                </div>
                {purchaseStep === "methods" ? (
                  <div className="grid gap-3">
                    <button
                      className="rounded-2xl border border-divider bg-background p-4 text-left transition hover:border-primary hover:bg-primary/5"
                      type="button"
                      onClick={() => handleExternalPayment("USDT")}
                    >
                      <div className="font-semibold text-foreground">USDT支付</div>
                      <div className="mt-1 text-xs text-default-500">使用 USDT 网关完成支付</div>
                    </button>
                    <button
                      className="rounded-2xl border border-divider bg-background p-4 text-left transition hover:border-primary hover:bg-primary/5"
                      type="button"
                      onClick={() => handleExternalPayment("YIPAY")}
                    >
                      <div className="font-semibold text-foreground">微信/支付宝支付</div>
                      <div className="mt-1 text-xs text-default-500">通过扫码聚合支付完成购买</div>
                    </button>
                    <button
                      className="rounded-2xl border border-divider bg-background p-4 text-left transition hover:border-primary hover:bg-primary/5"
                      type="button"
                      onClick={() => setPurchaseStep("balance")}
                    >
                      <div className="font-semibold text-foreground">余额支付</div>
                      <div className="mt-1 text-xs text-default-500">当前余额 ¥ {formatMoney(balance)}</div>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-default-100 p-3 dark:bg-default-50/10">
                        <div className="text-default-500">支付金额</div>
                        <div className="mt-1 font-mono font-semibold">¥ {formatMoney(selectedPlan.price)}</div>
                      </div>
                      <div className="rounded-xl bg-default-100 p-3 dark:bg-default-50/10">
                        <div className="text-default-500">当前余额</div>
                        <div className="mt-1 font-mono font-semibold">¥ {formatMoney(balance)}</div>
                      </div>
                    </div>
                    {balance < selectedPlan.price && (
                      <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                        余额不足，无法完成支付。
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {purchaseStep === "balance" && (
              <Button variant="light" onPress={() => setPurchaseStep("methods")}>返回</Button>
            )}
            <Button variant="light" onPress={closePurchaseModal}>取消</Button>
            {purchaseStep === "balance" && (
              <Button
                color="primary"
                isDisabled={!selectedPlan || balance < selectedPlan.price}
                isLoading={purchasing}
                onPress={handlePurchase}
              >
                确认支付
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
