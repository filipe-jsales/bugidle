/**
 * Glossary of technical words used in the lessons and labs. Each term lists the
 * spellings that should link to it (lowercase); the first one is the title.
 */
export interface GlossaryTerm {
  id: string;
  /** Spellings found in the texts, lowercase. The first is shown as the title. */
  words: readonly string[];
  definition: string;
}

// prettier-ignore
export const GLOSSARY: readonly GlossaryTerm[] = [
  { id: "variable", words: ["variável", "variáveis"], definition: "Um nome que guarda um valor, como uma caixa com etiqueta." },
  { id: "index", words: ["índice", "índices"], definition: "A posição de um item numa lista. Começa em 0: o primeiro item é o de índice 0." },
  { id: "loop", words: ["laço", "laços", "loop"], definition: "Um trecho de código que se repete enquanto uma condição for verdadeira." },
  { id: "null", words: ["null", "undefined"], definition: "Valores que significam \"nada aqui\". Ler uma propriedade deles faz o programa quebrar." },
  { id: "function", words: ["função", "funções"], definition: "Um bloco de código com nome, que recebe valores, faz um trabalho e pode devolver um resultado." },
  { id: "recursion", words: ["recursão", "recursiva"], definition: "Quando uma função chama a si mesma. Precisa de um caso base para parar." },
  { id: "stack", words: ["pilha"], definition: "A memória onde ficam as chamadas de função em andamento. Chamadas demais a estouram (stack overflow)." },
  { id: "memory", words: ["memória"], definition: "Onde o programa guarda os dados enquanto roda. Se ninguém devolve o que usou, ela acaba." },
  { id: "pointer", words: ["ponteiro", "ponteiros"], definition: "Uma variável que guarda o endereço de outro dado na memória." },
  { id: "cache", words: ["cache"], definition: "Uma cópia guardada de um resultado, para não precisar calcular ou buscar de novo." },
  { id: "query", words: ["consulta", "consultas", "query"], definition: "Um pedido feito ao banco de dados, geralmente escrito em SQL." },
  { id: "sql", words: ["sql"], definition: "Linguagem para pedir e alterar dados em bancos relacionais (tabelas)." },
  { id: "parameter", words: ["parâmetro", "parâmetros"], definition: "Um valor passado separado do comando. Em SQL, impede que o texto do usuário vire código." },
  { id: "injection", words: ["injeção", "injection"], definition: "Ataque em que o texto do usuário é executado como comando (SQL, HTML ou do sistema)." },
  { id: "xss", words: ["xss"], definition: "Cross-site scripting: o site mostra um script escrito por um atacante e o navegador o executa." },
  { id: "hash", words: ["hash"], definition: "Uma \"impressão digital\" de um texto. Para senhas, use um hash lento com sal, como bcrypt." },
  { id: "dns", words: ["dns"], definition: "O sistema que traduz nomes como site.com para o endereço IP do servidor." },
  { id: "ip", words: ["ip"], definition: "O endereço numérico de um computador na rede, como 192.168.0.10." },
  { id: "tcp", words: ["tcp"], definition: "Protocolo que entrega os dados inteiros e na ordem, conferindo e reenviando o que se perdeu." },
  { id: "http", words: ["http", "https"], definition: "O protocolo da web: o navegador pede uma página e o servidor responde. HTTPS é a versão criptografada." },
  { id: "latency", words: ["latência"], definition: "O tempo que uma mensagem leva para ir e voltar pela rede." },
  { id: "timeout", words: ["timeout", "tempo limite"], definition: "Quanto tempo esperar por uma resposta antes de desistir." },
  { id: "packet", words: ["pacote", "pacotes"], definition: "Um pedaço de uma mensagem enviada pela rede. Mensagens grandes viram muitos pacotes." },
  { id: "cors", words: ["cors"], definition: "Regra do navegador que só deixa um site chamar outro servidor se esse servidor permitir." },
  { id: "race", words: ["condição de corrida", "atômica", "atômico"], definition: "Quando duas tarefas mexem no mesmo dado ao mesmo tempo. Uma operação atômica acontece inteira, sem ninguém entrar no meio." },
  { id: "deadlock", words: ["deadlock", "trava", "travas"], definition: "Duas tarefas esperando uma pela outra para sempre." },
  { id: "promise", words: ["promessa", "callback"], definition: "Um valor que chega depois (assíncrono). O código que depende dele espera a promessa ou roda no callback." },
  { id: "regex", words: ["regex", "expressão regular"], definition: "Um padrão para procurar texto, como ^\\d{5}-\\d{3}$ para um CEP." },
  { id: "git", words: ["git", "merge", "branch", "commit"], definition: "Git guarda o histórico do código. Um branch é uma linha de trabalho; merge junta duas; commit é um ponto salvo." },
  { id: "conflict", words: ["conflito", "conflitos"], definition: "Quando duas pessoas mudam a mesma linha. O Git marca com <<<<<<< e pede para escolher." },
  { id: "float", words: ["ponto flutuante", "decimais", "float"], definition: "O jeito do computador guardar números com vírgula. É aproximado: 0,1 + 0,2 dá 0,30000000000000004." },
  { id: "stream", words: ["stream", "pedaços"], definition: "Ler ou enviar dados aos poucos, em pedaços, em vez de tudo de uma vez." },
  { id: "backoff", words: ["backoff"], definition: "Esperar cada vez mais entre uma tentativa e outra quando algo falha." },
  { id: "bigo", words: ["big-o", "o(n)", "o(log n)", "o(n²)"], definition: "Uma forma de dizer quanto o trabalho cresce quando a entrada cresce." },
];

export const GLOSSARY_UI = {
  title: "GLOSSÁRIO",
  open: "Glossário",
  intro: "Palavras técnicas que aparecem nas lições. Nas explicações, as palavras sublinhadas mostram a definição ao tocar.",
};
