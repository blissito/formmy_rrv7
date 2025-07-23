import { useState } from "react";
import { cn } from "~/lib/utils";

type ChipTabsProps = {
  activeTab?: string;
  names?: string[];
  onTabChange?: (tab: string) => void;
};

export const ChipTabs = ({
  activeTab = "Chat",
  names = ["Chat", "Agente"],
  onTabChange,
}: ChipTabsProps) => {
  const tabs = names || ["Chat", "Agente"];

  return (
    <section className="flex gap-1 bg-gray-200 rounded-full w-min">
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

export const useChipTabs = (initial: string = "") => {
  const [currentTab, set] = useState(initial);
  const setCurrentTab = (val: string) => set(val);
  const catchCurrentTab = (val: string) => set(val);
  return {
    currentTab,
    setCurrentTab,
    catchCurrentTab,
  };
};
