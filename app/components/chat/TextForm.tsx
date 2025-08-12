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
  onEditContext,
  onCancelEdit,
  isAddingText = false,
  editingContext = null,
}: {
  title: string;
  content: string;
  textContexts: any[];
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onAddContext: () => void;
  onRemoveContext: (index: number, context: any) => void;
  onEditContext: (index: number, context: any) => void;
  onCancelEdit?: () => void;
  isAddingText?: boolean;
  editingContext?: any;
}) => {
  return (
    <article className="flex flex-col gap-4 md:gap-6">
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
          className="mb-4 md:mb-6"
        />

        <InputRich
          label="Información"
          value={content}
          onChange={onContentChange}
          placeholder="Escribe tu mensaje..."
        />
          <div className="flex gap-4 justify-end items-center mt-6">
            {editingContext && onCancelEdit && (
              <Button
                variant="outline"
                className="mt-0 mx-0 h-10 px-3 min-w-[120px] rounded-full"
                onClick={onCancelEdit}
                isDisabled={isAddingText}
              >
                Cancelar
              </Button>
            )}
            <Button 
              className="mt-0 mx-0 h-10"
              onClick={onAddContext}
              isDisabled={!title.trim() || !content.trim() || isAddingText}
            >
              {isAddingText 
                ? editingContext 
                  ? "Actualizando..." 
                  : "Agregando..." 
                : editingContext 
                  ? "Actualizar" 
                  : "Agregar"}
            </Button>
          </div>
      </Card>

      {textContexts.length > 0 && (
        <Card noSearch title="Fuentes de texto" navClassName="!mb-4">
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
              subtitle={context.content ? context.content.substring(0, 100) + (context.content.length > 100 ? '...' : '') : ''}
              icon={
                <img
                  className="w-6"
                  src="/assets/chat/increase.svg"
                  alt="text icon"
                />
              }
              onRemove={() => onRemoveContext(index, context)}
              onEdit={() => onEditContext(index, context)}
            />
          ))}
        </Card>
      )}
    </article>
  );
};
