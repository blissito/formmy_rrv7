import { Button } from "../Button";
import { Card } from "./common/Card";
import { Input } from "./common/Input";
import { InputRich } from "./common/InputRich";
import { CardHeader, CardRow } from "./ListFiles";

export const QuestionsForm = ({
  title,
  questions,
  answer,
  questionContexts,
  onTitleChange,
  onQuestionsChange,
  onAnswerChange,
  onAddContext,
  onRemoveContext,
  onEditContext,
  onCancelEdit,
  onAddQuestion,
  onRemoveQuestion,
  isAddingQuestion = false,
  editingContext = null,
}: {
  title: string;
  questions: string[];
  answer: string;
  questionContexts: any[];
  onTitleChange: (title: string) => void;
  onQuestionsChange: (index: number, value: string) => void;
  onAnswerChange: (answer: string) => void;
  onAddContext: () => void;
  onRemoveContext: (index: number, context: any) => void;
  onEditContext: (index: number, context: any) => void;
  onCancelEdit?: () => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (index: number) => void;
  isAddingQuestion?: boolean;
  editingContext?: any;
}) => {
  return (
    <article className="flex flex-col gap-4 md:gap-6">
      <Card
        title="Preguntas específicas"
        text={
          <p>
            Agrega pares de preguntas y respuestas específicas para entrenar a
            tu agente de IA con información precisa y contextual.{" "}
            <a href="#!" className="underline">
              Más información
            </a>
          </p>
        }
      >
        <Input
          label="Título"
          placeholder="Horarios de atención"
          type="text"
          name="title"
          value={title}
          onChange={onTitleChange}
          className="mb-4 md:mb-6"
        />
   
        <div className="mb-4 md:mb-6">
          <label className="block text-sm  text-metal mb-2">
            Preguntas
          </label>
          {questions.map((question, index) => (
            <div key={index} className="mb-3 flex items-center gap-2">
              <Input
                placeholder={`Pregunta ${index + 1}: ¿A qué hora abren?`}
                type="text"
                name={`question-${index}`}
                value={question}
                onChange={(value) => onQuestionsChange(index, value)}
              />
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveQuestion(index)}
                  className="text-red-500 hover:text-red-700 px-2 py-1 text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={onAddQuestion}
            className="text-metal hover:text-metal/80 text-sm font-medium"
          >
            + Agregar pregunta
          </button>
        </div>

        <InputRich
          label="Respuesta"
          value={answer}
          onChange={onAnswerChange}
          placeholder="Estamos abiertos de lunes a viernes de 9:00 AM a 6:00 PM..."
        />
         <div className="flex gap-4 justify-end items-center mt-6">
          {editingContext && onCancelEdit && (
            <Button
              variant="outline"
              className="mt-0 mx-0 h-10 px-3 min-w-[120px] rounded-full"
              onClick={onCancelEdit}
              isDisabled={isAddingQuestion}
            >
              Cancelar
            </Button>
          )}
          <Button
              className="mt-0 mx-0 h-10"
            onClick={onAddContext}
            isDisabled={
              !title.trim() ||
              questions.some((q) => !q.trim()) ||
              questions.length === 0 ||
              !answer.trim() ||
              isAddingQuestion
            }
          >
            {isAddingQuestion
              ? editingContext
                ? "Actualizando..."
                : "Agregando..."
              : editingContext
                ? "Actualizar"
                : "Agregar"}
          </Button>
        </div>
      </Card>

      {questionContexts.length > 0 && (
        <Card noSearch title="Preguntas y respuestas" navClassName="!mb-4">
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
          {questionContexts.map((context, index) => (
            <CardRow
              key={context.id}
              text={context.sizeKB ? `${context.sizeKB}kb` : "0kb"}
              title={context.title}
              subtitle={
                Array.isArray(context.questions)
                  ? context.questions.slice(0, 2).join(", ") +
                    (context.questions.length > 2 ? "..." : "")
                  : context.questions?.split("\n").slice(0, 2).join(", ") +
                    (context.questions?.split("\n").length > 2 ? "..." : "")
              }
              icon={
                <img
                  className="w-6"
                  src="/assets/chat/message.svg"
                  alt="question icon"
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
