import PetHouseWrapper from "@/components/PetHouseWrapper";

export const metadata = { title: "펫 하우스 · Mission Control" };

export default function PetHousePage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          🏠 <span>펫 하우스</span>
        </h1>
        <p className="text-sm text-[#a1a1aa] mt-1">
          페페·비르·조니·레이가 사는 집. 일이 있으면 책상에서 집중, 없으면 돌아다니거나 잠.
        </p>
      </div>
      <PetHouseWrapper />
    </div>
  );
}
