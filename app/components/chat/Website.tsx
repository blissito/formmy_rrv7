import { useState } from "react";
import { Button } from "../Button";
import { Card } from "./common/Card";
import { Input } from "./common/Input";
import { Select } from "./common/Select";

export const Website = () => {
  const [isDirty, setIsDirty] = useState();
  return (
    <Card
      title="Website o links"
      text={
        <span>
          Rastrea páginas web específicas para actualizar continuamente tu IA.
          Configura las rutas incluidas y excluidas para refinar lo que tu IA
          aprende. Más información.{" "}
          <a className="underline" href="!#">
            Más información
          </a>
        </span>
      }
    >
      <Input
        label="Sitio web"
        className="mb-2"
        left={
          <span className="border-r pr-3 min-h-full flex items-center">
            https://
          </span>
        }
        placeholder="www.firmmy.app"
        name="link"
      />
      <div className="flex justify-between w-full gap-2 flex-wrap md:grid-cols-3">
        <Input
          label="Incluye solo rutas"
          placeholder="/blog, /ayuda"
          name="include"
        />
        <Input
          label="Excluir rutas"
          placeholder="/dash, login/"
          name="exclude"
        />
        <Select
          label="Actualiza cada"
          options={[
            {
              label: "Año",
              value: "yearly",
            },
            {
              label: "Mes",
              value: "monthly",
            },
          ]}
        />
      </div>
      <Button className="mx-0 ml-auto" isDisabled={!isDirty}>
        Agregar
      </Button>
    </Card>
  );
};
