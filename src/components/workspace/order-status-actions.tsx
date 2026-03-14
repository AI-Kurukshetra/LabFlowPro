"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { updateOrderStatus, type ActionState } from "@/lib/actions/orders";
import { hasPermission } from "@/lib/rbac/permissions";
import type { Permission } from "@/lib/rbac/permissions";
import type { OrderStatus, UserRole } from "@/lib/types/database";

const TRANSITION_LABELS: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  draft: { label: "Mark Collected", next: "collected" },
  collected: { label: "Start Processing", next: "in_process" },
  in_process: { label: "Send to Review", next: "review" },
  review: { label: "Release", next: "released" },
};

type OrderStatusActionsProps = {
  orderId: string;
  currentStatus: OrderStatus;
  userRole?: UserRole;
};

export function OrderStatusActions({ orderId, currentStatus, userRole }: OrderStatusActionsProps) {
  const transition = TRANSITION_LABELS[currentStatus];

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateOrderStatus,
    { status: "idle" },
  );

  if (!transition) {
    return null;
  }

  // Check if user has permission for this transition
  if (userRole && !hasPermission(userRole, `orders:transition:${transition.next}` as Permission)) {
    return null;
  }

  return (
    <div className="space-y-2">
      <form action={formAction}>
        <input type="hidden" name="id" value={orderId} />
        <input type="hidden" name="status" value={transition.next} />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Updating..." : transition.label}
        </Button>
      </form>

      {state.status === "error" && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      {state.status === "success" && (
        <p className="text-sm text-emerald-600">{state.message}</p>
      )}
    </div>
  );
}
