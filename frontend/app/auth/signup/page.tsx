import { AuthForm } from '@/components/auth/AuthForm'
import { AuthLayout } from '@/components/auth/AuthLayout'

export default function SignupPage() {
  return (
    <AuthLayout
      illustration="/illustrations/cat-sleeping.png"
      title="Yay, New Friend!"
      footerText="Already have an account?"
      footerHref="/auth/login"
      footerLabel="We're already friends!"
      imageClassName="w-[128px]"
    >
      <AuthForm mode="signup" />
    </AuthLayout>
  )
}
