export type TipoFluxo = 'renda' | 'despesa'

export type Database = {
  public: {
    Tables: {
      categorias: {
        Row: {
          id: string
          nome: string
          grupo: string
          tipo: TipoFluxo
          cor: string | null
        }
        Insert: {
          id?: string
          nome: string
          grupo: string
          tipo: TipoFluxo
          cor?: string | null
        }
        Update: {
          id?: string
          nome?: string
          grupo?: string
          tipo?: TipoFluxo
          cor?: string | null
        }
        Relationships: []
      }
      lancamentos: {
        Row: {
          id: string
          descricao: string
          valor: number
          data: string
          tipo: TipoFluxo
          categoria_id: string | null
          responsavel: string | null
          parcela_atual: number | null
          parcela_total: number | null
          recorrente: boolean
          observacao: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          descricao: string
          valor: number
          data?: string
          tipo: TipoFluxo
          categoria_id?: string | null
          responsavel?: string | null
          parcela_atual?: number | null
          parcela_total?: number | null
          recorrente?: boolean
          observacao?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          descricao?: string
          valor?: number
          data?: string
          tipo?: TipoFluxo
          categoria_id?: string | null
          responsavel?: string | null
          parcela_atual?: number | null
          parcela_total?: number | null
          recorrente?: boolean
          observacao?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      metas: {
        Row: {
          id: string
          titulo: string
          valor_alvo: number
          valor_atual: number
          data_alvo: string | null
          observacao: string | null
        }
        Insert: {
          id?: string
          titulo: string
          valor_alvo: number
          valor_atual?: number
          data_alvo?: string | null
          observacao?: string | null
        }
        Update: {
          id?: string
          titulo?: string
          valor_alvo?: number
          valor_atual?: number
          data_alvo?: string | null
          observacao?: string | null
        }
        Relationships: []
      }
    }
    Enums: {
      tipo_fluxo: TipoFluxo
    }
    CompositeTypes: Record<string, never>
    Functions: Record<string, never>
    Views: Record<string, never>
  }
}

// Convenience aliases
export type Categoria = Database['public']['Tables']['categorias']['Row']
export type Lancamento = Database['public']['Tables']['lancamentos']['Row']
export type Meta = Database['public']['Tables']['metas']['Row']
