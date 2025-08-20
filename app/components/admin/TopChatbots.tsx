interface ChatbotData {
  name: string;
  conversationCount: number;
  monthlyUsage: number | null;
  user: { email: string };
}

interface TopChatbotsProps {
  topChatbots: ChatbotData[];
}

export function TopChatbots({ topChatbots }: TopChatbotsProps) {
  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Top Chatbots</h2>
      <div className="space-y-3">
        {topChatbots.map((bot, i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b last:border-b-0">
            <div>
              <div className="font-medium">{bot.name}</div>
              <div className="text-sm text-gray-600">{bot.user.email}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{bot.conversationCount}</div>
              <div className="text-sm text-gray-600">conversaciones</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}