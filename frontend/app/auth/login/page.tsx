import { AuthForm } from '@/components/auth/AuthForm'
import { AuthLayout } from '@/components/auth/AuthLayout'

export default function LoginPage() {
  return (
    <AuthLayout
      illustration="/illustrations/cactus.png"
      title="Yay, You're Back!"
      footerText="Need an account?"
      footerHref="/auth/signup"
      footerLabel="Oops! I've never been here before"
      imageWidth={96}
      imageHeight={114}
      imageClassName="w-[104px]"
    >
      <AuthForm mode="login" />
    </AuthLayout>
  )
}
