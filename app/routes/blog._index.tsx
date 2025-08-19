import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FaArrowRight } from 'react-icons/fa';
import type { MetaFunction, LoaderFunctionArgs } from 'react-router';
import { useLoaderData, Link } from 'react-router';
import { getBlogPosts, type BlogPost } from 'server/blog.server';
import { cn } from '~/lib/utils';
import HomeHeader from '~/routes/home/HomeHeader';
import HomeFooter from './home/HomeFooter';
import { motion, type Variants } from 'framer-motion';

// Componente para las etiquetas de los posts
const BlogTag = ({ tag }: { tag: string }) => {
  const formattedTag = tag ? tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase() : '';
  return (
    <span className="bg-white/10 text-white px-3 py-2 rounded-full text-xs">
      {formattedTag}
    </span>
  );
};

// Animation variants for the cards
const cardVariants: Variants = {
  offscreen: {
    y: 50,
    opacity: 0,
    transition: {
      type: "tween",
      duration: 0.3
    }
  },
  onscreen: {
    y: 0,
    opacity: 1,
    transition: {
      type: "tween",
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

// Componente para la tarjeta de blog básica
const BlogCardBasic = ({ 
  image, 
  title, 
  excerpt, 
  className = '', 
  slug, 
  tags = [], 
  index = 0 
}: { 
  image?: string; 
  title: string; 
  excerpt?: string; 
  className?: string; 
  slug: string;
  tags?: string[];
  index?: number;
}) => (
  <motion.div
    initial="offscreen"
    whileInView="onscreen"
    viewport={{ once: true, amount: 0.2 }}
    variants={cardVariants}
    transition={{ delay: index * 0.1 }}
    className={cn('w-full h-full col-span-1 md:col-span-2 rounded-3xl overflow-hidden ', className)}
  >
    <Link to={`/blog/${slug}`} className="block h-full">
      <div className="h-full min-h-[400px] relative group">
        <motion.img 
          className='w-full h-full object-cover group-hover:scale-110 transition-all' 
          src={image} 
          alt={title}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        />
        <span className="absolute top-6 left-6 text-white z-20 flex gap-2 items-center">
          <div className="w-2 h-2 bg-white rounded-full"></div> Artículo
        </span>
        <div className='w-full h-full absolute top-0 left-0 flex flex-col justify-end z-10 items-start p-6 bg-black/50'>
          <h2 className='text-white text-4xl mb-8'>{title}</h2>
          <div className="flex justify-between w-full items-center gap-2 h-10">
            <div className="flex gap-2 flex-wrap">
              {tags && tags.slice(0, 3).map((tag, index) => (
                <BlogTag key={index} tag={tag} />
              ))}
            </div>
            <motion.div 
              className="w-10 h-10 grid place-items-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className='w-10 h-10 group-hover:w-9 group-hover:h-9 transition-all flex items-center justify-center rounded-full bg-white text-brand-500'>
                <FaArrowRight />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
);

// Componente para la tarjeta de blog sólida
const BlogCardSolid = ({ 
  image, 
  title, 
  excerpt, 
  slug, 
  variant = 'useCase',
  tags = [],
  index = 0,
  className = ''
}: { 
  image: string; 
  title: string; 
  excerpt?: string; 
  slug: string; 
  variant?: 'useCase' | 'tutorial';
  tags?: string[];
  index?: number;
  className?: string;
}) => (
  <motion.div
    initial="offscreen"
    whileInView="onscreen"
    viewport={{ once: true, amount: 0.2 }}
    variants={cardVariants}
    transition={{ delay: index * 0.1 }}
    className={cn(
      'w-full h-full col-span-1 md:col-span-2 rounded-3xl overflow-hidden ',
      variant === 'useCase' ? 'bg-dark' : 'bg-brand-500',
      className
    )}
  >
    <Link to={`/blog/${slug}`} className="block h-full">
      <div className="rounded-3xl overflow-hidden h-full min-h-[400px] relative group">
        <span className="absolute top-6 left-6 text-white z-20 flex gap-2 items-center">
          <div className="w-2 h-2 bg-white rounded-full"></div> {variant === 'useCase' ? 'Caso de Uso' : 'Tutorial'}
        </span>
        <div className='w-full h-full absolute top-0 left-0 flex flex-col justify-end z-10 items-start p-6 '>
          <h2 className='text-white text-4xl mb-8'>{title}</h2>
          <div className="flex justify-between w-full items-center gap-2 h-10">
            <div className="flex gap-2 flex-wrap">
              {tags && tags.slice(0, 3).map((tag, index) => (
                <BlogTag key={index} tag={tag} />
              ))}
            </div>
            <motion.div 
              className="w-10 h-10 grid place-items-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className='w-10 h-10 group-hover:w-9 group-hover:h-9 transition-all flex items-center justify-center rounded-full bg-white text-brand-500'>
                <FaArrowRight />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
);

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

type FilterType = 'todos' | 'ai' | 'tutoriales' | 'noticias' | 'casos-uso' | 'articulos';

export default function BlogIndex() {
  const { posts } = useLoaderData<{ posts: BlogPost[] }>();
  const [showOverlay, setShowOverlay] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('todos');
  const lastScrollY = useRef(0);
  const viewportTrigger = useRef(0);
  
  const filteredPosts = React.useMemo(() => {
    // Filter out posts with highlight property
    const regularPosts = posts.filter(post => !post.highlight);
    
    if (activeFilter === 'todos') return regularPosts;
    if (activeFilter === 'casos-uso') {
      return regularPosts.filter(post => post.category === 'useCase');
    }
    if (activeFilter === 'articulos') {
      return regularPosts.filter(post => post.category === 'article');
    }
    if (activeFilter === 'tutoriales') {
      return regularPosts.filter(post => post.category === 'tutorial');
    }
    return regularPosts.filter(post => 
      post.tags?.some(tag => tag && tag.toLowerCase() === activeFilter.toLowerCase())
    );
  }, [posts, activeFilter]);
  
  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(filter);
    // Scroll suave a la sección de posts
    document.getElementById('posts')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    viewportTrigger.current = window.innerHeight / 3; // 1/3 del viewport
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      const scrollingDown = currentScroll > lastScrollY.current;
      
      if (scrollingDown && currentScroll > viewportTrigger.current) {
        // Al bajar, mostrar overlay después de 1/3 del viewport
        setShowOverlay(true);
      } else if (!scrollingDown && currentScroll < viewportTrigger.current) {
        // Al subir, ocultar antes de llegar a 1/3 del viewport
        setShowOverlay(false);
      }
      
      lastScrollY.current = currentScroll;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {!showOverlay && <HomeHeader />}
      <div 
        className={`sticky -top-96 w-full  transition-all duration-300 ${
          showOverlay ? 'bg-black/40' : 'bg-transparent'
        }`}
      >
        <div className="pt-40 md:pt-64 pb-16 max-w-7xl mx-auto ">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-gray-900 mb-4">Blog</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tips, noticias, tutoriales y casos de uso de formularios inteligentes y chatbots IA.
          </p>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {posts.find(post => post.highlight === 'main') ? (
            (() => {
              const highlightedPost = posts.find(post => post.highlight === 'main')!;
              return (
                <BlogCardBasic  
                  className='col-span-1 md:col-span-3'
                  image={highlightedPost.image} 
                  title={highlightedPost.title}
                  excerpt={highlightedPost.excerpt || ""}
                  slug={highlightedPost.slug}
                  tags={highlightedPost.tags}
                />
              );
            })()
          ) : (
            <BlogCardBasic  
              className='col-span-1 md:col-span-3'
              image="https://images.pexels.com/photos/17514176/pexels-photo-17514176.jpeg" 
              title="Lanzamiento de Formmy"
              excerpt="Descubre cómo Formmy puede revolucionar la forma en que manejas los formularios en tu negocio con nuestra plataforma todo en uno."
              slug="lanzamiento-de-formmy"
              tags={["IA", "Lanzamiento", "Nuevo"]}
            />
          )}
{posts.find(post => post.highlight === 'secondary') ? (
            (() => {
              const secondaryPost = posts.find(post => post.highlight === 'secondary')!;
              return (
                <BlogCardSolid  
                  key={secondaryPost.slug}
                  image={secondaryPost.image || "/blogposts/placeholder.webp"} 
                  title={secondaryPost.title}
                  excerpt={secondaryPost.excerpt || ""}
                  slug={secondaryPost.slug}
                  tags={secondaryPost.tags || []}
                  variant={secondaryPost.category === 'tutorial' ? 'tutorial' : 'useCase'}
                />
              );
            })()
          ) : (
            <BlogCardSolid  
              image="https://images.pexels.com/photos/17514176/pexels-photo-17514176.jpeg" 
              title="Lanzamiento de Formmy"
              excerpt="Descubre cómo Formmy puede revolucionar la forma en que manejas los formularios en tu negocio con nuestra plataforma todo en uno."
              slug="lanzamiento-de-formmy-caso-uso"
              tags={["IA", "Lanzamiento", "Nuevo"]}
            />
          )}
        </div>
        </div>
        </div>
      </div>
      
      {/* Posts List */}
      <div className="relative bg-white pb-20 md:pb-40">
        <div className="sticky top-0 z-50 bg-white border-b border-outlines ">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div id="filters" className="flex flex-wrap gap-3  py-8 justify-center">
              <button 
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  activeFilter === 'todos' 
                    ? 'bg-dark text-white hover:bg-brand-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleFilterClick('todos')}
              >
                Todos
              </button>
          
              <button 
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  activeFilter === 'tutoriales' 
                    ? 'bg-dark text-white hover:bg-brand-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleFilterClick('tutoriales')}
              >
                Tutoriales
              </button>
              <button 
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  activeFilter === 'casos-uso' 
                    ? 'bg-dark text-white hover:bg-brand-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleFilterClick('casos-uso')}
              >
                Casos de Uso
              </button>
              <button 
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  activeFilter === 'noticias' 
                    ? 'bg-dark text-white hover:bg-brand-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleFilterClick('noticias')}
              >
                Noticias
              </button>
              <button 
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  activeFilter === 'articulos' 
                    ? 'bg-dark text-white hover:bg-brand-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleFilterClick('articulos')}
              >
                Artículos
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="posts">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No hay artículos aún</h2>
              <p className="text-gray-600">Próximamente publicaremos contenido interesante.</p>
            </div>
          ) : (
            <div className="grid gap-y-6 gap-x-0 md:gap-8 grid-cols-1 md:grid-cols-6">
              {filteredPosts.map((post) => {
                const isUseCase = post.category === 'useCase';
                const isTutorial = post.category === 'tutorial';
                
                if (isUseCase || isTutorial) {
                  return (
                    <BlogCardSolid
                      key={post.slug}
                      image={post.image || '/default-blog-image.jpg'}
                      title={post.title}
                      excerpt={post.excerpt}
                      slug={post.slug}
                      variant={isTutorial ? 'tutorial' : 'useCase'}
                      tags={post.tags}
                    />
                  );
                }
                
                return (
                  <BlogCardBasic
                    className="col-span-2"
                    key={post.slug}
                    image={post.image || '/default-blog-image.jpg'}
                    title={post.title}
                    excerpt={post.excerpt}
                    slug={post.slug}
                    tags={post.tags}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="relative z-10">
        <HomeFooter />
      </div>
    </div>
  );
}