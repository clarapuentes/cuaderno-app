# Cuaderno — Organizador personal

App de notas y proyectos con React + Supabase. Instalable como app en el móvil (PWA).

## Desarrollo local

1. Instala dependencias:
   ```
   npm install
   ```
2. Copia `.env.example` como `.env.local` y rellena tus claves de Supabase.
3. Arranca el servidor de desarrollo:
   ```
   npm run dev
   ```

## Build de producción

```
npm run build
npm run preview
```

## Variables de entorno necesarias

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Se configuran en `.env.local` para desarrollo, y en Vercel (Project Settings → Environment Variables) para producción.

## Base de datos

El esquema SQL (tablas `projects` y `notes`, con Row Level Security) está pensado para ejecutarse en el SQL Editor de Supabase antes del primer uso.
