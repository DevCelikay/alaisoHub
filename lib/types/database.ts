export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'viewer'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          is_admin: boolean
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          is_admin?: boolean
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          is_admin?: boolean
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
      }
      invitations: {
        Row: {
          id: string
          email: string
          role: UserRole
          token: string
          invited_by: string | null
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: UserRole
          token: string
          invited_by?: string | null
          expires_at: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: UserRole
          token?: string
          invited_by?: string | null
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      sops: {
        Row: {
          id: string
          title: string
          objectives: string | null
          logins_prerequisites: string | null
          content: Json | null
          created_by: string | null
          created_at: string
          updated_at: string
          is_archived: boolean
        }
        Insert: {
          id?: string
          title: string
          objectives?: string | null
          logins_prerequisites?: string | null
          content?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_archived?: boolean
        }
        Update: {
          id?: string
          title?: string
          objectives?: string | null
          logins_prerequisites?: string | null
          content?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_archived?: boolean
        }
      }
      prompts: {
        Row: {
          id: string
          title: string
          description: string | null
          content: string
          created_by: string | null
          created_at: string
          updated_at: string
          is_archived: boolean
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          content: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_archived?: boolean
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          content?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_archived?: boolean
        }
      }
      sop_tags: {
        Row: {
          sop_id: string
          tag_id: string
        }
        Insert: {
          sop_id: string
          tag_id: string
        }
        Update: {
          sop_id?: string
          tag_id?: string
        }
      }
      prompt_tags: {
        Row: {
          prompt_id: string
          tag_id: string
        }
        Insert: {
          prompt_id: string
          tag_id: string
        }
        Update: {
          prompt_id?: string
          tag_id?: string
        }
      }
      resources: {
        Row: {
          id: string
          title: string
          description: string | null
          resource_type: 'file' | 'url'
          file_name: string | null
          file_type: string | null
          file_data: string | null
          file_size: number | null
          url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          is_archived: boolean
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          resource_type?: 'file' | 'url'
          file_name?: string | null
          file_type?: string | null
          file_data?: string | null
          file_size?: number | null
          url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_archived?: boolean
        }
        Update: {
          title?: string
          description?: string | null
          resource_type?: 'file' | 'url'
          file_name?: string | null
          file_type?: string | null
          file_data?: string | null
          file_size?: number | null
          url?: string | null
          updated_at?: string
          is_archived?: boolean
        }
      }
      resource_tags: {
        Row: {
          resource_id: string
          tag_id: string
        }
        Insert: {
          resource_id: string
          tag_id: string
        }
        Update: {
          resource_id?: string
          tag_id?: string
        }
      }
    }
  }
}

export type SOP = Database['public']['Tables']['sops']['Row']
export type Prompt = Database['public']['Tables']['prompts']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Invitation = Database['public']['Tables']['invitations']['Row']
export type Resource = Database['public']['Tables']['resources']['Row']

export interface InvitationWithInviter extends Invitation {
  inviter?: Pick<Profile, 'email' | 'full_name'> | null
}

export interface SOPWithTags extends SOP {
  tags: Tag[]
}

export interface PromptWithTags extends Prompt {
  tags: Tag[]
}

export interface ResourceWithTags extends Resource {
  tags: Tag[]
}

export interface StepImage {
  id: string
  data: string // base64 data URL
  caption?: string
}

export type StepType = 'standard' | 'decision'

export interface SOPStep {
  id: string
  title: string
  content: string
  order: number
  type?: StepType
  images?: StepImage[]
}
