import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getBookById, getBooksByYear } from "@/lib/books";

type BookPageProps = {
  params: {
    id: string;
  };
};

export default function BookPage({ params }: BookPageProps) {
  const book = getBookById(params.id);
  if (!book) {
    notFound();
  }

  const currentYearBooks = getBooksByYear(book.year);
  const currentIndex = currentYearBooks.findIndex((item) => item.id === book.id);
  const prevBook = currentYearBooks[(currentIndex - 1 + currentYearBooks.length) % currentYearBooks.length];
  const nextBook = currentYearBooks[(currentIndex + 1) % currentYearBooks.length];

  return (
    <main className="min-h-screen bg-[#f8f5f1] px-6 py-8 text-[#28211b] sm:px-12 sm:py-10">
      <div className="mx-auto max-w-[58rem]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-2xl bg-white/75 px-5 py-2.5 text-sm font-light text-[#5e574f] shadow-[0_4px_14px_rgba(0,0,0,0.04)] transition hover:bg-white"
          >
            ← 返回书单首页
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href={`/books/${prevBook.id}`}
              className="rounded-2xl bg-white/75 px-4 py-2.5 text-sm font-light text-[#5e574f] shadow-[0_4px_14px_rgba(0,0,0,0.04)] transition hover:bg-white"
            >
              上一本
            </Link>
            <Link
              href={`/books/${nextBook.id}`}
              className="rounded-2xl bg-white/75 px-4 py-2.5 text-sm font-light text-[#5e574f] shadow-[0_4px_14px_rgba(0,0,0,0.04)] transition hover:bg-white"
            >
              下一本
            </Link>
          </div>
        </div>

        <article className="mt-6 overflow-hidden rounded-[28px] border border-black/5 bg-[#fbf8f4] shadow-[0_20px_80px_rgba(0,0,0,0.08)]">
          <div className="grid md:grid-cols-[20rem_minmax(0,1fr)]">
            <div className="border-b border-black/5 bg-[#f4ede5] p-6 md:border-b-0 md:border-r md:p-8">
              <div className="relative mx-auto aspect-[2/3] w-full max-w-[17rem] overflow-hidden rounded-[18px] border border-black/5">
                <Image
                  src={book.cover_url}
                  alt={book.title}
                  fill
                  sizes="(max-width: 768px) 80vw, 320px"
                  unoptimized
                  className="object-cover"
                />
              </div>

              <div className="mt-5 rounded-[18px] border border-black/5 bg-white/55 px-5 py-5">
                <p className="font-serif text-[1.45rem] font-light leading-[1.15] tracking-[-0.03em] text-[#211b16]">
                  {book.title}
                </p>
                <p className="mt-3 text-sm font-light leading-7 text-[#6a6159]">
                  作者：{book.author || "作者信息待补充"}
                </p>
                <p className="mt-2 text-sm font-light leading-7 text-[#6a6159]">
                  推荐人：{book.recommender}
                </p>
              </div>
            </div>

            <div className="p-8 sm:p-10 lg:p-12">
              <h1 className="max-w-[16ch] font-serif text-[2.05rem] font-light leading-[1.02] tracking-[-0.045em] text-[#211b16] sm:text-[2.35rem] lg:text-[2.65rem]">
                {book.title}
              </h1>

              <div className="mt-10 space-y-9">
                <section>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#9b8f84]">Quote</p>
                  <blockquote className="mt-4 font-serif text-[1.7rem] font-light leading-[1.45] tracking-[-0.03em] text-[#2a241d]">
                    {book.quote}
                  </blockquote>
                </section>

                <section>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#9b8f84]">
                    Recommendation
                  </p>
                  <p className="mt-4 whitespace-pre-line text-[15px] font-light leading-9 text-[#5f564d]">
                    {book.recommendation}
                  </p>
                </section>
              </div>

              <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-6">
                <Link
                  href={`/books/${prevBook.id}`}
                  className="inline-flex items-center rounded-2xl bg-white/75 px-4 py-2.5 text-sm font-light text-[#5e574f] shadow-[0_4px_14px_rgba(0,0,0,0.04)] transition hover:bg-white"
                >
                  ← 上一本：{prevBook.title}
                </Link>
                <Link
                  href={`/books/${nextBook.id}`}
                  className="inline-flex items-center rounded-2xl bg-white/75 px-4 py-2.5 text-sm font-light text-[#5e574f] shadow-[0_4px_14px_rgba(0,0,0,0.04)] transition hover:bg-white"
                >
                  下一本：{nextBook.title} →
                </Link>
              </div>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
