import { getPostData, getSortedPostsData } from '@/lib/blog';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from "@/components/Navbar";

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
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="py-24 max-w-3xl mx-auto px-4">
        <div className="flex gap-4 mb-8">
          <Link href="/" className="text-slate-800 hover:underline font-medium">
            &larr; Back to Home
          </Link>
          <Link href="/blog" className="text-slate-500 hover:text-slate-800 hover:underline font-medium">
            Blog Index
          </Link>
        </div>
        
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
