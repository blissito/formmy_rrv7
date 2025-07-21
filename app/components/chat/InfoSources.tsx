import { Button } from "./PageContainer";

export const InfoSources = ({ className }: { className?: string }) => {
  return (
    <article className={className}>
      <section className="grid gap-2 border border-gray-300 rounded-2xl p-4 shadow min-w-[220px] text-xs">
        <div className="flex gap-2 items-center">
          <span className="w-4">
            <img src="/assets/chat/receipt.svg" alt="icon" />
          </span>
          <h4 className="font-medium">Fuentes de información</h4>
        </div>
        <div className="flex gap-2 items-center">
          <span className="w-4">
            <img src="/assets/chat/document.svg" alt="icon" />
          </span>
          <p className="text-gray-600">3 archivos</p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="w-4">
            <img src="/assets/chat/message.svg" alt="icon" />
          </span>
          <p className="text-gray-600">5 preguntas</p>
        </div>
        <hr className="border-b border-dashed my-3 w-[80%] mx-auto" />
        <div className="flex justify-between">
          <p>Peso total:</p>
          <div className="grid">
            <span>200KB</span>
            <span className="text-gray-500">/ 800KB</span>
          </div>
        </div>
        <Button className="mt-4">Actualizar Chatbot</Button>
      </section>
    </article>
  );
};
