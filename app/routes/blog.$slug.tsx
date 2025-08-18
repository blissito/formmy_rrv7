import type { MetaFunction, LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { getBlogPost, type BlogPost } from 'server/blog.server';
import { BlogMarkdown } from '~/components/blog/BlogMarkdown';
import invariant from 'tiny-invariant';
import HomeFooter from './home/HomeFooter';

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

  // Calculate reading time (assuming 200 words per minute)
  const wordCount = post.content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div className="min-h-screen bg-white">
      {/* Back button */}
      <div className="bg-white o sticky top-0 z-50 h-16  ">
        <div className="max-w-5xl mx-auto  flex justify-start items-center h-full px-4 md:px-[5%] xl:px-0"> 
          <Link 
            to="/blog" 
            className="grid place-items-center text-metal  transition-colors text-sm font-medium"
          >
            <div className="px-4 h-10 rounded-xl  w-fit border border-outlines hover:bg-brand-100 flex gap-1 items-center">

            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
            </div>
          </Link>
        
        </div>
      </div>

      {/* Header */}
      <div>
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
          <div className="max-w-3xl mx-auto text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-dark  mb-6 leading-tight">
              {post.title}
            </h1>
            <div className="inline-flex items-center gap-2 mb-6">
              {post.tags && post.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="bg-outlines/30 text-metal px-3 py-1 rounded-full text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
              <span className="text-sm text-gray-500">•</span>
              <time 
                dateTime={post.date} 
                className="text-sm text-gray-500"
              >
                {new Date(post.date).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-500">
                {readingTime} min de lectura
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {post.image && (
        <div className="max-w-5xl mx-auto px-4 -mt-12 mb-12 ">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img
              src={post.image}
              alt={post.title}
              className="w-full max-h-[500px] object-cover"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <article className="prose prose-lg max-w-none">
          <BlogMarkdown content={post.content} />
        </article>
      </div>
      <HomeFooter />
    </div>
  );
}