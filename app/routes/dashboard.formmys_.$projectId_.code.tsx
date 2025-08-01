import { PageContainer } from "~/components/chat/PageContainer";
import { useState } from "react";
import { useLoaderData } from "react-router";
import { MiniCardGroup } from "~/components/chat/common/Card";
import { getUserOrRedirect, getProjectOwner } from "server/getUserUtils.server";
import { CodeBlock } from "~/components/chat/common/CodeBlock";

export default function FormmyCodeRoute() {
  const { project, urls } = useLoaderData<typeof loader>();
  const [miniCard, setMiniCard] = useState("iframe");

  return (
    <PageContainer>
      <PageContainer.Title
        className="mb-2 flex w-full justify-between" 
        back={`/dashboard/formmys/${project.id}`}
      >
        Embebe tu formmy
      </PageContainer.Title>
      
      <div className="flex flex-col gap-4 max-w-[600px] mx-auto">
        <img        src="/assets/fantasma-globo.svg"alt="rocket" className="w-[246px] h-[246px] mx-auto" />
        <h3 className="text-2xl font-bold text-center">¡Tu formmy está listo!</h3>
        <p className="text-center text-gray-600">
          Elige la forma de embebido que más te convenga. {""}
          <a href="#" className="underline">Más información</a>
        </p>
        
        <section>
          <MiniCardGroup selectedMinicard={miniCard} onSelect={setMiniCard}>
            {miniCard === "iframe" && <FormmyIframe urls={urls} />}
            {miniCard === "link" && <FormmyLink urls={urls} />}
          </MiniCardGroup>
        </section>
      </div>
    </PageContainer>
  );
}

// Componentes de embebido
const FormmyIframe = ({ urls }: { urls: { iframe: string } }) => {
    const instructions = [
      { step: "1", description: "Copia el código del iframe" },
      {
        step: "2",
        description: "Pégalo en tu archivo HTML donde quieras que aparezca",
      },
      {
        step: "3",
        description: "Ajusta el width y height según tus necesidades",
      },
      {
        step: "4",
        description: "El formulario se adaptará automáticamente al espacio disponible",
      },
    ];
  
    return (
      <div className="space-y-4">
        <CodeBlock
          title="Instrucciones de configuración"
          language="html"
          code={urls.iframe}
          instructions={instructions}
        />
      </div>
    );
  };



  const FormmyLink = ({ urls }: { urls: { link: string } }) => {
    const instructions = [
      { step: "1", description: "Copia el enlace directo" },
      {
        step: "2",
        description: "Compártelo con tus usuarios por email, redes sociales o cualquier canal",
      },
      {
        step: "3",
        description: "Los usuarios podrán acceder directamente al formulario",
      },
      {
        step: "4",
        description: "El formulario es responsive y se adapta a cualquier dispositivo",
      },
    ];
  
    return (
      <div className="space-y-4">
        <CodeBlock
          title="Instrucciones de configuración"
          language="html"
          code={urls.link}
          instructions={instructions}
        />
      </div>
    );
  };

// Loader para obtener datos del proyecto y generar URLs dinámicas
export const loader = async ({ request, params }: any) => {
  const user = await getUserOrRedirect(request);
  const project = await getProjectOwner({ userId: user.id, projectId: params.projectId! });
  
  if (!project) {
    throw new Response("Project not found", { status: 404 });
  }

  const url = new URL(request.url);
  const isDev = process.env.NODE_ENV === "development";
  
  const urls = {
    iframe: isDev
      ? `<iframe src="http://${url.host}/embed/${project.id}" width="100%" height="600" frameborder="0"></iframe>`
      : `<iframe src="https://${url.host}/embed/${project.id}" width="100%" height="600" frameborder="0"></iframe>`,
    link: isDev
      ? `http://${url.host}/form/${project.id}`
      : `https://${url.host}/form/${project.id}`,
  };

  return { user, project, urls };
};