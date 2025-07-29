import React from 'react';

interface BubbleIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

export const BubbleIcon: React.FC<BubbleIconProps> = ({
  size = 14,
  color = 'currentColor',
  ...props
}) => {
  return (
    <svg 
      width={size}
      height={size}
      viewBox="0 0 14 14" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
<path d="M11.3254 3.08599C9.16384 0.696935 5.47486 0.512471 3.08581 2.67398C0.696752 4.83553 0.512288 8.52451 2.6738 10.9136L1.25192 12.3354C1.19723 12.3901 1.16651 12.4643 1.16651 12.5416C1.16647 12.7027 1.29707 12.8333 1.45814 12.8333H6.99981C8.44614 12.8333 9.84089 12.2959 10.9134 11.3256C13.3025 9.16403 13.4869 5.47504 11.3254 3.08599ZM6.99981 12.25H2.16221L3.28732 11.1249C3.28732 11.1249 3.28736 11.1249 3.28732 11.1249C3.40118 11.011 3.40122 10.8263 3.28732 10.7125C2.30302 9.72817 1.74995 8.3932 1.74981 7.00116C1.74949 4.10198 4.09945 1.75149 6.99863 1.75116C9.89778 1.75084 12.2483 4.1008 12.2486 6.99999C12.249 9.89914 9.89899 12.2497 6.99981 12.25Z" fill="#4B5563"/>
    </svg>
  );
};

export default BubbleIcon;
