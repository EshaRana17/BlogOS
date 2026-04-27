type JsonLdObject = Record<string, unknown>;

export default function JsonLd({
  id,
  data,
}: {
  id: string;
  data: JsonLdObject | JsonLdObject[];
}) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
