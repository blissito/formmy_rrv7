import { Avatar } from "./Avatar";

interface LoadingIndicatorProps {
  primaryColor?: string;
}

export const LoadingIndicator = ({ primaryColor }: LoadingIndicatorProps) => {
  return (
    <div className="flex items-start gap-3">
      <Avatar primaryColor={primaryColor} />
      <div className="bg-white dark:bg-space-700 rounded-lg p-3 max-w-xs shadow-sm opacity-60">
        <div className="text-sm text-gray-900 dark:text-white animate-pulse">
          ...
        </div>
      </div>
    </div>
  );
};
