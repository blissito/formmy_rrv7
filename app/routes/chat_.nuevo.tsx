import { PageContainer } from "~/components/chat/PageContainer";
import { ConfigMenu } from "~/components/chat/ConfigMenu";
import { InfoSources } from "~/components/chat/InfoSources";
import { UploadFiles } from "~/components/chat/UploadFiles";
import { useState } from "react";
import { Website } from "~/components/chat/Website";
import type { WebsiteEntry } from "~/types/website";

export default function ChatbotConfigRoute() {
  const [currentTab, setCurrentTab] = useState("website");
  const [websiteEntries, setWebsiteEntries] = useState<WebsiteEntry[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleTabClick = (tabName: string) => () => {
    setCurrentTab(tabName);
  };

  const handleSubmit = () => {};
  const handleWebsiteChange = (entries: WebsiteEntry[]) => {
    setWebsiteEntries(entries);
  };
  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files);
  };

  return (
    <>
      <PageContainer>
        <PageContainer.Title back="/chat">
          {"Nuevo Chatbot"}
        </PageContainer.Title>
        <PageContainer.StickyGrid>
          <ConfigMenu current="files">
            <ConfigMenu.MenuButton
              isActive={currentTab === "files"}
              onClick={handleTabClick("files")}
              src={"/assets/chat/document.svg"}
            >
              Archivos
            </ConfigMenu.MenuButton>
            <ConfigMenu.MenuButton
              isActive={currentTab === "website"}
              onClick={handleTabClick("website")}
              src={"/assets/chat/earth.svg"}
            >
              Website
            </ConfigMenu.MenuButton>
          </ConfigMenu>
          {currentTab === "files" && (
            <UploadFiles onChange={handleFilesChange} />
          )}
          {currentTab === "website" && (
            <Website
              websiteEntries={websiteEntries}
              onWebsiteEntriesChange={handleWebsiteChange}
            />
          )}
          <InfoSources
            className="hidden lg:block"
            websiteEntries={websiteEntries}
            uploadedFiles={uploadedFiles}
          />
        </PageContainer.StickyGrid>
      </PageContainer>
    </>
  );
}

export const meta = ({ data }: { data: any }) => {
  if (!data?.chatbot) {
    return [
      { title: "Chatbot Not Found" },
      {
        name: "description",
        content: "The requested chatbot could not be found",
      },
    ];
  }

  return [
    { title: `Configure: ${data.chatbot.name}` },
    {
      name: "description",
      content: `Configure your chatbot: ${data.chatbot.name}`,
    },
  ];
};
