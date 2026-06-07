import { RichText } from '@payloadcms/richtext-lexical/react'
import type { RichTextBlock } from '@/payload-types'

/**
 * Renders a Payload Lexical rich-text value to styled HTML. Used by the
 * RichText landing block. The `prose`-ish utility classes mirror the site's
 * mist/evergreen palette without pulling in @tailwindcss/typography.
 */
export default function LexicalContent({ data }: { data: RichTextBlock['content'] }) {
  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-mist-700 [&_a]:font-semibold [&_a]:text-evergreen-700 [&_a]:underline [&_a]:decoration-sunrise-400 [&_a]:underline-offset-2 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-evergreen-800 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-evergreen-800 [&_li]:ml-5 [&_ol]:list-decimal [&_strong]:text-mist-900 [&_ul]:list-disc">
      <RichText data={data} />
    </div>
  )
}
