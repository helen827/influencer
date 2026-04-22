"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import type { Book } from "@/lib/books";

type HeroBookStackProps = {
  books: Book[];
  onSelect: (book: Book) => void;
};

const heroOffsets = [
  { x: "-28.6rem", y: "1.6rem", rotate: -8.2, z: 15, scale: 0.965 },
  { x: "-22.1rem", y: "1.15rem", rotate: -3.6, z: 18, scale: 0.98 },
  { x: "-15.4rem", y: "1.85rem", rotate: 2.4, z: 16, scale: 0.97 },
  { x: "-8.9rem", y: "1.3rem", rotate: -4.7, z: 20, scale: 0.99 },
  { x: "-3.2rem", y: "1.75rem", rotate: 1.8, z: 17, scale: 0.98 },
  { x: "3.2rem", y: "1.2rem", rotate: -1.6, z: 19, scale: 0.97 },
  { x: "9.1rem", y: "1.95rem", rotate: 4.1, z: 18, scale: 0.99 },
  { x: "15.8rem", y: "1.4rem", rotate: -2.8, z: 16, scale: 0.97 },
  { x: "22.2rem", y: "1.8rem", rotate: 5.9, z: 17, scale: 0.98 },
  { x: "28.5rem", y: "1.25rem", rotate: 2.2, z: 15, scale: 0.965 },
] as const;

export function HeroBookStack({ books, onSelect }: HeroBookStackProps) {
  const featured = books.slice(0, 10);
  const centerPriorityTitles = ["理性的疯狂梦", "科技共和国"];

  const centerPriorityBooks = centerPriorityTitles
    .map((title) => featured.find((book) => book.title === title))
    .filter((book): book is Book => Boolean(book));

  const remainingBooks = featured.filter(
    (book) => !centerPriorityTitles.includes(book.title)
  );

  const middleIndex = Math.floor(remainingBooks.length / 2);
  const orderedFeatured = [
    ...remainingBooks.slice(0, middleIndex),
    ...centerPriorityBooks,
    ...remainingBooks.slice(middleIndex),
  ];

  return (
    <div className="relative mx-auto mt-8 h-[16rem] w-full max-w-[72rem] overflow-visible sm:mt-10 sm:h-[20rem]">
      {orderedFeatured.map((book, index) => {
        const placement = heroOffsets[index % heroOffsets.length];

        return (
          <motion.button
            key={book.id}
            type="button"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.12,
              ease: "easeOut",
            }}
            whileHover={{
              y: -18,
              scale: (placement.scale ?? 1) * 1.04,
              zIndex: 60,
              transition: { duration: 0.12, ease: "easeOut" },
            }}
            whileTap={{
              scale: 0.985,
              transition: { duration: 0.08, ease: "easeOut" },
            }}
            onClick={() => onSelect(book)}
            className="group absolute left-1/2 top-0 aspect-[0.66] w-[6.15rem] -translate-x-1/2 overflow-hidden rounded-[18px] bg-[#f4ede5] text-left shadow-[0_10px_24px_rgba(0,0,0,0.09)] sm:w-[7rem] lg:w-[7.35rem]"
            style={{
              zIndex: placement.z,
              left: `calc(50% + ${placement.x})`,
              top: placement.y,
              rotate: `${placement.rotate}deg`,
              scale: placement.scale ?? 1,
              transformOrigin: "center bottom",
            }}
          >
            <div className="absolute inset-0">
              <Image
                src={book.cover_url}
                alt={book.title}
                fill
                sizes="(max-width: 640px) 154px, 180px"
                unoptimized
                className="object-cover"
              />
            </div>

            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0)_38%,rgba(0,0,0,0.16)_100%)]" />
            <div className="pointer-events-none absolute inset-0 rounded-[20px]" />
          </motion.button>
        );
      })}
    </div>
  );
}

type BookListItemProps = {
  book: Book;
  index: number;
  onSelect: (book: Book) => void;
};

export function BookListItem({ book, index, onSelect }: BookListItemProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        type: "spring",
        damping: 20,
        stiffness: 100,
        delay: index * 0.06,
      }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.995 }}
      onClick={() => onSelect(book)}
      className="group grid w-full gap-6 rounded-[22px] border border-black/5 bg-white/55 p-[1.125rem] text-left backdrop-blur-sm transition-colors hover:bg-white/70 sm:grid-cols-[72px_minmax(0,1fr)] sm:items-start sm:p-5"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-[14px] border border-black/5 bg-[#f4efe8]">
        <Image
          src={book.cover_url}
          alt={book.title}
          fill
          sizes="72px"
          unoptimized
          className="object-cover transition duration-500 group-hover:scale-[1.02]"
        />
      </div>

      <div className="min-w-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <h3 className="font-serif text-[1.45rem] font-light leading-none tracking-[-0.03em] text-[#23201c]">
            {book.title}
          </h3>
          <p className="text-xs font-light leading-5 text-[#7b7168]">{book.recommender}</p>
        </div>
        <p className="mt-4 line-clamp-3 text-[15px] font-light leading-8 text-[#655d56]">
          {book.quote}
        </p>
      </div>
    </motion.button>
  );
}
