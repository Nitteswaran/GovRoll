"use client";

import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import logo from '@/assets/logo.png';
import loginFormImage from '@/assets/loginform.png';

// Validation schema for the form
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export function Register() {
  const [isLoading, setIsLoading] = React.useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  // Hardcoded role as per previous logic
  const role = 'employer'

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleRegister = async (data: FormValues) => {
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { role },
        },
      })

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Account created! Please check your email to verify your account.',
      })

      navigate('/login')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create account',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col md:flex-row">
      {/* Left Panel: Form */}
      <div className="flex w-full flex-col items-center justify-center bg-background p-8 md:w-1/2">
        <div className="w-full max-w-md">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            <motion.div variants={itemVariants} className="mb-4">
              <img src={logo} alt="GovRoll Logo" className="h-12 w-auto" />
            </motion.div>
            <motion.div variants={itemVariants} className="text-left">
              <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
              <p className="text-sm text-muted-foreground">Enter your information to create your GovRoll account</p>
            </motion.div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleRegister)}
                className="space-y-4"
              >
                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="name@example.com"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button type="submit" className="w-full bg-[#01A5D8] hover:bg-[#01A5D8]/90" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create account
                  </Button>
                </motion.div>
              </form>
            </Form>

            <motion.p
              variants={itemVariants}
              className="px-8 text-center text-sm text-muted-foreground"
            >
              Already have an account?{" "}
              <a
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Login
              </a>
              .
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel: Image */}
      <div className="relative hidden w-1/2 md:block">
        <img
          src={loginFormImage}
          alt="GovRoll Registration Illustration"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
    </div>
  )
}

