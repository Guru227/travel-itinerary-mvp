import { supabase } from './supabase';
import { User } from '../types';

export class AuthService {
  static async signInWithEmail(email: string): Promise<User> {
    try {
      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingUser) {
        // User exists, return user data
        return existingUser;
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ email }])
          .select()
          .single();

        if (createError) throw createError;
        return newUser;
      }
    } catch (error) {
      console.error('Auth error:', error);
      throw new Error('Failed to authenticate user');
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    const userEmail = localStorage.getItem('user_email');
    if (!userEmail) return null;

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .single();

      if (error) {
        // Handle case where user doesn't exist in database (stale localStorage)
        if (error.code === 'PGRST116') {
          console.log('User not found in database, clearing localStorage');
          localStorage.removeItem('user_email');
          localStorage.removeItem('user_id');
          return null;
        }
        throw error;
      }
      return user;
    } catch (error) {
      console.error('Error fetching current user:', error);
      localStorage.removeItem('user_email');
      return null;
    }
  }

  static setCurrentUser(user: User) {
    localStorage.setItem('user_email', user.email);
    localStorage.setItem('user_id', user.id);
  }

  static signOut() {
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_id');
  }

  static getCurrentUserId(): string | null {
    return localStorage.getItem('user_id');
  }
}