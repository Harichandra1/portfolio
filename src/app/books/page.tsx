import { shelves, bookCount } from "@content/data/books";
import { buildMetadata } from "@/lib/seo";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/sections/page-header";
import { SectionHeading } from "@/components/sections/section";
import { Book3D } from "@/components/books/book";

export const metadata = buildMetadata({
  title: "Books",
  description:
    "Books that changed how I build or how I think — and what each one changed.",
  path: "/books",
});

export default function BooksPage() {
  const total = bookCount();

  return (
    <>
      <PageHeader
        title="Books"
        lead="Not everything I've read — the ones I can say something specific about. If I can't write what a book changed, it isn't on the shelf."
      />

      <Container width="wide" className="pb-16">
        {total === 0 ? (
          <p className="text-fg-muted text-sm">Nothing on the shelf yet.</p>
        ) : (
          <div className="space-y-20">
            {shelves.map((shelf) => (
              <section key={shelf.title}>
                <SectionHeading>{shelf.title}</SectionHeading>
                {shelf.note ? (
                  <p className="text-fg-muted -mt-4 mb-8 max-w-lg text-sm">
                    {shelf.note}
                  </p>
                ) : null}

                <ul className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
                  {shelf.books.map((book) => (
                    <Book3D key={`${book.title}-${book.author}`} book={book} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
