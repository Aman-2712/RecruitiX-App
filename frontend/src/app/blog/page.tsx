import Link from 'next/link';
import { getSortedPostsData } from '@/lib/blog';
import Navbar from "@/components/Navbar";

export const metadata = {
  title: 'Blog | Hirecue',
  description: 'Read the latest insights on AI, recruitment, and software engineering.',
};

export default async function BlogIndex() {
  const allPostsData = await getSortedPostsData();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="py-16 md:py-24 max-w-4xl mx-auto px-4">
        <Link href="/" className="text-slate-800 hover:underline mb-8 inline-block font-medium">
          &larr; Back to Home
        </Link>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-8">The Hirecue Blog</h1>
        <p className="text-xl text-slate-600 mb-12">
          Insights and guides on how AI is transforming recruitment and software engineering.
        </p>

        <div className="space-y-8">
          {allPostsData.map(({ slug, title, date, description }) => (
            <div key={slug} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <Link href={`/blog/${slug}`} className="block group">
                <h2 className="text-2xl font-bold text-slate-900 group-hover:text-slate-800 transition-colors mb-2">
                  {title}
                </h2>
                <div className="text-sm text-slate-600 mb-4">{new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                <p className="text-slate-700 leading-relaxed">
                  {description}
                </p>
                <div className="mt-4 text-slate-800 font-semibold group-hover:underline">
                  Read article &rarr;
                </div>
              </Link>
            </div>
          ))}
          
          {allPostsData.length === 0 && (
            <div className="text-slate-500 italic">No blog posts published yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
