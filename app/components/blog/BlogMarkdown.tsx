import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '~/lib/utils';

interface BlogMarkdownProps {
  content: string;
  className?: string;
}

export const BlogMarkdown = ({ content, className }: BlogMarkdownProps) => {
  return (
    <div className={cn(
      "prose prose-lg max-w-none",
      "prose-headings:text-gray-900 prose-headings:font-bold",
      "prose-h1:text-3xl prose-h1:mb-6 prose-h1:leading-tight",
      "prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:leading-tight",
      "prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-6 prose-h3:leading-tight",
      "prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4",
      "prose-a:text-brand-600 prose-a:hover:text-brand-700 prose-a:underline prose-a:transition-colors",
      "prose-strong:text-gray-900 prose-strong:font-semibold",
      "prose-em:text-gray-700 prose-em:italic",
      "prose-code:text-brand-600 prose-code:bg-brand-50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono",
      "prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:border",
      "prose-blockquote:border-l-4 prose-blockquote:border-brand-500 prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:bg-brand-50/50 prose-blockquote:text-gray-700 prose-blockquote:italic",
      "prose-ul:pl-6 prose-ol:pl-6 prose-li:mb-1 prose-li:text-gray-700",
      "prose-table:border-collapse prose-table:border prose-table:border-gray-200 prose-table:w-full prose-table:my-6",
      "prose-th:border prose-th:border-gray-200 prose-th:bg-gray-50 prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-semibold prose-th:text-gray-900",
      "prose-td:border prose-td:border-gray-200 prose-td:px-4 prose-td:py-3 prose-td:text-gray-700",
      "prose-hr:border-gray-200 prose-hr:my-8",
      "prose-img:rounded-lg prose-img:shadow-sm prose-img:border prose-img:border-gray-200",
      className
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom heading renderer with anchor links
          h1: ({ children, ...props }) => (
            <h1 {...props} className="group relative">
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 {...props} className="group relative">
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 {...props} className="group relative">
              {children}
            </h3>
          ),
          
          // Enhanced code blocks
          code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !className?.includes('language-');
            
            if (!isInline && match) {
              const language = match[1];
              return (
                <div className="relative group">
                  <div className="flex items-center justify-between bg-gray-800 text-gray-200 px-4 py-2 rounded-t-lg text-sm">
                    <span className="font-mono">{language}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(String(children))}
                      className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
                    >
                      Copiar
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto border-t-0">
                    <code className={className} {...props}>
                      {String(children).replace(/\n$/, '')}
                    </code>
                  </pre>
                </div>
              );
            }
            
            return (
              <code 
                className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded text-sm font-mono" 
                {...props}
              >
                {children}
              </code>
            );
          },
          
          // Enhanced links - open external links in new tab
          a: ({ href, children, ...props }) => {
            const isExternal = href && (href.startsWith('http') || href.startsWith('https'));
            return (
              <a
                href={href}
                {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="text-brand-600 hover:text-brand-700 underline transition-colors"
                {...props}
              >
                {children}
                {isExternal && (
                  <svg className="inline w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                  </svg>
                )}
              </a>
            );
          },
          
          // Enhanced tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full border-collapse border border-gray-200 rounded-lg">
                {children}
              </table>
            </div>
          ),
          
          // Enhanced images
          img: ({ src, alt, ...props }) => (
            <div className="my-8">
              <img
                src={src}
                alt={alt}
                className="w-full h-auto rounded-lg shadow-sm border border-gray-200"
                loading="lazy"
                {...props}
              />
              {alt && (
                <p className="text-center text-sm text-gray-500 mt-2 italic">
                  {alt}
                </p>
              )}
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};