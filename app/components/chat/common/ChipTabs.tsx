import { cn } from "~/lib/utils";

type ChipTabsProps = {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
};

export const ChipTabs = ({
  activeTab = "Chat",
  onTabChange,
}: ChipTabsProps) => {
  const tabs = ["Chat", "Agente"];

  return (
    <section className="flex gap-1 bg-gray-200 rounded-full">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange?.(tab)}
          className={cn(
            "px-3 py-3 rounded-full text-sm font-medium transition-colors",
            "px-6",
            {
              "bg-black text-[#fff]": activeTab === tab,
            }
          )}
        >
          {tab}
        </button>
      ))}
    </section>
  );
};
