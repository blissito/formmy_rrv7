import React from "react";

interface ValidationMessageProps {
  type?: "error" | "warning" | "success" | "info";
  message: string;
  className?: string;
}

const icons = {
  error: (
    <svg
      className="w-5 h-5 text-red-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  ),
  warning: (
    <svg
      className="w-5 h-5 text-yellow-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"
      />
    </svg>
  ),
  success: (
    <svg
      className="w-5 h-5 text-green-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  ),
  info: (
    <svg
      className="w-5 h-5 text-blue-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01"
      />
    </svg>
  ),
};

const baseStyles = {
  error:
    "bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:text-red-200 dark:border-red-700",
  warning:
    "bg-yellow-50 border border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-700",
  success:
    "bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:text-green-200 dark:border-green-700",
  info: "bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-700",
};

export const ValidationMessage: React.FC<ValidationMessageProps> = ({
  type = "error",
  message,
  className = "",
}) => {
  return (
    <div
      className={`flex items-center gap-2 rounded px-3 py-2 text-sm mt-1 ${baseStyles[type]} ${className}`}
      role={type === "error" ? "alert" : undefined}
    >
      {icons[type]}
      <span>{message}</span>
    </div>
  );
};

export default ValidationMessage;
