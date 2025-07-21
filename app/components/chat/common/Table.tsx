import { Input } from "./Input";
import { cn } from "~/lib/utils";
import { Select } from "./Select";
import { BsThreeDots } from "react-icons/bs";

export const Table = ({
  title,
  className,
}: {
  className?: string;
  title?: string;
}) => {
  return (
    <article>
      <main
        className={cn(
          "rounded-3xl border border-gray-300 py-6 px-4",
          className
        )}
      >
        <section className="flex justify-between items-center">
          <h3 className="font-medium text-2xl">{title}</h3>
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
        </section>
        <Header />
        <hr className="my-2" />
        <LinkRow link="https://www.fixtergeek.com" />
      </main>
    </article>
  );
};

const LinkRow = ({ link }: { link?: string }) => {
  return (
    <main className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Checkbox />
        <div>
          <img alt="worlkd icon" src={`/assets/chat/earth.svg`} />
        </div>
        <div>
          <h4 className="semibold">{link}</h4>
          <p className="text-gray-600 text-xs">
            Última actualización: hace 2 días | 9 link
          </p>
        </div>
      </div>
      <button className="text-2xl text-gray-600">
        <BsThreeDots />
      </button>
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
