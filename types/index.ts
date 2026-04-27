export interface Usuario {
  id: number
  nombre: string
  email: string
  avatar_url?: string
  fecha_registro: Date
}

export interface Arbol {
  id: number
  usuario_id: number
  nombre: string
  especie?: string
  latitud: number
  longitud: number
  fecha_plantacion?: Date
  descripcion?: string
  foto_url?: string
  creado_en: Date
  actualizado_en: Date
}

export interface ArbolResumen {
  id: number
  nombre: string
  especie?: string
  foto_url?: string
  creado_en: Date
}

export interface ArbolGeo {
  id: number
  nombre: string
  especie?: string
  latitud: number
  longitud: number
  foto_url?: string
  creado_en: Date
}

export interface Seguimiento {
  id: number
  arbol_id: number
  usuario_id: number
  titulo: string
  descripcion?: string
  foto_url?: string
  altura_cm?: number
  salud?: string
  fecha_seguimiento: Date
  creado_en: Date
}

export interface Tip {
  id: number
  titulo: string
  contenido: string
  categoria?: string
  imagen_url?: string
  icono?: string
  orden: number
  activo: boolean
}
