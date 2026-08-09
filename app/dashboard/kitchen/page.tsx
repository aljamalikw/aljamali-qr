import { OnlineOrderingFeatureGate } from "@/components/dashboard/OnlineOrderingFeatureGate";
import { KitchenDisplay } from "@/components/dashboard/kitchen/KitchenDisplay";

export default function KitchenPage() {
  return (
    <OnlineOrderingFeatureGate>
      <KitchenDisplay />
    </OnlineOrderingFeatureGate>
  );
}
