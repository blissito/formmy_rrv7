import type { ReactNode } from 'react';
import AiIcon from '../ui/icons/AiIcon';
import { IconButtonLink } from '../ui/IconButtonLink';
import { Button } from '../Button';
import { Link } from 'react-router';
import ChatIcon from '../ui/icons/ChatIcon';
import { Avatar } from '../chat';
import { DocumentIcon } from '../ui/icons/DocumentIcon';
import ChatIconActive from '../ui/icons/ChatIconActive';
import DocumentIconActive from '../ui/icons/DocumentIconActive';
import AiIconActive from '../ui/icons/AiIconActive';

interface DashboardLayoutProps {
  title: string;
  children: ReactNode;
  actionButton?: {
    text: string;
    to: string;
    icon?: ReactNode;
  };
}

export function DashboardLayout({ title, children, actionButton }: DashboardLayoutProps) {
  return (
    <div className="mx-auto w-full h-full min-h-screen bg-surface flex  pr-8 box-border">
      <div className="flex h-full flex-col justify-center items-center py-8 w-[120px] gap-8 rounded-r-3xl h-screen sticky top-0">
        <Link to="/dashboard" className="">
          <img className='w-[60px]' src="/dash/logo-full.svg" alt="Formmy Logo" />
        </Link>
        <nav className="flex flex-col items-center justify-center gap-8 w-full px-2">
          <IconButtonLink
            to="/dashboard/ghosty"
            icon={<AiIcon className="w-10 h-10 text-dark" />}
            activeIcon={<AiIconActive className="w-10 h-10 text-brand-500" />}
            title="Ghosty"
            variant="ghost"
            className="w-full justify-start px-3  rounded-xl"
          />
          {/* Ejemplo de otro botón */}
          <IconButtonLink
            to="/dashboard/formmys"
            icon={<DocumentIcon className="w-10 h-10 text-dark" />}
            activeIcon={<DocumentIconActive className="w-10 h-10 text-brand-500" />}
            title="Formmys"
            variant="ghost"
            className="w-full justify-start px-3  rounded-xl"
          />
          <IconButtonLink
            to="/dashboard/chat-ia"
            icon={<ChatIcon className="w-10 h-10 text-dark" />}
            activeIcon={<ChatIconActive className="w-10 h-10 text-brand-500" />}
            title="Chatbots"
            variant="ghost"
            className="w-full justify-start px-3  rounded-xl"
          />
          <IconButtonLink
            to="/dashboard/ayuda"
            icon={<ChatIcon className="w-10 h-10 text-dark" />}
            activeIcon={<ChatIcon className="w-10 h-10 text-brand-500" />}
            title="Ayuda"
            variant="ghost"
            className="w-full justify-start px-3  rounded-xl"
          />
        </nav>
      </div>
      <div className='flex flex-col grow w-full pb-8'>
        <div className='h-20 flex items-center justify-end gap-2 w-full'>
          <Button variant="secondary">Menu superior</Button>
          <Button variant="ghost">Docs</Button>
          <Avatar/>
        </div>
        <div className="bg-white w-full h-full rounded-[40px] ">
          {children}
        </div>
      </div>
    </div>
  );
}
