import React from 'react';
import { Link, useLocation } from 'react-router';

interface IconButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  icon: React.ReactElement<{ className?: string }>;
  activeIcon?: React.ReactElement<{ className?: string }>;
  title: string;
  className?: string;
  iconPosition?: 'left' | 'right';
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const IconButtonLink: React.FC<IconButtonLinkProps> = ({
  to,
  icon,
  activeIcon,
  title,
  className = '',
  iconPosition = 'left',
  variant = 'primary',
  ...props
}) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
  
  // Estilos base para el botón
  const baseStyles = 'inline-flex items-center justify-center rounded-lg md:px-4 px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
  
  // Estilos para las variantes
  const variantStyles = {
    primary: `bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary/50 transition-colors duration-200 ${isActive ? '!bg-brand-500' : ''}`,
    secondary: `bg-secondary text-white hover:bg-secondary/90 focus-visible:ring-secondary/50 transition-colors duration-200 ${isActive ? '!bg-brand-500' : ''}`,
    ghost: `bg-transparent transition-all duration-200 ${isActive ? 'text-brand-500' : 'text-gray-700 hover:text-gray-900'} focus-visible:ring-gray-200`,
  };

  // Use activeIcon if provided and active, otherwise use the default icon
  const currentIcon = isActive && activeIcon ? activeIcon : icon;
  
  // Clone the icon with the appropriate className
  const iconElement = React.cloneElement(currentIcon, {
    className: `${currentIcon.props.className || ''} w-10 h-10`
  });

  return (
    <Link
      to={to}
      className={`${baseStyles} ${variantStyles[variant]} ${className} touch-auto z-10`}
      prefetch='render'
      {...props}
    >
      <div className="flex flex-col gap-0 md:gap-2 items-center text-center">
        <div className={`w-full grid place-content-center rounded-xl !w-[60px] h-12 transition-all duration-200 ${isActive ? 'bg-brand-500/20' : 'bg-transparent hover:bg-brand-500/10'}`}>
          {iconElement}
        </div>
        <span className={`text-base text-dark`}>
          {title}
        </span>
      </div>
    </Link>
  );
};

export default IconButtonLink;
