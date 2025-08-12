import { useChipTabs } from "../common/ChipTabs";
import {
  ArchivosButton,
  ConfigMenu,
  TextButton,
  GoogleDriveButton,
  NotionButton,
  PreguntasButton,
  WebsiteButton,
} from "../ConfigMenu";
import { InfoSources } from "../InfoSources";
import { ListFiles } from "../ListFiles";
import { StickyGrid } from "../PageContainer";
import { UploadFiles } from "../UploadFiles";
import { TextForm } from "../TextForm";
import { QuestionsForm } from "../QuestionsForm";
import { Website } from "../Website";
import type { Chatbot, User } from "@prisma/client";
import type { WebsiteEntry } from "~/types/website";
import { useEffect, useState } from "react";
import { useSubmit } from "react-router";

export const Entrenamiento = ({
  chatbot,
  user,
}: {
  chatbot: Chatbot;
  user: User;
}) => {
  const submit = useSubmit();
  const { currentTab, setCurrentTab } = useChipTabs("website", `entrenamiento_${chatbot.id}`);
  const [fileContexts, setFileContexts] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [existingWebsites, setExistingWebsites] = useState<WebsiteEntry[]>([]);
  const [newWebsiteEntries, setNewWebsiteEntries] = useState<WebsiteEntry[]>(
    []
  );
  const [textContexts, setTextContexts] = useState<any[]>([]);
  const [textContextsToRemove, setTextContextsToRemove] = useState<any[]>([]);
  const [fileContextsToRemove, setFileContextsToRemove] = useState<any[]>([]);
  const [websiteContextsToRemove, setWebsiteContextsToRemove] = useState<any[]>([]);
  const [questionContexts, setQuestionContexts] = useState<any[]>([]);
  const [questionContextsToRemove, setQuestionContextsToRemove] = useState<any[]>([]);
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [questionTitle, setQuestionTitle] = useState("");
  const [questions, setQuestions] = useState<string[]>([""]);
  const [answer, setAnswer] = useState("");
  const [isAddingText, setIsAddingText] = useState(false);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingQuestionContext, setEditingQuestionContext] = useState<any>(null);
  const [editingTextContext, setEditingTextContext] = useState<any>(null);

  useEffect(() => {
    // Extraer archivos del contexto del chatbot
    if (chatbot.contexts && Array.isArray(chatbot.contexts)) {
      const fileContextsFromDb = chatbot.contexts
        .filter((context: any) => context.type === "FILE" && context.fileName)
        .map((context: any) => ({
          id: context.id,
          fileName: context.fileName,
          fileType: context.fileType,
          sizeKB: context.sizeKB,
          content: context.content,
        }));
      setFileContexts(fileContextsFromDb);

      // Extraer sitios web del contexto del chatbot
      const websiteContextsFromDb = chatbot.contexts
        .filter((context: any) => context.type === "LINK" && context.url)
        .map((context: any) => ({
          url: context.url,
          content: context.content || "",
          routes:
            context.routes && context.routes.length > 0
              ? context.routes
              : [context.url], // Usar rutas reales o fallback
          includeRoutes: undefined,
          excludeRoutes: undefined,
          updateFrequency: "monthly" as const,
          lastUpdated: new Date(context.createdAt),
          contextId: context.id, // Guardamos el ID para poder eliminar
        }));

      // Actualizar los sitios web existentes desde la base de datos
      setExistingWebsites(websiteContextsFromDb);

      // Extraer contextos de texto del chatbot
      const textContextsFromDb = chatbot.contexts
        .filter((context: any) => context.type === "TEXT" && context.title)
        .map((context: any) => ({
          id: context.id,
          title: context.title,
          content: context.content,
          sizeKB: context.sizeKB,
        }));
      setTextContexts(textContextsFromDb);

      // Extraer contextos de preguntas del chatbot
      const questionContextsFromDb = chatbot.contexts
        .filter((context: any) => context.type === "QUESTION" && context.title)
        .map((context: any) => ({
          id: context.id,
          title: context.title,
          questions: typeof context.questions === 'string' ? context.questions.split('\n').filter(q => q.trim()) : context.questions,
          answer: context.answer,
          sizeKB: context.sizeKB,
        }));
      setQuestionContexts(questionContextsFromDb);
    }
  }, [chatbot.contexts]);

  const handleFilesChange = (newFiles: File[]) => {
    // Agregar nuevos archivos a los existentes, evitando duplicados por nombre
    setUploadedFiles((prevFiles) => {
      const existingNames = new Set(prevFiles.map((file) => file.name));
      const uniqueNewFiles = newFiles.filter(
        (file) => !existingNames.has(file.name)
      );
      return [...prevFiles, ...uniqueNewFiles];
    });
  };

  const handleRemoveUploadedFile = (index: number, file: File) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
  };

  const handleAddTextContext = async () => {
    if (!textTitle.trim() || !textContent.trim()) {
      return;
    }

    setIsAddingText(true);
    try {
      const formData = new FormData();
      
      if (editingTextContext) {
        // Actualizar contexto existente
        formData.append("intent", "update_text_context");
        formData.append("contextId", editingTextContext.id);
      } else {
        // Agregar nuevo contexto
        formData.append("intent", "add_text_context");
      }
      
      formData.append("chatbotId", chatbot.id);
      formData.append("title", textTitle.trim());
      formData.append("content", textContent.trim());
      formData.append(
        "sizeKB",
        Math.ceil(textContent.length / 1024).toString()
      );

      const response = await fetch("/api/v1/chatbot", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        console.log(`Contexto de texto ${editingTextContext ? 'actualizado' : 'agregado'} exitosamente`);
        // Limpiar formulario y recargar datos
        setTextTitle("");
        setTextContent("");
        setEditingTextContext(null);
        // Forzar recarga de datos con un parámetro dummy para evitar cache
        submit({ _timestamp: Date.now().toString() }, { method: "get" });
      } else {
        throw new Error(`Error ${editingTextContext ? 'actualizando' : 'agregando'} contexto de texto`);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsAddingText(false);
    }
  };

  const handleRemoveTextContext = (index: number, context: any) => {
    // Si estamos editando este contexto, limpiar el formulario
    if (editingTextContext && editingTextContext.id === context.id) {
      setEditingTextContext(null);
      setTextTitle("");
      setTextContent("");
    }

    // Marcar para eliminar (virtual)
    setTextContextsToRemove(prev => [...prev, context]);
    
    // Remover del estado local para que no se muestre
    const newContexts = [...textContexts];
    newContexts.splice(index, 1);
    setTextContexts(newContexts);
  };

  const handleEditTextContext = (index: number, context: any) => {
    // Popular el formulario con los datos del contexto
    setTextTitle(context.title || "");
    setTextContent(context.content || "");
    
    // Marcar como editando
    setEditingTextContext(context);
  };

  const handleCancelEditText = () => {
    // Limpiar formulario y salir del modo de edición
    setTextTitle("");
    setTextContent("");
    setEditingTextContext(null);
  };

  const handleAddQuestionContext = async () => {
    const validQuestions = questions.filter(q => q.trim());
    if (!questionTitle.trim() || validQuestions.length === 0 || !answer.trim()) {
      return;
    }

    setIsAddingQuestion(true);
    try {
      const formData = new FormData();
      
      if (editingQuestionContext) {
        // Actualizar contexto existente
        formData.append("intent", "update_question_context");
        formData.append("contextId", editingQuestionContext.id);
      } else {
        // Agregar nuevo contexto
        formData.append("intent", "add_question_context");
      }
      
      formData.append("chatbotId", chatbot.id);
      formData.append("title", questionTitle.trim());
      formData.append("questions", validQuestions.join('\n'));
      formData.append("answer", answer.trim());
      formData.append(
        "sizeKB",
        Math.ceil((questionTitle.length + validQuestions.join('\n').length + answer.length) / 1024).toString()
      );

      const response = await fetch("/api/v1/chatbot", {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json();

      if (response.ok) {
        console.log(`Contexto de pregunta ${editingQuestionContext ? 'actualizado' : 'agregado'} exitosamente`);
        // Limpiar formulario y recargar datos
        setQuestionTitle("");
        setQuestions([""]);
        setAnswer("");
        setEditingQuestionContext(null);
        // Forzar recarga de datos con un parámetro dummy para evitar cache
        submit({ _timestamp: Date.now().toString() }, { method: "get" });
      } else {
        throw new Error(responseData.error || `Error ${editingQuestionContext ? 'actualizando' : 'agregando'} contexto de pregunta`);
      }
    } catch (error) {
      console.error(`Error ${editingQuestionContext ? 'actualizando' : 'agregando'} contexto de pregunta:`, error);
      throw error;
    } finally {
      setIsAddingQuestion(false);
    }
  };

  const handleRemoveQuestionContext = (index: number, context: any) => {
    // Si estamos editando este contexto, limpiar el formulario
    if (editingQuestionContext && editingQuestionContext.id === context.id) {
      setEditingQuestionContext(null);
      setQuestionTitle("");
      setQuestions([""]);
      setAnswer("");
    }

    // Marcar para eliminar (virtual)
    setQuestionContextsToRemove(prev => [...prev, context]);
    
    // Remover del estado local para que no se muestre
    const newContexts = [...questionContexts];
    newContexts.splice(index, 1);
    setQuestionContexts(newContexts);
  };

  const handleEditQuestionContext = (index: number, context: any) => {
    // Popular el formulario con los datos del contexto
    setQuestionTitle(context.title);
    
    // Manejar tanto arrays como strings para las preguntas
    const contextQuestions = Array.isArray(context.questions) 
      ? context.questions 
      : context.questions?.split('\n').filter((q: string) => q.trim()) || [""];
    
    setQuestions(contextQuestions.length > 0 ? contextQuestions : [""]);
    setAnswer(context.answer || "");
    
    // Marcar como editando
    setEditingQuestionContext(context);
  };

  const handleCancelEditQuestion = () => {
    // Limpiar formulario y salir del modo de edición
    setQuestionTitle("");
    setQuestions([""]);
    setAnswer("");
    setEditingQuestionContext(null);
  };

  const handleQuestionsChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, ""]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      const newQuestions = questions.filter((_, i) => i !== index);
      setQuestions(newQuestions);
    }
  };

  const handleUploadFiles = async () => {
    // Subir archivos nuevos al chatbot existente
    for (const file of uploadedFiles) {
      try {
        const fileContextData = new FormData();
        fileContextData.append("intent", "add_file_context");
        fileContextData.append("chatbotId", chatbot.id);
        fileContextData.append("fileName", file.name);
        fileContextData.append(
          "fileType",
          file.type || "application/octet-stream"
        );
        fileContextData.append("fileUrl", "");
        fileContextData.append(
          "sizeKB",
          Math.ceil(file.size / 1024).toString()
        );
        fileContextData.append("file", file);

        const response = await fetch("/api/v1/chatbot", {
          method: "POST",
          body: fileContextData,
        });

        if (!response.ok) {
          throw new Error(`Error subiendo archivo ${file.name}`);
        }
      } catch (error) {
        throw error;
      }
    }

    // Limpiar archivos subidos y recargar datos
    setUploadedFiles([]);
    submit({});
  };

  const handleRemoveContext = (index: number, context: any) => {
    // Marcar archivo para eliminar (virtual)
    setFileContextsToRemove(prev => [...prev, context]);
    
    // Remover del estado local para que no se muestre
    const newContexts = [...fileContexts];
    newContexts.splice(index, 1);
    setFileContexts(newContexts);
  };

  const handleUpdateChatbot = async () => {
    setIsUpdating(true);

    try {
      // Subir archivos automáticamente cuando se presiona "Actualizar Chatbot"
      await handleUploadFiles();

      // Agregar sitios web nuevos como contextos
      for (const entry of newWebsiteEntries) {
        try {
          const contextFormData = new FormData();
          contextFormData.append("intent", "add_url_context");
          contextFormData.append("chatbotId", chatbot.id);
          contextFormData.append(
            "url",
            entry.url.startsWith("http") ? entry.url : `https://${entry.url}`
          );
          contextFormData.append("title", entry.url);
          contextFormData.append("content", entry.content);
          contextFormData.append(
            "sizeKB",
            Math.ceil(entry.content.length / 1024).toString()
          );
          contextFormData.append("routes", JSON.stringify(entry.routes));

          const contextResponse = await fetch("/api/v1/chatbot", {
            method: "POST",
            body: contextFormData,
          });

          if (!contextResponse.ok) {
            const errorData = await contextResponse.json();
            throw new Error(
              `Error al agregar contexto para ${entry.url}: ${errorData.error}`
            );
          }
        } catch (error) {
          throw error;
        }
      }

      // Eliminar contextos marcados para eliminar (archivos, websites, texto, preguntas)
      const allContextsToRemove = [...fileContextsToRemove, ...websiteContextsToRemove, ...textContextsToRemove, ...questionContextsToRemove];
      
      for (const context of allContextsToRemove) {
        try {
          const formData = new FormData();
          formData.append("intent", "remove_context");
          formData.append("chatbotId", chatbot.id);
          formData.append("contextItemId", context.id || context.contextId);

          const response = await fetch("/api/v1/chatbot", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Error eliminando contexto: ${context.title || context.fileName || context.url}`);
          }
        } catch (error) {
          throw error;
        }
      }

      // Limpiar estados después de subirlos y recargar datos
      const hasChanges = newWebsiteEntries.length > 0 || allContextsToRemove.length > 0;
      if (hasChanges) {
        setNewWebsiteEntries([]);
        setTextContextsToRemove([]);
        setFileContextsToRemove([]);
        setWebsiteContextsToRemove([]);
        setQuestionContextsToRemove([]);
        submit({});
      }
    } catch (error) {
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <article>
      <StickyGrid>
        <section>
          <ConfigMenu current={currentTab}>
            <ArchivosButton
              onClick={() => setCurrentTab("files")}
              current={currentTab}
            />
            <TextButton
              onClick={() => setCurrentTab("text")}
              current={currentTab}
            />
            <WebsiteButton
              onClick={() => setCurrentTab("website")}
              current={currentTab}
            />
            <PreguntasButton
              onClick={() => setCurrentTab("preguntas")}
              current={currentTab}
            />
            <GoogleDriveButton
              onClick={() => setCurrentTab("google_drive")}
              current={currentTab}
            />
            <NotionButton
              onClick={() => setCurrentTab("notion")}
              current={currentTab}
            />
          </ConfigMenu>
        </section>
        {currentTab === "files" && (
          <section className="grid gap-4 md:gap-6">
            <UploadFiles onChange={handleFilesChange} />

            {/* Mostrar archivos pendientes de subir */}
            {uploadedFiles.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">
                  Archivos pendientes de subir
                </h3>
                <ListFiles
                  files={uploadedFiles}
                  onRemoveFile={handleRemoveUploadedFile}
                  mode="local"
                />
              </div>
            )}

            {/* Mostrar contextos existentes */}
            {fileContexts.length > 0 && (
              <div>
             
                <ListFiles
                  files={fileContexts}
                  onRemoveFile={handleRemoveContext}
                  mode="context"
                />
              </div>
            )}
          </section>
        )}
        {currentTab === "text" && (
          <TextForm
            title={textTitle}
            content={textContent}
            textContexts={textContexts}
            onTitleChange={setTextTitle}
            onContentChange={setTextContent}
            onAddContext={handleAddTextContext}
            onRemoveContext={handleRemoveTextContext}
            onEditContext={handleEditTextContext}
            onCancelEdit={handleCancelEditText}
            isAddingText={isAddingText}
            editingContext={editingTextContext}
          />
        )}
        {currentTab === "website" && (
          <Website
            websiteEntries={[...existingWebsites, ...newWebsiteEntries]}
            onWebsiteEntriesChange={(entries) => {
              // Separar sitios existentes de nuevos
              const existing = entries.filter((entry) => entry.contextId);
              const newEntries = entries.filter((entry) => !entry.contextId);
              setExistingWebsites(existing);
              setNewWebsiteEntries(newEntries);
            }}
            onMarkForRemoval={(entry) => {
              // Marcar para eliminar (virtual)
              setWebsiteContextsToRemove(prev => [...prev, entry]);
            }}
            chatbotId={chatbot.id}
          />
        )}
        {currentTab === "preguntas" && (
          <QuestionsForm
            title={questionTitle}
            questions={questions}
            answer={answer}
            questionContexts={questionContexts}
            onTitleChange={setQuestionTitle}
            onQuestionsChange={handleQuestionsChange}
            onAnswerChange={setAnswer}
            onAddContext={handleAddQuestionContext}
            onRemoveContext={handleRemoveQuestionContext}
            onEditContext={handleEditQuestionContext}
            onCancelEdit={handleCancelEditQuestion}
            onAddQuestion={handleAddQuestion}
            onRemoveQuestion={handleRemoveQuestion}
            isAddingQuestion={isAddingQuestion}
            editingContext={editingQuestionContext}
          />
        )}

        <section >
          <InfoSources
            contexts={fileContexts}
            uploadedFiles={uploadedFiles}
            websiteEntries={[...existingWebsites, ...newWebsiteEntries]}
            textContexts={textContexts}
            questionContexts={questionContexts}
            mode="edit"
            onCreateChatbot={handleUpdateChatbot}
            isCreating={isUpdating}
            hasPendingChanges={uploadedFiles.length > 0 || newWebsiteEntries.length > 0 || textContextsToRemove.length > 0 || fileContextsToRemove.length > 0 || websiteContextsToRemove.length > 0 || questionContextsToRemove.length > 0}
          />
        </section>
      </StickyGrid>
    </article>
  );
};
