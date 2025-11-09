export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          cover_image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          cover_image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          cover_image_url?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          image_url: string
          stock: number
          category_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          image_url: string
          stock: number
          category_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string
          stock?: number
          category_id?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          full_name: string
          avatar_url: string | null
          is_admin: boolean
        }
        Insert: {
          id: string
          created_at?: string
          full_name: string
          avatar_url?: string | null
          is_admin?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          full_name?: string
          avatar_url?: string | null
          is_admin?: boolean
        }
      }
      store_settings: {
        Row: {
          id: string
          store_name: string
          store_url: string | null
          contact_email: string | null
          support_phone: string | null
          store_description: string | null
          business_hours: Json
          currency: string
          timezone: string
          logo_url: string | null
          favicon_url: string | null
          social_media: Json
          payment_methods: Json
          shipping_options: Json
          tax_rate: number
          maintenance_mode: boolean
          return_policy: string | null
          return_policy_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_name: string
          store_url?: string | null
          contact_email?: string | null
          support_phone?: string | null
          store_description?: string | null
          business_hours?: Json
          currency?: string
          timezone?: string
          logo_url?: string | null
          favicon_url?: string | null
          social_media?: Json
          payment_methods?: Json
          shipping_options?: Json
          tax_rate?: number
          maintenance_mode?: boolean
          return_policy?: string | null
          return_policy_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_name?: string
          store_url?: string | null
          contact_email?: string | null
          support_phone?: string | null
          store_description?: string | null
          business_hours?: Json
          currency?: string
          timezone?: string
          logo_url?: string | null
          favicon_url?: string | null
          social_media?: Json
          payment_methods?: Json
          shipping_options?: Json
          tax_rate?: number
          maintenance_mode?: boolean
          return_policy?: string | null
          return_policy_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}