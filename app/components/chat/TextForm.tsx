import { Button } from "../Button";
import { Card } from "./common/Card";
import { Input } from "./common/Input";
import { InputRich } from "./common/InputRich";
import { CardHeader, CardRow } from "./ListFiles";

export const TextForm = ({
  title,
  content,
  textContexts,
  onTitleChange,
  onContentChange,
  onAddContext,
  onRemoveContext,
}: {
  title: string;
  content: string;
  textContexts: any[];
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onAddContext: () => void;
  onRemoveContext: (index: number, context: any) => void;
}) => {
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
          value={title}
          onChange={onTitleChange}
        />
        <hr className="my-3 border-none" />
        <InputRich
          label="Información"
          value={content}
          onChange={onContentChange}
          placeholder="Escribe tu mensaje..."
        />
          <Button 
            className="w-full md:w-fit h-10 mr-0"
            onClick={onAddContext}
            isDisabled={!title.trim() || !content.trim()}
          >
            Agregar
          </Button>
      </Card>
      <hr className="my-3 border-none" />
      {textContexts.length > 0 && (
        <Card noSearch={false} title="Fuentes de texto">
          <CardHeader
            left={
              <input
                className="rounded-md border-gray-300 scale-110 "
                type="checkbox"
                onChange={() => {}}
              />
            }
            title="Seleccionar todos"
          />
          {textContexts.map((context, index) => (
            <CardRow
              key={context.id}
              text={context.sizeKB ? `${context.sizeKB}kb` : "0kb"}
              title={context.title}
              icon={
                <img
                  className="w-6"
                  src="/assets/chat/increase.svg"
                  alt="text icon"
                />
              }
              onRemove={() => onRemoveContext(index, context)}
            />
          ))}
        </Card>
      )}
    </article>
  );
};
