import { Input } from "./Input";
import { cn } from "~/lib/utils";
import { Select } from "./Select";
import type { WebsiteEntry } from "~/types/website";
import { BsThreeDots } from "react-icons/bs";
import { useState, useRef, useEffect } from "react";
import DeleteIcon from "~/components/ui/icons/Delete";
import EditIcon from "~/components/ui/icons/Edit";

export const Table = ({
  noSelect,
  noSearch,
  title,
  className,
  websiteEntries = [],
  onRemoveEntry,
  onEditEntry,
}: {
  noSearch?: true;
  noSelect?: true;
  className?: string;
  title?: string;
  websiteEntries?: WebsiteEntry[];
  onRemoveEntry?: (index: number) => void;
  onEditEntry?: (index: number) => void;
}) => {
  return (
    <article>
      <main
        className={cn(
          "rounded-3xl border border-gray-300 md:p-6 p-4 shadow-standard  ",
          className
        )}
      >
        <section className="flex justify-between items-center">
          <h3 className="font-medium text-lg md:text-2xl">{title}</h3>
          {!noSearch && (
            <Input
              containerClassName="rounded-full"
              left={
                <span className="flex items-center h-full pr-2">
                  <img
                    className="w-8"
                    alt="search icon"
                    src="/assets/chat/search.svg"
                  />
                </span>
              }
              placeholder="Buscar..."
              name="search"
            />
          )}
        </section>

        {!noSelect && <Header />}
        <hr className="my-2" />
        {websiteEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay sitios web agregados aún
          </div>
        ) : (
          <div className="space-y-2">
            {websiteEntries.map((entry, index) => (
              <LinkRow
                noSelect
                key={index}
                entry={entry}
                onRemove={() => onRemoveEntry?.(index)}
                onEdit={() => onEditEntry?.(index)}
              />
            ))}
          </div>
        )}
      </main>
    </article>
  );
};

const LinkRow = ({
  entry,
  onRemove,
  onEdit,
  noSelect,
}: {
  noSelect?: true;
  entry: WebsiteEntry;
  onRemove?: () => void;
  onEdit?: () => void;
}) => {
  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "hace un momento";
    if (diffInMinutes < 60)
      return `hace ${diffInMinutes} minuto${diffInMinutes > 1 ? "s" : ""}`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
      return `hace ${diffInHours} hora${diffInHours > 1 ? "s" : ""}`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `hace ${diffInDays} día${diffInDays > 1 ? "s" : ""}`;
  };

  const displayUrl = entry.url.startsWith("http")
    ? entry.url
    : `https://${entry.url}`;

  return (
    <main className="group w-full flex items-center justify-between md:py-2 py-1 hover:bg-gray-50 rounded-lg px-0 md:px-2">
      <div className="flex items-center md:gap-4 gap-2 max-w-[80%]">
        {!noSelect && <Checkbox />}
        <div className="min-w-10 h-10 bg-irongray/10 rounded-full flex items-center justify-center">
          <img className="w-7" alt="world icon" src={`/assets/chat/earth.svg`} />
        </div>
        <div className=" overflow-hidden  max-w-[200px] lg:max-w-[400px]">
          <h4 className="font-semibold truncate" title={displayUrl}>{displayUrl}</h4>
          <p className="text-gray-600 text-xs">
            Última actualización: {formatLastUpdated(entry.lastUpdated)} |{" "}
            {entry.routes.length} página{entry.routes.length !== 1 ? "s" : ""}{" "}
            encontrada{entry.routes.length !== 1 ? "s" : ""}
          </p>
          {(entry.includeRoutes?.length || entry.excludeRoutes?.length) && (
            <p className="text-gray-500 text-xs mt-1">
              {entry.includeRoutes?.length &&
                `Incluye: ${entry.includeRoutes.join(", ")}`}
              {entry.includeRoutes?.length &&
                entry.excludeRoutes?.length &&
                " | "}
              {entry.excludeRoutes?.length &&
                `Excluye: ${entry.excludeRoutes.join(", ")}`}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 ">
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full hidden md:block">
          {entry.updateFrequency === "monthly" ? "Mensual" : "Anual"}
        </span>
        <DropdownMenu onEdit={onEdit} onRemove={onRemove} />
      </div>
    </main>
  );
};

const Header = () => {
  return (
    <header className="flex justify-between items-center py-2">
      <div className="flex items-center gap-2">
        <Checkbox />
        <p className="text-gray-600 w-max">Seleccionar todos</p>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-gray-600">Filtrar por: </p>
        <Select
          className="min-w-min"
          options={[{ label: "Todos", value: "all" }]}
        />
      </div>
    </header>
  );
};

const Checkbox = () => {
  return <input type="checkbox" className="rounded border-gray-300" />;
};

const DropdownMenu = ({
  onEdit,
  onRemove,
}: {
  onEdit?: () => void;
  onRemove?: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleEdit = () => {
    onEdit?.();
    setIsOpen(false);
  };

  const handleRemove = () => {
    onRemove?.();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xl text-gray-600 hover:text-gray-800 transition-colors p-1"
        title="Más opciones"
      >
        <BsThreeDots />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px] z-10">
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <EditIcon className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={handleRemove}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-red-50 transition-colors"
          >
            <DeleteIcon className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
};
