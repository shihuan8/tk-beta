import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { deleteOBSCode, getAllUsers, getMyOBSCode, getOBSCodeList, saveOBSCode } from "@/api";
import type { OBSCodeAssignmentApiItem, UserApiItem } from "@/api/types";
import { Button } from "@/shadcn-bridge/heroui/button";
import { Card, CardBody } from "@/shadcn-bridge/heroui/card";
import { Input } from "@/shadcn-bridge/heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@/shadcn-bridge/heroui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/shadcn-bridge/heroui/table";
import { getAdminFlag } from "@/utils/session";

export default function OBSCodesPage() {
  const [users, setUsers] = useState<UserApiItem[]>([]);
  const [assignments, setAssignments] = useState<OBSCodeAssignmentApiItem[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<OBSCodeAssignmentApiItem | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserApiItem | null>(null);
  const [form, setForm] = useState({ pushCode: "", inputCode: "", remark: "" });
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const isAdmin = getAdminFlag();

  const assignmentByUser = useMemo(() => {
    const map = new Map<number, OBSCodeAssignmentApiItem>();

    assignments.forEach((item) => map.set(item.userId, item));

    return map;
  }, [assignments]);

  const load = async () => {
    const [userRes, obsRes] = await Promise.all([getAllUsers(), getOBSCodeList()]);

    if (userRes.code === 0) setUsers(userRes.data || []);
    if (obsRes.code === 0) setAssignments(obsRes.data || []);
  };

  useEffect(() => {
    if (isAdmin) {
      void load();

      return;
    }

    void getMyOBSCode().then((res) => {
      if (res.code === 0) setCurrentAssignment(res.data || null);
    });
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">OBS 推流码</h1>
          <p className="mt-1 text-sm text-default-500">管理员分配给你的本地推流码和异地端输入码。</p>
        </div>
        <Card className="border border-divider shadow-sm">
          <CardBody className="space-y-4 p-4">
            {currentAssignment ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-default-50 p-4 dark:bg-default-100/40">
                  <div className="text-xs text-default-500">本地 OBS 推流码</div>
                  <div className="mt-2 break-all font-mono text-sm text-foreground">{currentAssignment.pushCode}</div>
                </div>
                <div className="rounded-xl bg-default-50 p-4 dark:bg-default-100/40">
                  <div className="text-xs text-default-500">异地端 OBS 输入码</div>
                  <div className="mt-2 break-all font-mono text-sm text-foreground">{currentAssignment.inputCode}</div>
                </div>
                {currentAssignment.remark ? (
                  <div className="rounded-xl bg-default-50 p-4 text-sm text-default-600 dark:bg-default-100/40 md:col-span-2">
                    {currentAssignment.remark}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-xl bg-default-50 p-6 text-sm text-default-500 dark:bg-default-100/40">
                暂未分配 OBS 推流码。
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    );
  }

  const openAssign = (user: UserApiItem) => {
    const existing = assignmentByUser.get(user.id);

    setSelectedUser(user);
    setForm({
      pushCode: existing?.pushCode || "",
      inputCode: existing?.inputCode || "",
      remark: existing?.remark || "",
    });
    onOpen();
  };

  const save = async () => {
    if (!selectedUser) return;
    if (!form.pushCode.trim() || !form.inputCode.trim()) {
      toast.error("请填写本地推流码和异地输入码");

      return;
    }
    const res = await saveOBSCode({
      userId: selectedUser.id,
      userName: selectedUser.user || selectedUser.name || String(selectedUser.id),
      pushCode: form.pushCode.trim(),
      inputCode: form.inputCode.trim(),
      remark: form.remark.trim(),
    });

    if (res.code !== 0) {
      toast.error(res.msg || "保存失败");

      return;
    }
    toast.success("已分配 OBS 码");
    await load();
    onOpenChange(false);
  };

  const remove = async (userId: number) => {
    const res = await deleteOBSCode(userId);

    if (res.code !== 0) {
      toast.error(res.msg || "删除失败");

      return;
    }
    await load();
    toast.success("已删除分配");
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">OBS 码分配</h1>
        <p className="mt-1 text-sm text-default-500">给用户手动分配本地 OBS 推流码和异地端 OBS 输入码。</p>
      </div>

      <Card className="border border-divider shadow-sm">
        <CardBody className="p-0">
          <Table aria-label="OBS 码分配">
            <TableHeader>
              <TableColumn>用户</TableColumn>
              <TableColumn>本地 OBS 推流码</TableColumn>
              <TableColumn>异地端 OBS 输入码</TableColumn>
              <TableColumn>备注</TableColumn>
              <TableColumn>操作</TableColumn>
            </TableHeader>
            <TableBody emptyContent="暂无用户">
              {users.map((user) => {
                const assignment = assignmentByUser.get(user.id);

                return (
                  <TableRow key={user.id}>
                    <TableCell>{user.user || user.name || `用户#${user.id}`}</TableCell>
                    <TableCell className="font-mono text-xs">{assignment?.pushCode || "未分配"}</TableCell>
                    <TableCell className="font-mono text-xs">{assignment?.inputCode || "未分配"}</TableCell>
                    <TableCell className="text-xs text-default-500">{assignment?.remark || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="flat" onPress={() => openAssign(user)}>
                          分配
                        </Button>
                        {assignment && (
                          <Button color="danger" size="sm" variant="flat" onPress={() => remove(user.id)}>
                            删除
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} size="2xl" onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>分配 OBS 码 - {selectedUser?.user || selectedUser?.name}</ModalHeader>
          <ModalBody className="space-y-4">
            <Input label="本地 OBS 推流码" placeholder="例如 srt://服务器A:19000?mode=caller" value={form.pushCode} variant="bordered" onChange={(event) => setForm((prev) => ({ ...prev, pushCode: event.target.value }))} />
            <Input label="异地端 OBS 输入码" placeholder="例如 srt://服务器C:19003?mode=caller" value={form.inputCode} variant="bordered" onChange={(event) => setForm((prev) => ({ ...prev, inputCode: event.target.value }))} />
            <Input label="备注" value={form.remark} variant="bordered" onChange={(event) => setForm((prev) => ({ ...prev, remark: event.target.value }))} />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => onOpenChange(false)}>取消</Button>
            <Button color="primary" onPress={save}>保存</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
