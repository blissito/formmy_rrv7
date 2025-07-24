import { Button } from "../Button";
import { Card } from "./common/Card";
import { Input } from "./common/Input";
import { InputRich } from "./common/InputRich";
import { CardHeader, CardRow } from "./ListFiles";

export const TextForm = () => {
  return (
    <article>
      <Card
        title="Texto"
        text={
          <p>
            Agrega y procesa fuentes de texto sin formato para entrenar a su
            agente de IA con información precisa.{" "}
            <a href="#!" className="underline">
              Más información
            </a>
          </p>
        }
      >
        <Input
          label="Título"
          placeholder="Horarios de servicio"
          type="text"
          name="title"
        />
        <hr className="my-3 border-none" />
        <InputRich
          label="Información"
          value={"Perro"}
          onChange={(html) => console.log(html)}
          placeholder="Escribe tu mensaje..."
        />
        <Button className="ml-auto">Agregar</Button>
      </Card>
      <hr className="my-3 border-none" />
      <Card noSearch={false} title="Fuentes de texto">
        <CardHeader
          left={
            <input
              className="rounded-md border-gray-300 scale-110"
              type="checkbox"
              onChange={() => {}}
            />
          }
          title="Seleccionar todos"
        />
        <CardRow
          text={"60kb"}
          title="Horarios de servicio"
          icon={
            <img
              className="w-6"
              src="/assets/chat/increase.svg"
              alt="text icon"
            />
          }
        />
        <CardRow
          title="Política de devoluciones"
          text="120 kb"
          icon={
            <img
              className="w-6"
              src="/assets/chat/increase.svg"
              alt="text icon"
            />
          }
        />
      </Card>
    </article>
  );
};
