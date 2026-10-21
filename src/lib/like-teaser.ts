import type { ExploreProfile } from '@/services/profile-service';

/**
 * Zeigarnik hook (frontend mirror): deja la frase a medias para forzar la
 * curiosidad. Nunca revela la identidad; solo un señuelo tentador.
 */
export function buildLikeTeaser(liker: ExploreProfile): string {
  const distance = liker.distance;
  if (typeof distance === 'number' && distance >= 0) {
    const rounded = distance < 1 ? 1 : Math.round(distance);
    return `A ${rounded} km de ti…`;
  }

  const hobby = liker.hobbies?.find((item) => item.trim().length > 0);
  if (hobby) {
    return `Le encanta ${hobby}…`;
  }

  const city = liker.city?.trim();
  if (city) {
    return `Es de ${city}…`;
  }

  return 'Alguien se fijó en ti…';
}
