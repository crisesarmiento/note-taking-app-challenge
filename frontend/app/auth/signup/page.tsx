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
      imageWidth={189}
      imageHeight={134}
      imageClassName="w-[128px]"
    >
      <AuthForm mode="signup" />
    </AuthLayout>
  )
}
