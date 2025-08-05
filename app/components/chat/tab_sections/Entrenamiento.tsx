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
import { Website } from "../Website";
import type { Chatbot, User } from "@prisma/client";
import { useEffect, useState } from "react";

export const Entrenamiento = ({ chatbot, user }: { chatbot: Chatbot; user: User }) => {
  const { currentTab, setCurrentTab } = useChipTabs("files");
  const [fileContexts, setFileContexts] = useState<any[]>([]);
  
  useEffect(() => {
    // Extraer archivos del contexto del chatbot
    if (chatbot.contexts && typeof chatbot.contexts === 'object') {
      const contexts = chatbot.contexts as any;
      const files = Object.entries(contexts)
        .filter(([key, value]: [string, any]) => value.fileName && value.fileType)
        .map(([key, value]: [string, any]) => ({
          name: value.fileName,
          size: (value.sizeKB || 0) * 1024, // Convertir KB a bytes
          type: value.fileType
        }));
      setFileContexts(files);
    }
  }, [chatbot.contexts]);
  
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
          <section className="grid gap-6">
            <UploadFiles />
            {fileContexts.length > 0 && <ListFiles files={fileContexts} />}
          </section>
        )}
        {currentTab === "text" && <TextForm />}
        {currentTab === "website" && <Website />}

        <section className="hidden lg:block">
          <InfoSources />
        </section>
      </StickyGrid>
    </article>
  );
};
