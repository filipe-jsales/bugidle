/** Player text for the labs (ids match game/data/labs.ts). */
import type { LabTopic } from "../game/data/labs";

export interface LabText {
  prompt: string;
  explain: string;
  /** Prose options for choice questions without code options (right one first, as in the data). */
  options?: readonly string[];
  /** Prose pieces for order questions without code pieces, in the right order. */
  items?: readonly string[];
}

export const LAB_TOPIC_TEXT: Record<LabTopic, { name: string; intro: string; place: string }> = {
  git: { name: "Laboratório de Git", intro: "Branches, commits e conflitos de merge, os bugs favoritos do Mergefly.", place: "rota do Mergefly" },
  sql: { name: "Laboratório de SQL", intro: "Escolha a consulta que devolve as linhas certas da tabela.", place: "casa de Bancos de Dados" },
  network: { name: "Laboratório de Redes", intro: "Siga um pacote pela rede: DNS, TCP, HTTP e os códigos de resposta.", place: "casa de Redes" },
  security: { name: "Laboratório de Segurança", intro: "Ache a injeção e proteja o formulário dos ataques do Injectick e do Xssquito.", place: "Injectick e Xssquito" },
};

export const LAB_TEXT: Record<string, LabText> = {
  "git-conflict": {
    prompt: "Dois branches mudaram a mesma linha. Você quer manter a cor do branch tema-novo. Como o arquivo deve ficar depois de resolver o conflito?",
    explain: "Resolver um conflito é deixar só o código final, sem as marcas <<<<<<<, ======= e >>>>>>>. Depois é só fazer git add e git commit.",
  },
  "git-flow": {
    prompt: "Ordene os comandos para criar um branch, salvar o trabalho e enviar para o servidor.",
    explain: "Primeiro cria e entra no branch (switch -c), depois marca o arquivo (add), salva um ponto na história (commit) e envia (push).",
  },
  "git-branch": {
    prompt: "Qual comando cria um branch novo chamado feature e já muda para ele?",
    explain: "git switch -c cria (c de create) e muda para o branch. merge junta branches, commit salva e push envia.",
  },
  "git-graph": {
    prompt: "No desenho da história, o que é o commit E?",
    explain: "E tem dois pais (B e D): é um commit de merge, que juntou o trabalho do branch feature no main.",
    options: ["Um merge que juntou o branch feature no main", "Um commit que foi apagado", "Um conflito que ficou sem solução", "O começo de um branch novo"],
  },
  "sql-and": {
    prompt: "Quais alunos da turma A tiraram 8 ou mais? Escolha a consulta que devolve exatamente Ana e Caio.",
    explain: "AND exige as duas condições ao mesmo tempo. Com OR, entraria qualquer aluno da turma A ou qualquer nota 8+, e Duda apareceria.",
  },
  "sql-group": {
    prompt: "Qual consulta mostra quantos alunos há em cada turma?",
    explain: "GROUP BY junta as linhas da mesma turma e COUNT(*) conta quantas há em cada grupo: A tem 3, B tem 2.",
  },
  "sql-order": {
    prompt: "Qual consulta lista os alunos da maior nota para a menor?",
    explain: "ORDER BY ordena; DESC (descendente) começa pelo maior. Sem DESC a ordem é do menor para o maior.",
  },
  "sql-build": {
    prompt: "Monte a consulta: o nome dos aprovados (nota 7 ou mais), em ordem alfabética.",
    explain: "A ordem das partes do SQL é fixa: SELECT (o quê), FROM (de onde), WHERE (quais linhas) e ORDER BY (em que ordem).",
  },
  "net-path": {
    prompt: "Você digitou https://site.com e apertou Enter. Ordene o caminho até a página aparecer.",
    explain: "Primeiro o nome vira IP (DNS), depois a conexão (TCP), a criptografia (TLS), o pedido (HTTP) e por fim a resposta.",
    items: [
      "O navegador pergunta ao DNS o IP de site.com",
      "Abre a conexão TCP com o servidor (o aperto de mão)",
      "Combina a criptografia do HTTPS (TLS)",
      "Envia o pedido HTTP: GET /",
      "O servidor responde 200 OK com a página",
    ],
  },
  "net-dns": {
    prompt: "O que o DNS devolve quando o navegador pergunta por site.com?",
    explain: "O DNS é a lista telefônica da internet: traduz o nome para o endereço IP do servidor. A página vem depois, pelo HTTP.",
    options: ["O endereço IP do servidor", "A página HTML pronta", "A senha do Wi-Fi", "Uma cópia do site inteiro"],
  },
  "net-tcp": {
    prompt: "Por que as páginas da web usam TCP?",
    explain: "O TCP confere cada pacote e reenvia os que se perdem, entregando tudo inteiro e na ordem. Sem isso, a página chegaria com buracos.",
    options: ["Ele confere e reenvia pacotes perdidos, entregando tudo na ordem", "Ele é o mais rápido porque não confere nada", "Ele guarda a senha do usuário", "Ele escolhe o servidor mais perto"],
  },
  "net-404": {
    prompt: "O servidor respondeu 404. O que aconteceu?",
    explain: "Códigos 4xx são erro do pedido: 404 quer dizer que o endereço não existe no servidor. Erros 5xx são falhas do próprio servidor.",
    options: ["O endereço pedido não existe no servidor", "O servidor caiu", "A senha está errada", "Deu tudo certo"],
  },
  "sec-injection": {
    prompt: "O código monta a consulta colando o nome digitado. Qual destes nomes é um ataque de injeção?",
    explain: "' OR '1'='1 fecha as aspas e adiciona uma condição sempre verdadeira: a consulta devolve todos os usuários. Com parâmetros (?) isso vira só um nome estranho.",
  },
  "sec-xss": {
    prompt: "Um comentário escrito por um visitante vai aparecer na página. Qual linha é segura contra XSS?",
    explain: "textContent mostra o texto como texto. innerHTML, outerHTML e document.write interpretam HTML e executariam um <script> escondido no comentário.",
  },
  "sec-form": {
    prompt: "Ordene os passos para tratar um formulário com segurança.",
    explain: "Nunca confie na entrada: valide primeiro, use parâmetros no banco e escape o HTML na hora de mostrar.",
    items: ["Receber o texto do formulário", "Validar o formato (tamanho e caracteres aceitos)", "Passar o texto como parâmetro para a consulta", "Mostrar o resultado escapando o HTML"],
  },
  "sec-password": {
    prompt: "Qual é o jeito certo de guardar senhas no banco?",
    explain: "Um hash lento com sal (bcrypt, argon2) não pode ser revertido e torna caro testar senhas. MD5 é rápido e quebrado; texto puro vaza tudo.",
    options: ["Hash lento com sal, como bcrypt", "Texto puro, para poder recuperar", "MD5, que é rápido", "Criptografia com uma chave escrita no código"],
  },
};

export const LABS_UI = {
  title: "LABORATÓRIOS",
  intro: "Desafios curtos por assunto. Cada um paga moedas na primeira vez que você acerta.",
  progress: (solved: number, total: number) => `${solved}/${total} resolvidos`,
  open: "Abrir",
  solved: "Resolvido",
  tryAgain: "Tentar de novo",
  right: "Certo!",
  wrong: "Não é essa. Leia a explicação e tente de novo.",
  reward: (coins: string) => `+${coins} moedas`,
  back: "Voltar aos desafios",
  table: (name: string) => `Tabela ${name}`,
};
