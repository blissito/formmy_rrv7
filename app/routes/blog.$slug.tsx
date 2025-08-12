import type { MetaFunction, LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { getBlogPost, type BlogPost } from 'server/blog.server';
import { BlogMarkdown } from '~/components/blog/BlogMarkdown';
import invariant from 'tiny-invariant';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.post) {
    return [
      { title: 'Artículo no encontrado | Formmy' },
      { name: 'description', content: 'El artículo que buscas no existe.' },
    ];
  }

  return [
    { title: `${data.post.title} | Formmy Blog` },
    { name: 'description', content: data.post.excerpt || `Lee el artículo completo: ${data.post.title}` },
    { property: 'og:title', content: `${data.post.title} | Formmy Blog` },
    { property: 'og:description', content: data.post.excerpt || `Lee el artículo completo: ${data.post.title}` },
    { property: 'og:type', content: 'article' },
    ...(data.post.image ? [{ property: 'og:image', content: data.post.image }] : []),
  ];
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  invariant(params.slug, 'slug is required');
  
  const post = await getBlogPost(params.slug);
  
  if (!post) {
    throw new Response('Not Found', { status: 404 });
  }

  return { post };
};

export default function BlogPost() {
  const { post } = useLoaderData<{ post: BlogPost }>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link to="/blog" className="inline-flex items-center text-brand-600 hover:text-brand-700 mb-6">
            ← Volver al blog
          </Link>
          
          {post.image && (
            <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-8">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
              {post.tags && post.tags.length > 0 && (
                <>
                  <span>•</span>
                  <div className="flex gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-xl text-gray-600 leading-relaxed">
                {post.excerpt}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <article className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <BlogMarkdown content={post.content} />
        </article>

        {/* Navigation */}
        <div className="mt-12 flex justify-center">
          <Link
            to="/blog"
            className="inline-flex items-center px-6 py-3 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            Ver más artículos
          </Link>
        </div>
      </div>
    </div>
  );
}