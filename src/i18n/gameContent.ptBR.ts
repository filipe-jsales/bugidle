/** Word lists, clues and statements for the mini games (pt-BR). */

/** Words for the word search and the anagram (letters only after removing accents). */
export const WORD_POOL: readonly string[] = [
  "LINUX", "PYTHON", "SERVIDOR", "CODIGO", "ARRAY", "LOOP", "BUG", "CACHE", "PIXEL", "BINARIO",
  "TECLADO", "MOUSE", "REDE", "SENHA", "BANCO", "TABELA", "FUNCAO", "CLASSE", "OBJETO", "MEMORIA",
  "CHIP", "NUVEM", "LOGIN", "SCRIPT", "TERMINAL", "BRANCH", "COMMIT", "MERGE", "DEPLOY", "TESTE",
  "API", "JSON", "HTML", "CSS", "SQL", "WIFI", "ROTEADOR", "DADOS", "VARIAVEL", "LACO",
];

export interface CrossEntryText {
  answer: string;
  clue: string;
}

/** Terms with a short clue, for the crossword and the hangman. */
export const TERM_CLUES: readonly CrossEntryText[] = [
  { answer: "ALGORITMO", clue: "Passos em ordem para resolver um problema" },
  { answer: "VARIAVEL", clue: "Nome que guarda um valor que pode mudar" },
  { answer: "COMPILADOR", clue: "Traduz o código para a linguagem da máquina" },
  { answer: "RECURSAO", clue: "Função que chama a si mesma" },
  { answer: "CACHE", clue: "Cópia guardada para não buscar de novo" },
  { answer: "SERVIDOR", clue: "Computador que responde aos pedidos dos outros" },
  { answer: "PROTOCOLO", clue: "Regras combinadas para dois sistemas conversarem" },
  { answer: "BINARIO", clue: "Sistema com só dois dígitos" },
  { answer: "PIXEL", clue: "Menor ponto de uma imagem na tela" },
  { answer: "FIREWALL", clue: "Filtro que bloqueia conexões indesejadas" },
  { answer: "SENHA", clue: "Segredo que prova quem você é" },
  { answer: "TABELA", clue: "Linhas e colunas num banco de dados" },
  { answer: "LACO", clue: "Repete um trecho enquanto a condição vale" },
  { answer: "VETOR", clue: "Lista de valores com posições numeradas" },
  { answer: "FUNCAO", clue: "Bloco de código com nome que recebe e devolve valores" },
  { answer: "DEPURAR", clue: "Procurar e corrigir bugs" },
  { answer: "COMMIT", clue: "Ponto salvo na história do Git" },
  { answer: "BRANCH", clue: "Linha de trabalho separada no Git" },
  { answer: "NUVEM", clue: "Servidores alugados pela internet" },
  { answer: "CRIPTOGRAFIA", clue: "Embaralha dados para só quem tem a chave ler" },
  { answer: "TERMINAL", clue: "Tela onde se digitam comandos" },
  { answer: "MEMORIA", clue: "Onde o programa guarda os dados enquanto roda" },
  { answer: "INDICE", clue: "Posição de um item numa lista, começando em zero" },
  { answer: "STRING", clue: "Texto dentro do programa, entre aspas" },
];

/** Command and what it does, for the memory game. */
export const MEMORY_PAIRS: readonly { a: string; b: string }[] = [
  { a: "ls", b: "lista os arquivos da pasta" },
  { a: "cd", b: "entra em outra pasta" },
  { a: "pwd", b: "mostra a pasta atual" },
  { a: "mkdir", b: "cria uma pasta" },
  { a: "rm", b: "apaga um arquivo" },
  { a: "cat", b: "mostra o conteúdo de um arquivo" },
  { a: "git add", b: "marca mudanças para o commit" },
  { a: "git commit", b: "salva um ponto na história" },
  { a: "git push", b: "envia os commits para o servidor" },
  { a: "git pull", b: "baixa as mudanças do servidor" },
  { a: "grep", b: "procura um texto nas linhas" },
  { a: "ping", b: "testa se outro computador responde" },
];

export interface TrueFalseText {
  text: string;
  answer: boolean;
  why: string;
}

export const TRUE_FALSE: readonly TrueFalseText[] = [
  { text: "Em JavaScript, 0.1 + 0.2 é exatamente 0.3.", answer: false, why: "Dá 0.30000000000000004 por causa do ponto flutuante." },
  { text: "O primeiro índice de uma lista é 0 na maioria das linguagens.", answer: true, why: "Por isso o último é length - 1." },
  { text: "HTML é uma linguagem de marcação.", answer: true, why: "Ele marca a estrutura da página com etiquetas." },
  { text: "Um byte tem 10 bits.", answer: false, why: "Um byte tem 8 bits." },
  { text: "O primeiro bug registrado foi uma mariposa presa num computador.", answer: true, why: "Em 1947, no Harvard Mark II." },
  { text: "A memória RAM continua guardando tudo depois que o computador desliga.", answer: false, why: "A RAM perde tudo sem energia; o disco guarda." },
  { text: "Python foi batizado em homenagem à cobra.", answer: false, why: "O nome vem do grupo de comédia Monty Python." },
  { text: "O DNS traduz nomes de sites em endereços IP.", answer: true, why: "É a lista telefônica da internet." },
  { text: "HTTPS envia os dados criptografados.", answer: true, why: "O S é de seguro: a conversa vai cifrada." },
  { text: "Linux é um sistema de código aberto.", answer: true, why: "Qualquer um pode ler, estudar e mudar o código." },
  { text: "Um laço while sempre roda pelo menos uma vez.", answer: false, why: "Se a condição já começa falsa, ele nem entra." },
  { text: "Em binário, 1010 vale 10.", answer: true, why: "8 + 0 + 2 + 0 = 10." },
  { text: "Hexadecimal usa as letras de A a F.", answer: true, why: "A = 10 até F = 15." },
  { text: "Guardar senhas em texto puro no banco é seguro se o banco tiver senha.", answer: false, why: "Senhas vão com hash lento e sal, nunca em texto puro." },
  { text: "Git só funciona com internet.", answer: false, why: "Commits, branches e histórico funcionam offline; só push e pull usam a rede." },
  { text: "CSS cuida da aparência da página.", answer: true, why: "Cores, fontes, espaços e posições." },
  { text: "Um algoritmo precisa ser escrito numa linguagem de programação.", answer: false, why: "Uma receita de bolo também é um algoritmo." },
  { text: "O código 404 quer dizer que a página não foi encontrada.", answer: true, why: "4xx são erros do pedido; 404 é endereço inexistente." },
  { text: "Recursão sem caso base termina sozinha.", answer: false, why: "Ela chama a si mesma até estourar a pilha." },
  { text: "SQL serve para consultar bancos de dados.", answer: true, why: "SELECT, WHERE, ORDER BY..." },
  { text: "Um pixel é a menor parte de uma imagem na tela.", answer: true, why: "Cada um tem uma cor; juntos formam a imagem." },
  { text: "O processador guarda os arquivos quando o computador desliga.", answer: false, why: "Quem guarda é o disco (HD ou SSD)." },
  { text: "Em Python, a indentação faz parte da sintaxe.", answer: true, why: "Os espaços definem os blocos de código." },
  { text: "Todo número em binário é maior que em decimal.", answer: false, why: "É o mesmo número, só escrito de outro jeito." },
  { text: "Um firewall pode bloquear conexões vindas da internet.", answer: true, why: "Ele filtra o tráfego seguindo regras." },
  { text: "JavaScript e Java são a mesma linguagem.", answer: false, why: "São linguagens diferentes; o nome parecido foi marketing." },
  { text: "Um commit no Git pode ser desfeito.", answer: true, why: "Dá para voltar a qualquer ponto da história." },
  { text: "A Lei de Moore diz que os chips dobravam de transistores a cada dois anos, mais ou menos.", answer: true, why: "Foi verdade por décadas." },
];

export const LANGUAGE_NAMES: Record<string, string> = {
  python: "Python",
  javascript: "JavaScript",
  sql: "SQL",
  c: "C",
  css: "CSS",
  html: "HTML",
  bash: "Bash (terminal)",
};
