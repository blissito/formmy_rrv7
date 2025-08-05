import { useState } from "react";
import { cn } from "~/lib/utils";

type ChipTabsProps = {
  activeTab?: string;
  type?: string;
  names?: string[];
  onTabChange?: (tab: string) => void;
};

export const ChipTabs = ({
  activeTab = "Chat",
  type = "",
  names = ["Chat", "Agente"],
  onTabChange,
}: ChipTabsProps) => {
  const tabs = names || ["Chat", "Agente"];

  return (
    <section className={cn(
      "flex gap-1 bg-gray-200 rounded-full w-fit",
      {
        "w-full": type === "full",
      }
    )}>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange?.(tab)}
          className={cn(
            " h-10 rounded-full text-base  font-medium transition-colors",
            "px-3 md:px-6",
            {
              "w-[50%]": type === "full",
            },
            {
              "bg-dark text-[#fff]": activeTab === tab,
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
