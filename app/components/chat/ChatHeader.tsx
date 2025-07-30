import { Avatar } from "./Avatar";

interface ChatHeaderProps {
  primaryColor?: string;
  name?: string;
}

export const ChatHeader = ({
  primaryColor,
  name = "Geeki",
}: ChatHeaderProps) => {
  return (
    <section className="bg-brand-300/10 flex items-center py-3 px-3 h-min gap-3">
      <Avatar  />
      <p className="heading text-lg ">{name}</p>
    </section>
  );
};
