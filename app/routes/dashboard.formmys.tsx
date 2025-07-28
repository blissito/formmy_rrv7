import { useSubmit } from "react-router";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { getUserChatbotsWithPlanInfo } from "server/chatbot/userModel.server";
import { PageContainer } from "~/components/chat/PageContainer";
import type { Route } from "./+types/chat";
import { useState } from "react";

type LoaderData = {
  user: Awaited<ReturnType<typeof getUserOrRedirect>>;
  plan: Awaited<ReturnType<typeof getUserChatbotsWithPlanInfo>>['plan'];
  limits: Awaited<ReturnType<typeof getUserChatbotsWithPlanInfo>>['limits'];
  chatbots: Awaited<ReturnType<typeof getUserChatbotsWithPlanInfo>>['chatbots'];
  canCreateMore: boolean;
};

/**
 * Loader function for the dashboard formmys route
 * Fetches user data and chatbots with plan information
 */
export const loader = async ({ request }: Route.LoaderArgs): Promise<LoaderData> => {
  // Get the current user or redirect to login
  const user = await getUserOrRedirect(request);
  // Get all chatbots for the user with plan information
  const chatbotsWithPlanInfo = await getUserChatbotsWithPlanInfo(user.id);
  
  return {
    user,
    plan: chatbotsWithPlanInfo.plan,
    limits: chatbotsWithPlanInfo.limits,
    chatbots: chatbotsWithPlanInfo.chatbots,
    canCreateMore: chatbotsWithPlanInfo.limits.canCreateMore,
  };
};

export default function DashboardFormmys({ loaderData }: { loaderData: LoaderData }) {
  const { user, chatbots = [], canCreateMore } = loaderData;
  const [isLoading, setIsLoading] = useState(false);
  const submit = useSubmit();

  return (
   <section>
     <div className="max-w-7xl mx-auto py-8">
             <PageContainer.Title
               cta={
                 <PageContainer.Button 
                   isLoading={isLoading} 
                   to="/chat/nuevo"
                   onClick={() => {
                     if (!canCreateMore) {
                       // Handle case when user can't create more chatbots
                       // You might want to show a modal or toast message here
                       return;
                     }
                     setIsLoading(true);
                   }}
                 >
                   + Formmy
                 </PageContainer.Button>
               }
             >
             <h2 className="heading text-4xl">Tus Formmys</h2>
             </PageContainer.Title>
             <section className="my-10 flex flex-wrap gap-6">
             
             </section>
      </div>
   </section>
)};