import { LayoutGroup } from "framer-motion";
import { useEffect, useState } from "react";
import { CheckInput } from "~/routes/config.$projectId.basic";

//@todo: delete field

export const Sorter = ({
  names,
  onUpdate,
  defaultActive = ["email"],
}: {
  defaultActive?: string[];
  onUpdate?: (order: string[]) => void;
  names: string[];
}) => {
  const [list, setList] = useState(names || []);
  const [active, setActive] = useState<string[]>(defaultActive);

  const updateParent = () => {
    onUpdate?.(list.filter((name) => active.includes(name)));
  };

  const handleIndexUpdate = (prevIndex: number, newIndex: number) => {
    const l = [...list];
    const backup = l.splice(prevIndex, 1);
    l.splice(newIndex, 0, backup[0]);
    setList(l);
    //
  };

  const handleChange = (name: string, checked: boolean) => {
    if (name === "email") return;
    if (checked) {
      const norepeat: string[] = [...new Set([...active, name])];
      setActive(norepeat);
    } else {
      const norepeat: string[] = [
        ...new Set([...active.filter((n) => n !== name)]),
      ];
      setActive(norepeat);
    }
    //
  };

  useEffect(() => {
    updateParent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, active]);

  // @todo guardar en español?
  const getLabel = (name: string) => {
    switch (name) {
      case "name":
        return "Nombre";
      case "email":
        return "Email";
      case "company":
        return "Empresa";
      case "message":
        return "Mensaje";
      case "phone":
        return "Teléfono";
      default:
        return name;
    }
  };

  return (
    <section className="grid grid-cols-3 gap-2">
      <LayoutGroup>
        {list.map((name, i) => (
          <CheckInput
            onUpdate={handleIndexUpdate}
            onChange={handleChange}
            index={i}
            label={getLabel(name)}
            name={name}
            key={i}
            isChecked={name === "email" || active.includes(name)} // not blocking
          />
        ))}
      </LayoutGroup>
    </section>
  );
};
