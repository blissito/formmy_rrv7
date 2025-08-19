import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

export interface BlogPost {
  slug: string;
  title: string;
  excerpt?: string;
  date: string;
  tags?: string[];
  image?: string;
  author?: string;
  content: string;
  category?: string;
  highlight?: string;
}

// Directory where blog posts are stored
const BLOG_POSTS_DIR = path.join(process.cwd(), 'content', 'blog');

// Create blog directory if it doesn't exist
try {
  if (!fs.existsSync(BLOG_POSTS_DIR)) {
    fs.mkdirSync(BLOG_POSTS_DIR, { recursive: true });
  }
} catch (error) {
  console.warn('Unable to create blog directory:', error);
}

/**
 * Parse frontmatter from markdown content
 */
function parseFrontmatter(content: string): { frontmatter: Record<string, any>; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { frontmatter: {}, content };
  }
  
  const [, frontmatterString, markdownContent] = match;
  const frontmatter: Record<string, any> = {};
  
  // Simple YAML parsing for basic frontmatter
  const lines = frontmatterString.trim().split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    
    // Handle arrays (tags)
    if (value.startsWith('[') && value.endsWith(']')) {
      frontmatter[key] = value.slice(1, -1).split(',').map(item => item.trim().replace(/['"]/g, ''));
    } else {
      // Remove quotes from string values
      frontmatter[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }
  
  return { frontmatter, content: markdownContent };
}

/**
 * Read and parse a single blog post
 */
async function readBlogPost(filename: string): Promise<BlogPost | null> {
  try {
    const filePath = path.join(BLOG_POSTS_DIR, filename);
    const content = await readFile(filePath, 'utf-8');
    const { frontmatter, content: markdownContent } = parseFrontmatter(content);
    
    // Generate slug from filename (remove .md extension)
    const slug = filename.replace(/\.md$/, '');
    
    // Get file stats for default date
    const stats = await stat(filePath);
    const defaultDate = stats.mtime.toISOString().split('T')[0];
    
    return {
      slug,
      title: frontmatter.title || slug.replace(/-/g, ' '),
      excerpt: frontmatter.excerpt || frontmatter.description,
      date: frontmatter.date || defaultDate,
      tags: frontmatter.tags || [],
      image: frontmatter.image,
      author: frontmatter.author,
      content: markdownContent,
      category: frontmatter.category || 'blog',
      highlight: frontmatter.highlight,
    };
  } catch (error) {
    console.error(`Error reading blog post ${filename}:`, error);
    return null;
  }
}

/**
 * Get all blog posts
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const files = await readdir(BLOG_POSTS_DIR);
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    
    const posts: BlogPost[] = [];
    
    for (const file of markdownFiles) {
      const post = await readBlogPost(file);
      if (post) {
        posts.push(post);
      }
    }
    
    // Sort posts by date (newest first)
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return posts;
  } catch (error) {
    console.error('Error reading blog posts directory:', error);
    return [];
  }
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const filename = `${slug}.md`;
    return await readBlogPost(filename);
  } catch (error) {
    console.error(`Error reading blog post ${slug}:`, error);
    return null;
  }
}

/**
 * Create initial sample blog posts if directory is empty
 */
export async function createSamplePosts(): Promise<void> {
  try {
    const posts = await getBlogPosts();
    if (posts.length === 0) {
      const samplePost = `---
title: "Bienvenido al Blog de Formmy"
excerpt: "Descubre las últimas novedades, tutoriales y mejores prácticas para crear formularios inteligentes con AI."
date: "${new Date().toISOString().split('T')[0]}"
tags: ["anuncio", "formmy", "ai"]
author: "Equipo Formmy"
---

# ¡Bienvenido al Blog de Formmy! 🎉

Estamos emocionados de lanzar nuestro blog oficial donde compartiremos:

## ✨ Novedades de la plataforma
- Nuevas funcionalidades
- Actualizaciones del sistema
- Mejoras en la experiencia de usuario

## 📚 Tutoriales y guías
- Cómo crear formularios más efectivos
- Mejores prácticas de UX
- Integración con herramientas populares

## 🤖 AI y Automatización
- Casos de uso de Ghosty, nuestro asistente AI
- Automatizaciones inteligentes
- Análisis predictivo de datos

## 💡 Consejos y trucos
- Optimización de conversiones
- Estrategias de engagement
- Insights basados en datos

¡Mantente atento a nuestras próximas publicaciones!

---

*¿Tienes alguna pregunta o sugerencia? No dudes en contactarnos.*
`;

      const filePath = path.join(BLOG_POSTS_DIR, 'bienvenido-al-blog.md');
      await promisify(fs.writeFile)(filePath, samplePost);
      console.log('Sample blog post created');
    }
  } catch (error) {
    console.error('Error creating sample posts:', error);
  }
}