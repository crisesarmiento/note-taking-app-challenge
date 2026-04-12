import Image from 'next/image'

export function EmptyState() {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <Image src="/illustrations/bubble-tea.png" alt="" width={297} height={296} className="mb-6 h-auto w-[150px] object-contain" />
      <p className="max-w-sm text-sm leading-6 text-textMeta">I&apos;m just here waiting for your charming notes...</p>
    </div>
  )
}
