import { OnlineOrderingFeatureGate } from "@/components/dashboard/OnlineOrderingFeatureGate";
import { OrdersManagement } from "@/components/dashboard/orders/OrdersManagement";

export default function OrdersPage() {
  return (
    <OnlineOrderingFeatureGate>
      <OrdersManagement />
    </OnlineOrderingFeatureGate>
  );
}
