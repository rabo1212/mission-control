import FleetClient from "@/components/FleetClient";
import RoutinePanel from "@/components/RoutinePanel";

export const metadata = { title: "봇 함대 · Mission Control" };

export default function FleetPage() {
  return (
    <div className="space-y-8">
      <FleetClient />
      <RoutinePanel />
    </div>
  );
}
