export const criarSlug = (nome: string): string => {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '') 
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
};

export const lerSlug = (slug: string): string => {
  return slug
    .replace(/-/g, ' ')
    .replace(/_/g, ' ') 
    .replace(/\s+/g, ' ')
    .trim();
};