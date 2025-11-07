import { getBlogPosts } from '../server/blog.server';

async function main() {
  const posts = await getBlogPosts();
  console.log('Total posts:', posts.length);
  posts.forEach(p => console.log(`- ${p.slug} (${p.date}) - ${p.title}`));
}

main().catch(console.error);
