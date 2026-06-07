// Renders one or more schema.org JSON-LD documents into a <script> tag.
// Server-safe: emits a static script with no client JS. Pass any serialisable
// structured-data object(s) from src/lib/seo.ts.

export default function JsonLd({
  schema,
}: {
  schema: Record<string, unknown> | ReadonlyArray<Record<string, unknown>>;
}) {
  const docs = Array.isArray(schema) ? schema : [schema];
  return (
    <>
      {docs.map((doc, i) => (
        <script
          key={i}
          type="application/ld+json"
          // JSON.stringify output is safe here: it is server-generated from our
          // own constants, not user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(doc) }}
        />
      ))}
    </>
  );
}
