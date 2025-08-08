import { Avatar } from "./Avatar";

interface ChatHeaderProps {
  primaryColor?: string;
  name?: string;
  avatarUrl?: string;
}

export const ChatHeader = ({
  primaryColor,
  name = "Geeki",
  avatarUrl,
}: ChatHeaderProps) => {
  return (
    <section className="bg-brand-300/10 flex items-center py-3 px-3 h-min gap-3">
      <Avatar src={avatarUrl} primaryColor={primaryColor} />
      <p className="heading text-lg ">{name}</p>
    </section>
  );
};
