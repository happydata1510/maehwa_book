import { createClient } from '@supabase/supabase-js'

// Prefer environment variables; fall back to existing values for local dev convenience
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oxpkrabsailsbrqyvvmc.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94cGtyYWJzYWlsc2JycXl2dm1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjYwMTgsImV4cCI6MjA3MDM0MjAxOH0.9IAg6Ae6HEMWAQYcyDPo4JkGoj9W74OtY_YX6aCVr_c'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 타입 정의
export interface Book {
  id: number
  title: string
  author: string
  ageMin?: number
  ageMax?: number
  createdAt: string
  updatedAt: string
}

export interface Reader {
  id: number
  name: string
  age?: number
  className?: string
  parentPhone?: string
  createdAt: string
  updatedAt: string
}

export interface Reading {
  id: number
  readDate: string
  notes?: string
  createdAt: string
  updatedAt: string
  bookId: number
  book?: Book
  readerId?: number
  reader?: Reader
}