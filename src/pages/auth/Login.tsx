import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { AuthFormSplitScreen } from '@/components/ui/login'
import logo from '@/assets/logo.png'
import loginFormImage from '@/assets/loginform.png'

export function Login() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = async (data: any) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Logged in successfully',
      })

      navigate('/dashboard')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to login',
        variant: 'destructive',
      })
    }
  }

  return (
    <AuthFormSplitScreen
      logo={
        <img src={logo} alt="GovRoll Logo" className="h-12 w-auto" />
      }
      title="Welcome back"
      description="Sign in to your account to continue"
      imageSrc={loginFormImage}
      imageAlt="GovRoll Login Illustration"
      onSubmit={handleLogin}
      forgotPasswordHref="/forgot-password"
      createAccountHref="/register"
    />
  )
}

