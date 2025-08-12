import type { MetaFunction, LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { getBlogPosts, type BlogPost } from 'server/blog.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'Blog | Formmy' },
    { name: 'description', content: 'Últimas noticias, tutoriales y artículos sobre formularios inteligentes y automatización con AI.' },
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const posts = await getBlogPosts();
  return { posts };
};

export default function BlogIndex() {
  const { posts } = useLoaderData<{ posts: BlogPost[] }>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link to="/" className="inline-flex items-center text-brand-600 hover:text-brand-700 mb-4">
            ← Volver a inicio
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Blog</h1>
          <p className="text-xl text-gray-600">
            Últimas noticias, tutoriales y artículos sobre formularios inteligentes
          </p>
        </div>
      </div>

      {/* Posts List */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No hay artículos aún</h2>
            <p className="text-gray-600">Próximamente publicaremos contenido interesante.</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
              >
                {post.image && (
                  <div className="aspect-video bg-gray-100">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-3 hover:text-brand-600 transition-colors">
                    <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  {post.excerpt && (
                    <p className="text-gray-600 mb-4 leading-relaxed">{post.excerpt}</p>
                  )}
                  <Link
                    to={`/blog/${post.slug}`}
                    className="inline-flex items-center text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Leer artículo
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}