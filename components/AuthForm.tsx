import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Colors } from '@/constants/colors'

interface AuthFormProps {
  onSuccess?: () => void
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [isSignUp, setIsSignUp] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        Alert.alert('Success', 'Check your email for the confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        onSuccess?.()
      }
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>
        {isSignUp ? 'Create Account' : 'Welcome Back'}
      </Text>
      <Text style={styles.subtitle}>
        {isSignUp 
          ? 'Join The Hot Temple community' 
          : 'Sign in to book your classes'
        }
      </Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholderTextColor={Colors.textLight}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          placeholderTextColor={Colors.textLight}
        />

        <Button
          title={isSignUp ? 'Create Account' : 'Sign In'}
          onPress={handleAuth}
          loading={loading}
          style={styles.authButton}
        />

        <Button
          title={isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          onPress={() => setIsSignUp(!isSignUp)}
          variant="ghost"
          style={styles.switchButton}
        />
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    margin: 20,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: Colors.white,
    color: Colors.text,
  },
  authButton: {
    marginTop: 8,
  },
  switchButton: {
    marginTop: 8,
  },
})