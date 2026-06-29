import { getPostData, getSortedPostsData } from '@/lib/blog';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateStaticParams() {
  const posts = await getSortedPostsData();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const postData = await getPostData(slug);
    return {
      title: `${postData.title} | Hirecue`,
      description: postData.description,
    };
  } catch (e) {
    return {
      title: 'Post Not Found | Hirecue'
    };
  }
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let postData;
  try {
    postData = await getPostData(slug);
  } catch (error) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 py-24">
      <div className="max-w-3xl mx-auto px-4">
        <Link href="/blog" className="text-slate-800 hover:underline mb-8 inline-block font-medium">
          &larr; Back to Blog
        </Link>
        
        <article className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200">
          <header className="mb-10 text-center">
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
              {postData.title}
            </h1>
            <div className="text-slate-600 font-medium">
              {new Date(postData.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </header>
          
          {/* We use prose-invert to ensure the text is light on the dark background */}
          <div 
            className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-a:text-slate-800 hover:prose-a:text-slate-700"
            dangerouslySetInnerHTML={{ __html: postData.contentHtml }} 
          />
        </article>
      </div>
    </div>
  );
}
