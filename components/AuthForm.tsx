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
  const [firstName, setFirstName] = useState<string>('')
  const [lastName, setLastName] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [isSignUp, setIsSignUp] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  const handleAuth = async () => {
    if (isSignUp) {
      if (!email || !password || !firstName || !lastName || !phone) {
        Alert.alert('Error', 'Please fill in all fields')
        return
      }
    } else {
      if (!email || !password) {
        Alert.alert('Error', 'Please fill in all fields')
        return
      }
    }

    setLoading(true)
    try {
      if (isSignUp) {
        console.log('Attempting to sign up user with:', { email, firstName, lastName, phone })
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              phone: phone,
              full_name: `${firstName} ${lastName}`,
            }
          }
        })
        if (error) {
          console.error('Signup error:', error)
          throw error
        }
        console.log('Signup successful:', data)
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
      console.error('Auth error:', error)
      Alert.alert('Error', `database error saving new user\n\n${error.message}`)
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
        {isSignUp && (
          <>
            <View style={styles.nameRow}>
              <TextInput
                style={[styles.input, styles.nameInput]}
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                autoComplete="given-name"
                placeholderTextColor={Colors.textLight}
              />
              <TextInput
                style={[styles.input, styles.nameInput]}
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                autoComplete="family-name"
                placeholderTextColor={Colors.textLight}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              placeholderTextColor={Colors.textLight}
            />
          </>
        )}
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
  nameRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  nameInput: {
    flex: 1,
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