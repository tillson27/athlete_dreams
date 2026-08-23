import {
  ATHLETE_STORY_QUESTION_IDS,
  type AthleteStoryAnswers,
  type AthleteStoryQuestionId,
} from 'fad-common';

type StoryQuestion = {
  questionId: AthleteStoryQuestionId;
  prompt: string;
  options: string[];
  lead: string;
};

export const STORY_QUESTIONS: StoryQuestion[] = [
  {
    questionId: 'origin',
    prompt: 'What got you into running?',
    options: ['Family', 'A school race', 'A coach', 'Mental reset', 'Trying something hard'],
    lead: 'I got into running through',
  },
  {
    questionId: 'chasing',
    prompt: 'What are you chasing right now?',
    options: ['A personal best', 'A comeback', 'A championship', 'Consistency', 'A new distance'],
    lead: "Right now I'm chasing",
  },
  {
    questionId: 'hardest',
    prompt: "What's been the hardest part?",
    options: ['Balancing work', 'Injury', 'Travel costs', 'Training alone', 'Staying confident'],
    lead: 'The hardest part has been',
  },
  {
    questionId: 'corner',
    prompt: "Who's in your corner?",
    options: ['Family', 'Teammates', 'A coach', 'My community', 'People who believe early'],
    lead: 'In my corner are',
  },
];

const STORY_QUESTION_IDS = new Set<string>(ATHLETE_STORY_QUESTION_IDS);

export function normalizeStoryAnswers(answers: AthleteStoryAnswers): AthleteStoryAnswers {
  return Object.fromEntries(
    Object.entries(answers)
      .filter(([questionId]) => STORY_QUESTION_IDS.has(questionId))
      .map(([questionId, answer]) => [
        questionId,
        {
          selections: answer.selections.map((selection) => selection.trim()).filter(Boolean),
          ...(answer.extraWords?.trim() ? { extraWords: answer.extraWords.trim() } : {}),
        },
      ])
  );
}

export function hasStoryAnswers(answers: AthleteStoryAnswers): boolean {
  return Object.values(answers).some(
    (answer) => answer.selections.length > 0 || Boolean(answer.extraWords?.trim())
  );
}

export function composeStoryDraft(answers: AthleteStoryAnswers): string {
  const normalized = normalizeStoryAnswers(answers);
  return STORY_QUESTIONS.map((question) => {
    const answer = normalized[question.questionId];
    if (!answer || (answer.selections.length === 0 && !answer.extraWords)) return '';
    const selections = answer.selections.length > 0 ? joinList(answer.selections).toLowerCase() : '';
    const ownWords = answer.extraWords?.trim();
    if (selections && ownWords) return `${question.lead} ${selections}. ${ownWords}`;
    if (selections) return `${question.lead} ${selections}.`;
    return ownWords ?? '';
  })
    .filter(Boolean)
    .join('\n\n');
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}
