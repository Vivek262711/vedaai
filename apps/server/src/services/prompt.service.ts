import type { AssessmentJobData } from '../queues/assessment.queue';

const SYSTEM_PROMPT = `You are an expert educational assessment creator. Generate structured question papers in valid JSON format only.

CRITICAL RULES:
1. Return ONLY valid JSON - no markdown, no code blocks, no explanations
2. Follow the exact schema provided
3. Each question must be unique and well-formed
4. Distribute difficulty exactly as specified
5. Questions should be pedagogically sound and appropriate for the grade level
6. For MCQ questions, always provide exactly 4 options
7. Marks should match the specified marks per question`;

export function buildPrompt(data: AssessmentJobData): string {
  const { title, subject, grade, questionTypes, numberOfQuestions, marksPerQuestion, difficultyDistribution, instructions } = data;

  const easyCount = Math.round((difficultyDistribution.easy / 100) * numberOfQuestions);
  const hardCount = Math.round((difficultyDistribution.hard / 100) * numberOfQuestions);
  const mediumCount = numberOfQuestions - easyCount - hardCount;

  const sectionCount = questionTypes.length;
  const questionsPerSection = Math.floor(numberOfQuestions / sectionCount);
  const remainder = numberOfQuestions % sectionCount;

  const sectionDetails = questionTypes.map((type, i) => {
    const count = questionsPerSection + (i < remainder ? 1 : 0);
    return `Section ${String.fromCharCode(65 + i)}: ${count} ${type.replace(/_/g, ' ')} questions`;
  }).join('\n');

  return `${SYSTEM_PROMPT}

Generate a question paper with these specifications:

TITLE: ${title}
${subject ? `SUBJECT: ${subject}` : ''}
${grade ? `GRADE: ${grade}` : ''}
TOTAL QUESTIONS: ${numberOfQuestions}
MARKS PER QUESTION: ${marksPerQuestion}
TOTAL MARKS: ${numberOfQuestions * marksPerQuestion}

DIFFICULTY DISTRIBUTION:
- Easy: ${easyCount} questions (${difficultyDistribution.easy}%)
- Medium: ${mediumCount} questions (${difficultyDistribution.medium}%)
- Hard: ${hardCount} questions (${difficultyDistribution.hard}%)

SECTIONS:
${sectionDetails}

${instructions ? `ADDITIONAL INSTRUCTIONS: ${instructions}` : ''}

Return this exact JSON schema:
{
  "title": "string",
  "instructions": "string (general exam instructions)",
  "duration": "string (estimated duration like '2 hours')",
  "sections": [
    {
      "title": "string (e.g. 'Section A - Multiple Choice Questions')",
      "instruction": "string (section-specific instructions)",
      "questions": [
        {
          "id": "string (e.g. 'q1')",
          "question": "string",
          "marks": number,
          "difficulty": "easy" | "medium" | "hard",
          "type": "${questionTypes.join('" | "')}",
          "options": ["string"] (ONLY for MCQ, exactly 4 options),
          "answer": "string (correct answer)"
        }
      ]
    }
  ]
}

RETURN ONLY THE JSON. NO OTHER TEXT.`;
}

export { SYSTEM_PROMPT };
