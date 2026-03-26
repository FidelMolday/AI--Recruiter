"use client"
import React, { useEffect, useState, createContext } from 'react'
import { supabase } from '../services/supabaseClient'
import { Toaster } from '@/components/ui/sonner'

export const UserDetailContext = createContext(null)

export const useUser = () => {
  const context = React.useContext(UserDetailContext)
  if (!context) {
    throw new Error('useUser must be used within a UserDetailProvider')
  }
  return context
}

const UserDetailProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const initUser = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        // No authenticated user - this is fine, just set loading to false
        if (authError) {
          console.warn('Auth error:', authError.message)
        }
        
        if (!authUser) {
          if (isMounted) {
            setUser(null)
            setLoading(false)
          }
          return
        }

        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle()

        if (fetchError) {
          console.warn('Error fetching user from database:', fetchError)
        }

        if (existingUser) {
          if (isMounted) {
            setUser(existingUser)
            setLoading(false)
          }
        } else {
          // Try to insert into users table
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email,
              name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Candidate',
            })
            .select()
            .single()

          if (insertError) {
            console.warn('User insert failed (table may not exist):', insertError.message)
            // If insert fails, just use auth user data directly
            if (isMounted) {
              setUser({
                id: authUser.id,
                email: authUser.email,
                name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
              })
              setLoading(false)
            }
            return
          }

          if (isMounted) {
            setUser(newUser || null)
            setLoading(false)
          }
        }
      } catch (err) {
        console.error('Auth error:', err)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && isMounted) {
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const updateUser = async (updates) => {
    if (!user?.id) return
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (!error && data) {
      setUser(data)
    }
    return { data, error }
  }

  const refreshUser = async () => {
    if (!user?.email) return
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single()

    if (!error && data) {
      setUser(data)
    }
    return { data, error }
  }

  return (
    <UserDetailContext.Provider value={{ user, setUser, loading, updateUser, refreshUser }}>
      <Toaster position="top-right" />
      {children}
    </UserDetailContext.Provider>
  )
}

export default UserDetailProvider
