import { BsThreeDots } from "react-icons/bs";
import { Card } from "./common/Card";

export const ListFiles = () => {
  return (
    <Card title="Lista de archivos" noSearch={false}>
      <section>
        <FileItem />
        <FileItem type="docx" />
      </section>
    </Card>
  );
};

const FileItem = ({ type }: { type?: "docx" }) => {
  return (
    <div className="flex items-center gap-4 justify-between pr-2 border-t py-4 border-gray-300">
      <div className="flex items-center gap-4">
        <input
          className="rounded-md border-gray-300 scale-110"
          type="checkbox"
        />
        <img
          className="w-16"
          src={
            type === "docx" ? "/assets/chat/doc.svg" : "/assets/chat/pdf.svg"
          }
          alt="document"
        />
        <div>
          <div className="flex items-center gap-2">
            <p className="text-lg font-medium">Servicios.pdf</p>
            <Tag />
          </div>
          <span className="text-md font-thin text-gray-500">60Kb</span>
        </div>
      </div>
      <button className="text-2xl text-gray-600">
        <BsThreeDots />
      </button>
    </div>
  );
};

const Tag = () => {
  return (
    <span className="text-xs text-green-600 bg-green-100 rounded-full py-px px-2">
      Nuevo
    </span>
  );
};
