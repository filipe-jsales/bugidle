/** Text of the teacher report (Modo professor). */
export const TEACHER_UI = {
  button: "Relatório para professor",
  hint: "Baixa um arquivo de texto com o que foi estudado: acertos por assunto, caixas de revisão e laboratórios.",
  heading: "BUGIDLE - RELATÓRIO DE ESTUDO",
  player: (name: string, level: number) => `Jogador: ${name} (nível ${level})`,
  date: (date: string) => `Data: ${date}`,
  playTime: (minutes: number) => `Tempo de jogo: ${Math.floor(minutes / 60)} h ${minutes % 60} min`,
  totals: (right: number, wrong: number, pct: string) => `Respostas nas lições: ${right} certas, ${wrong} erradas (aproveitamento ${pct})`,
  topicsTitle: "LIÇÕES POR ASSUNTO",
  topicLine: (studied: number, total: number, right: number, wrong: number, pct: string) =>
    `${studied} de ${total} bugs estudados, ${right} acertos e ${wrong} erros (${pct})`,
  boxes: (boxes: number[]) => `Caixas de revisão (1 = precisa revisar, 5 = domina): ${boxes.map((n, i) => `caixa ${i + 1}: ${n}`).join(", ")}`,
  covers: (topics: string) => `Conteúdo: ${topics}`,
  review: (names: string) => `Para revisar: ${names}`,
  labsTitle: "LABORATÓRIOS",
  labLine: (solved: number, total: number, tries: number, wrong: number) => `${solved} de ${total} resolvidos (${tries} tentativas, ${wrong} erros)`,
  footer: "Gerado pelo BugIdle. As caixas seguem a repetição espaçada: acertar sobe de caixa, errar volta para a caixa 1.",
};
