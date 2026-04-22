"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { BookListItem, HeroBookStack } from "@/components/book-card";
import { availableYears, yearlyBookLists, type Book } from "@/lib/books";

function Divider() {
  return <div className="mx-auto my-14 h-px w-20 bg-[#e4ddd5]" />;
}

export default function Page() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isYearMenuOpen, setIsYearMenuOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(availableYears[0] ?? "2026");
  const yearMenuRef = useRef<HTMLDivElement | null>(null);
  const activeList =
    yearlyBookLists[selectedYear] ??
    yearlyBookLists[availableYears[0] ?? "2026"];
  const activeBooks = activeList?.books ?? [];
  const booksWithQuotes = activeBooks.filter((book) => book.quote.trim().length > 0);
  const heroTheme = activeList.heroTitleLine2.replace(/^[-—–]+\s*/, "");
  const selectedIndex = selectedBook ? activeBooks.findIndex((book) => book.id === selectedBook.id) : -1;
  const prevSelectedBook =
    selectedIndex >= 0 ? activeBooks[(selectedIndex - 1 + activeBooks.length) % activeBooks.length] : null;
  const nextSelectedBook =
    selectedIndex >= 0 ? activeBooks[(selectedIndex + 1) % activeBooks.length] : null;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!yearMenuRef.current) {
        return;
      }

      if (!yearMenuRef.current.contains(event.target as Node)) {
        setIsYearMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsYearMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (selectedBook && !activeBooks.some((book) => book.id === selectedBook.id)) {
      setSelectedBook(null);
    }
  }, [activeBooks, selectedBook]);

  return (
    <LayoutGroup>
      <main className="min-h-screen bg-[#f8f5f1] px-9 py-6 text-[#28211b] sm:px-14 sm:py-8">
        <header className="flex items-start justify-between">
          <a
            href="https://www.volcanics.com/"
            target="_blank"
            rel="noreferrer"
            className="sticky top-6 block"
            aria-label="访问火山石投资官网"
          >
            <Image
              src="/volcanics-logo.png"
              alt="火山石投资"
              width={280}
              height={105}
              priority
              className="h-auto w-[168px] sm:w-[220px]"
            />
          </a>

          <div ref={yearMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsYearMenuOpen((open) => !open)}
              className="rounded-2xl bg-white/75 px-7 py-4 text-[15px] font-light leading-none text-[#5e574f] shadow-[0_4px_18px_rgba(0,0,0,0.04)] backdrop-blur-sm"
              aria-haspopup="menu"
              aria-expanded={isYearMenuOpen}
            >
              <span className="flex items-center gap-3">
                历年书单
                <span className="text-[#8a8178]">{selectedYear}</span>
                <span
                  className={[
                    "block text-xs transition-transform duration-200",
                    isYearMenuOpen ? "rotate-180" : "",
                  ].join(" ")}
                >
                  ▾
                </span>
              </span>
            </button>

            <AnimatePresence>
              {isYearMenuOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute right-0 mt-3 min-w-[10rem] overflow-hidden rounded-[18px] border border-black/5 bg-white/90 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.06)] backdrop-blur-md"
                >
                  {availableYears.map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => {
                        setSelectedYear(year);
                        setIsYearMenuOpen(false);
                      }}
                      className={[
                        "block w-full rounded-[14px] px-4 py-3 text-left text-[15px] font-light transition-colors",
                        selectedYear === year
                          ? "bg-[#f3eee8] text-[#2f2923]"
                          : "text-[#5e574f] hover:bg-[#f3eee8]",
                      ].join(" ")}
                      aria-current={selectedYear === year ? "true" : undefined}
                    >
                      {year}
                    </button>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </header>

        <section className="mx-auto max-w-[36rem] pb-10 pt-10 text-center sm:pt-12">
          <div className="mx-auto mb-7 h-px w-20 bg-[#e4ddd5]" />
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="mx-auto whitespace-nowrap font-serif text-[1.8rem] font-light leading-[1.08] tracking-[-0.03em] text-[#231d18] sm:text-[2.5rem]"
          >
            {activeList.year} · {heroTheme}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.08 }}
            className="mx-auto mt-5 max-w-[34rem] text-[1.1rem] font-light leading-[1.75] text-[#81766d]"
          >
            {activeList.heroLead.map((line, index) => (
              <span key={line} className={index === 0 ? "block" : "mt-2 block"}>
                {line}
              </span>
            ))}
          </motion.p>

          <HeroBookStack books={activeBooks} onSelect={setSelectedBook} />
        </section>

        <section className="mx-auto max-w-[38rem] pb-10 text-[16px] font-light leading-9 text-[#5f564d]">
          {activeList.introParagraphs.map((paragraph, index) => (
            <p key={paragraph} className={index === 0 ? "" : "mt-12"}>
              {paragraph}
            </p>
          ))}
          <Divider />

          <h2 className="text-[15px] font-light tracking-[-0.01em] text-[#2e2823]">
            Library
          </h2>
          <p className="mt-7">
            {activeList.libraryNote}
          </p>
          <Divider />

          <h2 className="text-[15px] font-light tracking-[-0.01em] text-[#2e2823]">Quotes</h2>
          <div className="mt-9 grid gap-7">
            {booksWithQuotes.map((book) => (
              <Link
                key={book.id}
                href={`/books/${book.id}`}
                className="block rounded-[20px] border border-black/5 bg-white/55 px-7 py-6 font-serif text-[16px] font-light leading-9 tracking-[-0.01em] text-[#2b231d] transition hover:-translate-y-1 hover:bg-white/70"
              >
                {book.quote}
              </Link>
            ))}
          </div>
        </section>

        <Divider />

        <section className="mx-auto max-w-[56rem] pb-32">
          <div className="mx-auto max-w-[38rem]">
            <h2 className="text-[15px] font-light tracking-[-0.01em] text-[#2e2823]">
              Annual Selection
            </h2>
            <p className="mt-7 text-[16px] font-light leading-9 text-[#5f564d]">
              {activeList.selectionHint}
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-[38rem] gap-7">
            {activeBooks.map((book, index) => (
              <BookListItem
                key={book.id}
                book={book}
                index={index}
                onSelect={setSelectedBook}
              />
            ))}
          </div>
        </section>

        <AnimatePresence>
          {selectedBook ? (
            <motion.div
              className="fixed inset-0 z-50 overflow-y-auto bg-[rgba(248,245,241,0.82)] p-4 backdrop-blur-md sm:p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBook(null)}
            >
              <motion.article
                layoutId={`card-${selectedBook.id}`}
                onClick={(event) => event.stopPropagation()}
                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                className="mx-auto my-8 w-full max-w-[58rem] overflow-hidden rounded-[28px] border border-black/5 bg-[#fbf8f4] shadow-[0_20px_80px_rgba(0,0,0,0.08)]"
              >
                <div className="grid md:grid-cols-[20rem_minmax(0,1fr)]">
                  <div className="border-b border-black/5 bg-[#f4ede5] p-6 md:border-b-0 md:border-r md:p-8">
                    <div className="md:sticky md:top-8">
                      <motion.div
                        layoutId={`cover-shell-${selectedBook.id}`}
                        className="relative aspect-[2/3] overflow-hidden rounded-[18px] border border-black/5"
                      >
                        <Image
                          src={selectedBook.cover_url}
                          alt={selectedBook.title}
                          fill
                          sizes="(max-width: 768px) 80vw, 320px"
                          unoptimized
                          className="object-cover"
                        />
                      </motion.div>

                      <div className="mt-5 rounded-[18px] border border-black/5 bg-white/55 px-5 py-5">
                        <p className="font-serif text-[1.45rem] font-light leading-[1.15] tracking-[-0.03em] text-[#211b16]">
                          {selectedBook.title}
                        </p>
                        <p className="mt-3 text-sm font-light leading-7 text-[#6a6159]">
                          作者：{selectedBook.author || "作者信息待补充"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[min(88vh,980px)] overflow-y-auto p-8 sm:p-10 lg:p-12">
                    <div className="flex items-start justify-between gap-6">
                      <div className="min-w-0 flex-1">
                        <motion.h2
                          layoutId={`title-${selectedBook.id}`}
                          className="max-w-[16ch] font-serif text-[2.05rem] font-light leading-[1.02] tracking-[-0.045em] text-[#211b16] sm:text-[2.35rem] lg:text-[2.65rem]"
                        >
                          {selectedBook.title}
                        </motion.h2>
                        <p className="mt-5 text-sm font-light leading-8 text-[#71675e]">
                          推荐人：{selectedBook.recommender}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedBook(null)}
                          className="rounded-2xl bg-white px-6 py-3 text-sm font-light text-[#6a6159] shadow-[0_4px_14px_rgba(0,0,0,0.04)]"
                        >
                          Close
                        </button>
                      </div>
                    </div>

                    <div className="mt-10 space-y-9">
                      <section>
                        <p className="text-[11px] uppercase tracking-[0.28em] text-[#9b8f84]">
                          Quote
                        </p>
                        <blockquote className="mt-4 font-serif text-[1.7rem] font-light leading-[1.45] tracking-[-0.03em] text-[#2a241d]">
                          {selectedBook.quote}
                        </blockquote>
                      </section>

                      <section>
                        <p className="text-[11px] uppercase tracking-[0.28em] text-[#9b8f84]">
                          Recommendation
                        </p>
                        <p className="mt-4 whitespace-pre-line text-[15px] font-light leading-9 text-[#5f564d]">
                          {selectedBook.recommendation}
                        </p>
                      </section>
                    </div>

                    {prevSelectedBook && nextSelectedBook ? (
                      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-6">
                        <button
                          type="button"
                          onClick={() => setSelectedBook(prevSelectedBook)}
                          className="rounded-2xl bg-white px-4 py-2.5 text-sm font-light text-[#6a6159] shadow-[0_4px_14px_rgba(0,0,0,0.04)]"
                        >
                          ← 上一本：{prevSelectedBook.title}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedBook(nextSelectedBook)}
                          className="rounded-2xl bg-white px-4 py-2.5 text-sm font-light text-[#6a6159] shadow-[0_4px_14px_rgba(0,0,0,0.04)]"
                        >
                          下一本：{nextSelectedBook.title} →
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </motion.article>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </LayoutGroup>
  );
}
