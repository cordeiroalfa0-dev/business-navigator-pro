export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      acoes_meta: {
        Row: {
          concluida: boolean
          created_at: string
          created_by: string | null
          descricao: string
          id: string
          imagens: string[] | null
          meta_id: string
          prazo: string | null
          responsavel: string | null
          tipo: string
        }
        Insert: {
          concluida?: boolean
          created_at?: string
          created_by?: string | null
          descricao: string
          id?: string
          imagens?: string[] | null
          meta_id: string
          prazo?: string | null
          responsavel?: string | null
          tipo?: string
        }
        Update: {
          concluida?: boolean
          created_at?: string
          created_by?: string | null
          descricao?: string
          id?: string
          imagens?: string[] | null
          meta_id?: string
          prazo?: string | null
          responsavel?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "acoes_meta_meta_id_fkey"
            columns: ["meta_id"]
            isOneToOne: false
            referencedRelation: "metas"
            referencedColumns: ["id"]
          },
        ]
      }
      app_modules: {
        Row: {
          created_at: string
          enabled: boolean
          key: string
          label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          key: string
          label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          key?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      contas_pagar: {
        Row: {
          categoria: string
          created_at: string
          created_by: string
          data_emissao: string
          data_vencimento: string
          descricao: string
          fornecedor: string
          id: string
          status: string
          valor: number
        }
        Insert: {
          categoria?: string
          created_at?: string
          created_by: string
          data_emissao?: string
          data_vencimento?: string
          descricao?: string
          fornecedor?: string
          id?: string
          status?: string
          valor?: number
        }
        Update: {
          categoria?: string
          created_at?: string
          created_by?: string
          data_emissao?: string
          data_vencimento?: string
          descricao?: string
          fornecedor?: string
          id?: string
          status?: string
          valor?: number
        }
        Relationships: []
      }
      contas_receber: {
        Row: {
          categoria: string
          cliente: string
          created_at: string
          created_by: string
          data_emissao: string
          data_vencimento: string
          descricao: string
          id: string
          status: string
          valor: number
        }
        Insert: {
          categoria?: string
          cliente?: string
          created_at?: string
          created_by: string
          data_emissao?: string
          data_vencimento?: string
          descricao?: string
          id?: string
          status?: string
          valor?: number
        }
        Update: {
          categoria?: string
          cliente?: string
          created_at?: string
          created_by?: string
          data_emissao?: string
          data_vencimento?: string
          descricao?: string
          id?: string
          status?: string
          valor?: number
        }
        Relationships: []
      }
      contratos: {
        Row: {
          created_at: string
          created_by: string
          data_fim: string | null
          data_inicio: string
          empreendimento_id: string | null
          fornecedor: string
          id: string
          numero: string
          objeto: string
          status: string
          valor: number
        }
        Insert: {
          created_at?: string
          created_by: string
          data_fim?: string | null
          data_inicio?: string
          empreendimento_id?: string | null
          fornecedor?: string
          id?: string
          numero?: string
          objeto?: string
          status?: string
          valor?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          data_fim?: string | null
          data_inicio?: string
          empreendimento_id?: string | null
          fornecedor?: string
          id?: string
          numero?: string
          objeto?: string
          status?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contratos_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      dados_cadastro: {
        Row: {
          categoria: string
          created_at: string
          created_by: string
          data: string
          descricao: string
          id: string
          responsavel: string | null
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string
          created_by: string
          data?: string
          descricao: string
          id?: string
          responsavel?: string | null
          valor?: number
        }
        Update: {
          categoria?: string
          created_at?: string
          created_by?: string
          data?: string
          descricao?: string
          id?: string
          responsavel?: string | null
          valor?: number
        }
        Relationships: []
      }
      empreendimentos: {
        Row: {
          codigo: string
          created_at: string
          created_by: string
          endereco: string | null
          fase: string
          id: string
          nome: string
          previsao: string | null
          status: string
          unidades: number
          vendidas: number
        }
        Insert: {
          codigo?: string
          created_at?: string
          created_by: string
          endereco?: string | null
          fase?: string
          id?: string
          nome?: string
          previsao?: string | null
          status?: string
          unidades?: number
          vendidas?: number
        }
        Update: {
          codigo?: string
          created_at?: string
          created_by?: string
          endereco?: string | null
          fase?: string
          id?: string
          nome?: string
          previsao?: string | null
          status?: string
          unidades?: number
          vendidas?: number
        }
        Relationships: []
      }
      faturamento: {
        Row: {
          cliente: string
          created_at: string
          created_by: string
          data_emissao: string
          data_vencimento: string
          id: string
          numero: string
          observacoes: string | null
          status: string
          valor: number
        }
        Insert: {
          cliente?: string
          created_at?: string
          created_by: string
          data_emissao?: string
          data_vencimento?: string
          id?: string
          numero?: string
          observacoes?: string | null
          status?: string
          valor?: number
        }
        Update: {
          cliente?: string
          created_at?: string
          created_by?: string
          data_emissao?: string
          data_vencimento?: string
          id?: string
          numero?: string
          observacoes?: string | null
          status?: string
          valor?: number
        }
        Relationships: []
      }
      materiais: {
        Row: {
          canteiro: string
          codigo: string
          created_at: string
          created_by: string
          id: string
          minimo: number
          nome: string
          quantidade: number
          unidade: string
        }
        Insert: {
          canteiro?: string
          codigo?: string
          created_at?: string
          created_by: string
          id?: string
          minimo?: number
          nome?: string
          quantidade?: number
          unidade?: string
        }
        Update: {
          canteiro?: string
          codigo?: string
          created_at?: string
          created_by?: string
          id?: string
          minimo?: number
          nome?: string
          quantidade?: number
          unidade?: string
        }
        Relationships: []
      }
      meta_checkins: {
        Row: {
          comentario: string | null
          confianca: string
          created_at: string
          id: string
          imagens: string[] | null
          meta_id: string
          user_id: string
          user_name: string
          valor_anterior: number
          valor_novo: number
        }
        Insert: {
          comentario?: string | null
          confianca?: string
          created_at?: string
          id?: string
          imagens?: string[] | null
          meta_id: string
          user_id: string
          user_name?: string
          valor_anterior?: number
          valor_novo?: number
        }
        Update: {
          comentario?: string | null
          confianca?: string
          created_at?: string
          id?: string
          imagens?: string[] | null
          meta_id?: string
          user_id?: string
          user_name?: string
          valor_anterior?: number
          valor_novo?: number
        }
        Relationships: [
          {
            foreignKeyName: "meta_checkins_meta_id_fkey"
            columns: ["meta_id"]
            isOneToOne: false
            referencedRelation: "metas"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          aprovador: string | null
          atual: number
          categoria: string
          ciclo: string
          cor: string
          created_at: string
          created_by: string | null
          custo_atual: number | null
          data_inicio: string | null
          departamento: string | null
          dependencias: string | null
          descricao: string | null
          equipe: string | null
          etapa: string | null
          fonte_dados: string | null
          fornecedor: string | null
          frequencia_checkin: string | null
          id: string
          impacto: string | null
          indicador_chave: string | null
          local_obra: string | null
          marco_critico: string | null
          nome: string
          objetivo: number
          observacoes: string | null
          orcamento: number | null
          parent_id: string | null
          percentual_concluido: number | null
          peso: number | null
          prazo: string
          prioridade: string
          responsavel: string
          risco: string | null
          status: string
          tags: string[] | null
          tipo_meta: string | null
          unidade: string
          updated_at: string
        }
        Insert: {
          aprovador?: string | null
          atual?: number
          categoria?: string
          ciclo?: string
          cor?: string
          created_at?: string
          created_by?: string | null
          custo_atual?: number | null
          data_inicio?: string | null
          departamento?: string | null
          dependencias?: string | null
          descricao?: string | null
          equipe?: string | null
          etapa?: string | null
          fonte_dados?: string | null
          fornecedor?: string | null
          frequencia_checkin?: string | null
          id?: string
          impacto?: string | null
          indicador_chave?: string | null
          local_obra?: string | null
          marco_critico?: string | null
          nome: string
          objetivo: number
          observacoes?: string | null
          orcamento?: number | null
          parent_id?: string | null
          percentual_concluido?: number | null
          peso?: number | null
          prazo?: string
          prioridade?: string
          responsavel?: string
          risco?: string | null
          status?: string
          tags?: string[] | null
          tipo_meta?: string | null
          unidade?: string
          updated_at?: string
        }
        Update: {
          aprovador?: string | null
          atual?: number
          categoria?: string
          ciclo?: string
          cor?: string
          created_at?: string
          created_by?: string | null
          custo_atual?: number | null
          data_inicio?: string | null
          departamento?: string | null
          dependencias?: string | null
          descricao?: string | null
          equipe?: string | null
          etapa?: string | null
          fonte_dados?: string | null
          fornecedor?: string | null
          frequencia_checkin?: string | null
          id?: string
          impacto?: string | null
          indicador_chave?: string | null
          local_obra?: string | null
          marco_critico?: string | null
          nome?: string
          objetivo?: number
          observacoes?: string | null
          orcamento?: number | null
          parent_id?: string | null
          percentual_concluido?: number | null
          peso?: number | null
          prazo?: string
          prioridade?: string
          responsavel?: string
          risco?: string | null
          status?: string
          tags?: string[] | null
          tipo_meta?: string | null
          unidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "metas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      relatorios_gerados: {
        Row: {
          created_at: string
          formato: string
          id: string
          observacoes: string | null
          periodo_fim: string
          periodo_inicio: string
          registros: number
          tipo: string
          user_id: string
          user_name: string
        }
        Insert: {
          created_at?: string
          formato?: string
          id?: string
          observacoes?: string | null
          periodo_fim: string
          periodo_inicio: string
          registros?: number
          tipo: string
          user_id: string
          user_name?: string
        }
        Update: {
          created_at?: string
          formato?: string
          id?: string
          observacoes?: string | null
          periodo_fim?: string
          periodo_inicio?: string
          registros?: number
          tipo?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_dashboard_view: {
        Row: {
          total_admins: number | null
          total_profiles: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      bootstrap_first_admin: {
        Args: { _full_name: string }
        Returns: undefined
      }
      has_admin_accounts: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "master" | "normal"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "master", "normal"],
    },
  },
} as const
