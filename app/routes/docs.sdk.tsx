import { useState } from "react";
import { Streamdown } from "streamdown";
import HomeHeader from "./home/HomeHeader";
import HomeFooter from "./home/HomeFooter";
import getBasicMetaTags from "~/utils/getBasicMetaTags";

export const meta = () =>
  getBasicMetaTags({
    title: "@formmy.app/chat - SDK Documentation | Formmy",
    description:
      "Official React SDK for Formmy AI Chat. Build conversational AI experiences in your applications.",
  });

// Code block component with copy button and syntax highlighting
function CodeBlock({ code, language = "typescript" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const markdownCode = `\`\`\`${language}\n${code}\n\`\`\``;

  return (
    <div className="relative group border border-slate-700 rounded-lg overflow-hidden">
      <div className="streamdown-code-container text-sm overflow-x-auto font-mono [&_pre]:!p-4 [&_pre]:!m-0 [&_pre]:rounded-none">
        <Streamdown shikiTheme={["github-light", "github-dark"]}>{markdownCode}</Streamdown>
      </div>
      <button
        onClick={handleCopy}
        className={`absolute top-2 right-2 px-2 py-1 text-xs rounded transition-all ${
          copied
            ? "bg-green-600 text-white"
            : "bg-slate-700 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-slate-600"
        }`}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

export default function DocsSdk() {
  return (
    <section className="bg-clear pt-32 pb-0 md:pt-40 overflow-hidden">
      <HomeHeader />

      <div className="max-w-4xl mx-auto px-4 md:px-6 pb-20">
        {/* Hero */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">📦</span>
            <h1 className="text-3xl md:text-4xl font-bold text-dark">
              @formmy.app/chat
            </h1>
          </div>
          <p className="text-lg text-metal mb-6">
            Official SDK for Formmy AI Chat. Build conversational AI experiences in your React applications.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <a
              href="https://www.npmjs.com/package/@formmy.app/chat"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z"/>
              </svg>
              npm
            </a>
            <a
              href="/dashboard/api-keys"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium"
            >
              Get API Keys
            </a>
          </div>
        </div>

        {/* Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-dark mb-4 flex items-center gap-2">
            <span>📥</span> Installation
          </h2>
          <CodeBlock code={`npm install @formmy.app/chat`} />
          <p className="text-sm text-metal mt-3">
            That's it! AI SDK is bundled. Only <code className="bg-gray-100 px-1 rounded">react</code> required as peer dependency.
          </p>
        </section>

        {/* API Keys */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-dark mb-4 flex items-center gap-2">
            <span>🔑</span> API Keys
          </h2>
          <p className="text-metal mb-4">
            Get your API keys from the{" "}
            <a href="/dashboard/api-keys" className="text-brand-600 hover:underline">
              dashboard
            </a>.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-outlines rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-dark">Key Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-dark">Prefix</th>
                  <th className="text-left px-4 py-3 font-semibold text-dark">Usage</th>
                  <th className="text-left px-4 py-3 font-semibold text-dark">Scope</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-outlines">
                  <td className="px-4 py-3 text-dark font-medium">Secret Key</td>
                  <td className="px-4 py-3">
                    <code className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs">formmy_sk_live_</code>
                  </td>
                  <td className="px-4 py-3 text-metal">Backend only</td>
                  <td className="px-4 py-3 text-metal">Full API access</td>
                </tr>
                <tr className="border-t border-outlines bg-gray-50">
                  <td className="px-4 py-3 text-dark font-medium">Publishable Key</td>
                  <td className="px-4 py-3">
                    <code className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">formmy_pk_live_</code>
                  </td>
                  <td className="px-4 py-3 text-metal">Frontend safe</td>
                  <td className="px-4 py-3 text-metal">Chat only, domain-restricted</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Start - Backend */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-dark mb-4 flex items-center gap-2">
            <span>🚀</span> Quick Start
          </h2>

          <h3 className="text-lg font-semibold text-dark mb-3">Backend (Node.js)</h3>
          <p className="text-metal mb-4">
            Use the <code className="bg-gray-100 px-1.5 py-0.5 rounded">Formmy</code> client to manage agents and conversations from your server.
          </p>
          <CodeBlock
            code={`import { Formmy } from '@formmy.app/chat';

const formmy = new Formmy({ secretKey: 'formmy_sk_live_xxx' });

// List all agents
const { agents } = await formmy.agents.list();

// Create a new agent
const { agent } = await formmy.agents.create({
  name: 'Customer Support',
  instructions: 'You are a helpful customer support agent.',
  welcomeMessage: 'Hello! How can I help you today?',
});

// Send a message (non-streaming)
const response = await formmy.chat.send({
  agentId: agent.id,
  message: 'Hello!',
});

console.log(response.content);`}
          />
        </section>

        {/* Quick Start - Frontend */}
        <section className="mb-12">
          <h3 className="text-lg font-semibold text-dark mb-3">Frontend (React)</h3>
          <p className="text-metal mb-4">
            Use the provider and components to add chat to your React app.
          </p>
          <CodeBlock
            code={`import { FormmyProvider, ChatBubble } from '@formmy.app/chat/react';

function App() {
  return (
    <FormmyProvider publishableKey="formmy_pk_live_xxx">
      <YourApp />
      <ChatBubble
        agentId="agent_xxx"
        position="bottom-right"
        theme="light"
      />
    </FormmyProvider>
  );
}`}
          />
        </section>

        {/* Headless Hook */}
        <section className="mb-12">
          <h3 className="text-lg font-semibold text-dark mb-3">Headless Hook</h3>
          <p className="text-metal mb-4">
            Build custom chat UIs with the <code className="bg-gray-100 px-1.5 py-0.5 rounded">useFormmyChat</code> hook.
          </p>
          <CodeBlock
            code={`import { useFormmyChat, getMessageText } from '@formmy.app/chat/react';

function CustomChat({ agentId }: { agentId: string }) {
  const {
    messages,
    sendMessage,
    status,
    reset,
  } = useFormmyChat({ agentId });

  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>
          <strong>{msg.role}:</strong> {getMessageText(msg)}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" disabled={status === 'streaming'}>
          Send
        </button>
      </form>
    </div>
  );
}`}
          />
        </section>

        {/* API Reference */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-dark mb-4 flex items-center gap-2">
            <span>📖</span> API Reference
          </h2>

          {/* Formmy Client */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-dark mb-3">Formmy Client</h3>
            <CodeBlock
              code={`const formmy = new Formmy({ secretKey: 'formmy_sk_live_xxx' });

// Agents
await formmy.agents.list()
await formmy.agents.get(agentId)
await formmy.agents.create({ name, instructions, welcomeMessage?, model? })
await formmy.agents.update(agentId, { name?, instructions?, model? })

// Chat
await formmy.chat.send({ agentId, message, conversationId? })`}
            />
          </div>

          {/* FormmyProvider */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-dark mb-3">FormmyProvider</h3>
            <CodeBlock
              code={`<FormmyProvider
  publishableKey="formmy_pk_live_xxx"  // required
  baseUrl="https://formmy.app"         // optional, defaults to formmy.app
>
  {children}
</FormmyProvider>`}
            />
          </div>

          {/* ChatBubble */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-dark mb-3">ChatBubble</h3>
            <CodeBlock
              code={`<ChatBubble
  agentId="agent_xxx"           // required
  position="bottom-right"       // bottom-right | bottom-left
  theme="light"                 // light | dark
  welcomeMessage="Hello!"       // optional override
/>`}
            />
          </div>

          {/* useFormmyChat */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-dark mb-3">useFormmyChat</h3>
            <CodeBlock
              code={`const {
  // State
  messages,      // UIMessage[]
  status,        // 'idle' | 'streaming' | 'error'
  error,         // Error | null
  sessionId,     // string

  // Actions
  sendMessage,   // (text: string) => Promise<void>
  reset,         // () => void - clears session
  stop,          // () => void - stops streaming
  setMessages,   // (messages: UIMessage[]) => void

  // Utility
  getMessageText, // (message) => string
} = useFormmyChat({
  agentId: string,       // required
  onError?: (error) => void,
  onFinish?: () => void,
});`}
            />
          </div>
        </section>

        {/* TypeScript */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-dark mb-4 flex items-center gap-2">
            <span>📘</span> TypeScript
          </h2>
          <p className="text-metal mb-4">Full TypeScript support included.</p>
          <CodeBlock
            code={`import type {
  FormmyConfig,
  CreateAgentInput,
  UpdateAgentInput,
  AgentResponse,
  AgentsListResponse,
  UseFormmyChatOptions,
} from '@formmy.app/chat';`}
          />
        </section>

        {/* Demo */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-dark mb-4 flex items-center gap-2">
            <span>🚀</span> Demo
          </h2>
          <p className="text-metal mb-4">
            Check out our complete working examples with both server and client implementations.
          </p>
          <a
            href="https://github.com/blissito/formmy-sdk-demo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            View Demo on GitHub
          </a>
        </section>

        {/* Support */}
        <section className="mb-12 p-6 bg-gradient-to-br from-brand-50 to-purple-50 rounded-xl border border-brand-200">
          <h2 className="text-xl font-bold text-dark mb-2">Need Help?</h2>
          <p className="text-metal mb-4">
            Have questions or need assistance? We're here to help.
          </p>
          <div className="flex gap-3 flex-wrap">
            <a
              href="mailto:hola@formmy.app"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-dark border border-outlines rounded-lg hover:border-brand-400 transition-colors text-sm font-medium"
            >
              📧 hola@formmy.app
            </a>
            <a
              href="https://wa.me/5217757609276"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              💬 WhatsApp
            </a>
          </div>
        </section>
      </div>

      <HomeFooter />
    </section>
  );
}
