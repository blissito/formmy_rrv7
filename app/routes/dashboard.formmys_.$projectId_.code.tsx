import { PageContainer } from "~/components/chat/PageContainer";
import { useState } from "react";
import { useLoaderData } from "react-router";
import { MiniCardGroup } from "~/components/chat/common/Card";
import { getUserOrRedirect, getProjectWithAccess } from "server/getUserUtils.server";
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
      
      <div className="flex flex-col max-w-[600px] mx-auto">
        <img  src="/assets/fantasma-globo.svg" alt="rocket" className="md:w-[246px] md:h-[246px] w-[180px] h-[180px] mx-auto mb-0 md:mb-4" />
        <h3 className="md:text-2xl text-xl font-bold text-center mb-2">¡Tu formmy está listo!</h3>
        <p className="text-center text-metal mb-4 md:mb-6">
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
  const projectId = params.projectId!;
  
  // Use centralized function - requires read permission for code access
  const access = await getProjectWithAccess(user.id, projectId, "read");
  
  if (!access) {
    throw new Response("Project not found", { status: 404 });
  }

  const url = new URL(request.url);
  const isDev = process.env.NODE_ENV === "development";
  
  const urls = {
    iframe: isDev
      ? `<iframe src="http://${url.host}/embed/${access.project.id}" width="100%" height="600" frameborder="0"></iframe>`
      : `<iframe src="https://${url.host}/embed/${access.project.id}" width="100%" height="600" frameborder="0"></iframe>`,
    link: isDev
      ? `http://${url.host}/preview/${access.project.id}`
      : `https://${url.host}/preview/${access.project.id}`,
  };

  return { user, project: access.project, urls };
};