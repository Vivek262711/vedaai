// Re-export all shared types
export * from '@vedaai/shared';

// Frontend-specific types
export interface PageProps {
  params: Promise<Record<string, string>>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}
