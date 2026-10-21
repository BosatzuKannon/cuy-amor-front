export type ProfilePromptAnswer = {
  id: string;
  answer: string;
};

export type ProfilePrompt = {
  id: string;
  label: string;
  placeholder: string;
};

export const PROFILE_PROMPTS_MAX_COUNT = 3;
export const PROMPT_ANSWER_MAX_LENGTH = 150;

export const PROFILE_PROMPTS: ProfilePrompt[] = [
  {
    id: 'plan-pasto',
    label: 'Mi plan favorito en Pasto es...',
    placeholder: 'Ir a la Cocha, comer en el centro, ver el carnaval…',
  },
  {
    id: 'mentira-cita',
    label: 'La peor mentira en una cita es...',
    placeholder: 'Decir que llegas en 5 cuando vas saliendo…',
  },
  {
    id: 'primer-detalle',
    label: 'Lo primero que noto en alguien es...',
    placeholder: 'Su sonrisa, cómo trata a los demás…',
  },
  {
    id: 'domingo-perfecto',
    label: 'Mi domingo perfecto es...',
    placeholder: 'Sin afán, con comida rica y buena compañía…',
  },
  {
    id: 'cancion-pastusa',
    label: 'La canción que me pone a bailar es...',
    placeholder: 'Cualquier cosa que suene en una fiesta pastusa…',
  },
  {
    id: 'gusto-culpable',
    label: 'Mi gusto culpable es...',
    placeholder: 'Spoilearme series, comer a deshoras…',
  },
];

export function getPromptLabel(id: string): string {
  return PROFILE_PROMPTS.find((prompt) => prompt.id === id)?.label ?? id;
}

export function sanitizeProfilePrompts(
  answers: ProfilePromptAnswer[],
): ProfilePromptAnswer[] {
  return answers
    .map((item) => ({ id: item.id.trim(), answer: item.answer.trim() }))
    .filter((item) => item.id.length > 0 && item.answer.length > 0)
    .slice(0, PROFILE_PROMPTS_MAX_COUNT);
}
