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

export const Entrenamiento = () => {
  const { currentTab, setCurrentTab } = useChipTabs("files");
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
        <section className="grid gap-6">
          <UploadFiles />
          <ListFiles />
        </section>
        <section className="hidden lg:block">
          <InfoSources />
        </section>
      </StickyGrid>
    </article>
  );
};
