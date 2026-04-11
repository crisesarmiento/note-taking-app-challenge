import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'

type AuthLayoutProps = {
  illustration: string
  title: string
  children: React.ReactNode
  footerText: string
  footerHref: string
  footerLabel: string
  imageClassName?: string
}

export function AuthLayout({ illustration, title, children, footerText, footerHref, footerLabel, imageClassName }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-6 py-12">
      <section className="w-full max-w-[400px] text-center">
        <div className="mb-7 flex justify-center">
          <Image src={illustration} alt="" width={128} height={128} priority className={cn('h-auto object-contain', imageClassName)} />
        </div>
        <h1 className="mb-8 font-serif text-[2.5rem] font-bold leading-tight text-textMeta">{title}</h1>
        {children}
        <p className="mt-6 text-sm text-textMuted">
          <span className="sr-only">{footerText}</span>
          <Link className="underline decoration-textMuted underline-offset-4 transition-colors hover:text-textMeta" href={footerHref}>
            {footerLabel}
          </Link>
        </p>
      </section>
    </main>
  )
}
