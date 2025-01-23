import { Menu } from "@headlessui/react";
import { type ReactNode } from "react";

export function Dropdown({
  items,
  trigger,
}: {
  trigger: ReactNode;
  items: ReactNode;
}) {
  return (
    <Menu>
      {trigger}
      <Menu.Items>
        <Menu.Item>
          {({ active }) => (
            <a
              className={`${active && "bg-blue-500"}`}
              href="/account-settings"
            >
              Documentation
            </a>
          )}
        </Menu.Item>
        <Menu.Item disabled>
          <span className="opacity-75">Invite a friend (coming soon!)</span>
        </Menu.Item>
        {items}
      </Menu.Items>
    </Menu>
  );
}

export const DropdownItem = ({ children }: { children: ReactNode }) => {
  return (
    <Menu.Item>
      {({ active }) => (
        <a className={`${active && "bg-blue-500"}`} href="/account-settings">
          {children}
        </a>
      )}
    </Menu.Item>
  );
};

export const MenuTrigger = ({ children }: { children: ReactNode }) => {
  return <Menu.Button>{children}</Menu.Button>;
};
