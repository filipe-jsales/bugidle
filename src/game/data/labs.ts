/**
 * Lab challenges by topic: Git (Mergefly's route), SQL (the Databases house),
 * Networks (the Networks house) and Security (Injectick and Xssquito). Only code,
 * tables and answers live here; prompts, prose options and explanations are in
 * i18n/labs.ptBR.ts under the same id.
 */
export type LabTopic = "git" | "sql" | "network" | "security";

export const LAB_TOPICS: readonly LabTopic[] = ["git", "sql", "network", "security"];

export interface LabTable {
  readonly name: string;
  readonly columns: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

interface BaseQuestion {
  readonly id: string;
  readonly topic: LabTopic;
  /** Code shown above the question. */
  readonly code?: readonly string[];
  readonly table?: LabTable;
}

export interface ChoiceQuestion extends BaseQuestion {
  readonly kind: "choice";
  /** Options written as code; when absent, the options are prose in i18n. */
  readonly codeOptions?: readonly string[];
  /** Index of the right option (options are shuffled on screen). */
  readonly answer: number;
}

export interface OrderQuestion extends BaseQuestion {
  readonly kind: "order";
  /** Pieces in the right order, written as code; when absent, prose pieces come from i18n. */
  readonly codeItems?: readonly string[];
}

export type LabQuestion = ChoiceQuestion | OrderQuestion;

const STUDENTS: LabTable = {
  name: "alunos",
  columns: ["id", "nome", "nota", "turma"],
  rows: [
    ["1", "Ana", "9", "A"],
    ["2", "Bruno", "6", "B"],
    ["3", "Caio", "8", "A"],
    ["4", "Duda", "5", "A"],
    ["5", "Enzo", "7", "B"],
  ],
};

// prettier-ignore
export const LAB_QUESTIONS: readonly LabQuestion[] = [
  // ---- Git
  { id: "git-conflict", topic: "git", kind: "choice", answer: 0,
    code: ["<<<<<<< HEAD", "const cor = \"azul\";", "=======", "const cor = \"verde\";", ">>>>>>> tema-novo"],
    codeOptions: ["const cor = \"verde\";", "<<<<<<< HEAD\nconst cor = \"verde\";", "const cor = \"azul\";\nconst cor = \"verde\";", "=======\nconst cor = \"verde\";"] },
  { id: "git-flow", topic: "git", kind: "order",
    codeItems: ["git switch -c login", "git add login.js", "git commit -m \"tela de login\"", "git push -u origin login"] },
  { id: "git-branch", topic: "git", kind: "choice", answer: 0,
    codeOptions: ["git switch -c feature", "git merge feature", "git commit feature", "git push feature"] },
  { id: "git-graph", topic: "git", kind: "choice", answer: 0,
    code: ["main     A---B-------E", "              \\     /", "feature        C---D"] },

  // ---- SQL
  { id: "sql-and", topic: "sql", kind: "choice", answer: 0, table: STUDENTS,
    codeOptions: ["SELECT nome FROM alunos WHERE turma = 'A' AND nota >= 8;", "SELECT nome FROM alunos WHERE turma = 'A' OR nota >= 8;", "SELECT nome FROM alunos WHERE nota > 8;", "SELECT nome FROM alunos WHERE turma = 'A';"] },
  { id: "sql-group", topic: "sql", kind: "choice", answer: 0, table: STUDENTS,
    codeOptions: ["SELECT turma, COUNT(*) FROM alunos GROUP BY turma;", "SELECT COUNT(turma) FROM alunos;", "SELECT turma FROM alunos ORDER BY turma;", "SELECT * FROM alunos GROUP BY nome;"] },
  { id: "sql-order", topic: "sql", kind: "choice", answer: 0, table: STUDENTS,
    codeOptions: ["SELECT nome, nota FROM alunos ORDER BY nota DESC;", "SELECT nome, nota FROM alunos ORDER BY nota;", "SELECT MAX(nota) FROM alunos;", "SELECT nome, nota FROM alunos ORDER BY nome DESC;"] },
  { id: "sql-build", topic: "sql", kind: "order", table: STUDENTS,
    codeItems: ["SELECT nome", "FROM alunos", "WHERE nota >= 7", "ORDER BY nome;"] },

  // ---- Networks
  { id: "net-path", topic: "network", kind: "order" },
  { id: "net-dns", topic: "network", kind: "choice", answer: 0 },
  { id: "net-tcp", topic: "network", kind: "choice", answer: 0 },
  { id: "net-404", topic: "network", kind: "choice", answer: 0, code: ["GET /pagina-antiga HTTP/1.1", "Host: site.com", "", "HTTP/1.1 404 Not Found"] },

  // ---- Security
  { id: "sec-injection", topic: "security", kind: "choice", answer: 0,
    code: ["db.query(\"SELECT * FROM users WHERE name = '\" + nome + \"'\");"],
    codeOptions: ["' OR '1'='1", "Ana Maria", "joao_silva", "Bia 2"] },
  { id: "sec-xss", topic: "security", kind: "choice", answer: 0,
    codeOptions: ["div.textContent = comentario;", "div.innerHTML = comentario;", "document.write(comentario);", "div.outerHTML = comentario;"] },
  { id: "sec-form", topic: "security", kind: "order" },
  { id: "sec-password", topic: "security", kind: "choice", answer: 0 },
];

export function labQuestion(id: string): LabQuestion | undefined {
  return LAB_QUESTIONS.find((q) => q.id === id);
}

export function labQuestionsOf(topic: LabTopic): LabQuestion[] {
  return LAB_QUESTIONS.filter((q) => q.topic === topic);
}
