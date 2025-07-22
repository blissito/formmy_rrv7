import { Avatar } from "./Avatar";

interface LoadingIndicatorProps {
  primaryColor?: string;
}

export const LoadingIndicator = ({ primaryColor }: LoadingIndicatorProps) => {
  return (
    <div className="px-4 flex items-start gap-3">
      <Avatar primaryColor={primaryColor} />
      <div className="text-sm text-gray-900 dark:text-white animate-pulse">
        ...
      </div>
    </div>
  );
};
