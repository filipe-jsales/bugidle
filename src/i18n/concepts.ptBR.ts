/** Player text for the "Detetive de Conceitos" mini game (ids match game/data/concepts.ts). */
import type { ConceptCategory, ConceptUse } from "../game/data/concepts";

export interface ConceptText {
  name: string;
  /** Other answers accepted (accents and case do not matter). */
  aliases: readonly string[];
  /** Fourth clue: a riddle that does not say the name. */
  riddle: string;
  what: string;
  why: string;
  where: string;
}

export const CATEGORY_TEXT: Record<ConceptCategory, string> = {
  os: "Sistema operacional",
  language: "Linguagem",
  tool: "Ferramenta",
  data: "Dados",
  web: "Web",
  security: "Segurança",
  hardware: "Hardware",
  fundamental: "Fundamento",
  infra: "Infraestrutura",
};

export const USE_TEXT: Record<ConceptUse, string> = {
  servers: "Servidores",
  phones: "Celulares",
  web: "Sites e apps",
  games: "Jogos",
  science: "Ciência e dados",
  companies: "Empresas",
  everywhere: "Em todo programa",
  devices: "Aparelhos e máquinas",
  teams: "Trabalho em equipe",
  cloud: "Nuvem",
};

export const CONCEPT_TEXT: Record<string, ConceptText> = {
  linux: {
    name: "Linux",
    aliases: ["gnu/linux", "gnu linux"],
    riddle: "Um estudante finlandês criou o núcleo e o mundo inteiro ajudou. Tem um pinguim como mascote.",
    what: "Um sistema operacional livre: o programa que controla o computador e deixa os outros programas rodarem.",
    why: "É gratuito, aberto e muito estável, então qualquer um pode usar, estudar e mudar.",
    where: "Na maioria dos servidores da internet, no Android, em supercomputadores, roteadores e até em carros.",
  },
  git: {
    name: "Git",
    aliases: [],
    riddle: "Guarda cada versão do seu código e deixa várias pessoas mexerem ao mesmo tempo. Fala em branches, commits e merges.",
    what: "Um sistema de controle de versão: registra a história de todas as mudanças num projeto.",
    why: "Para voltar atrás quando algo quebra, trabalhar em paralelo em branches e juntar o trabalho da equipe.",
    where: "Em praticamente todo projeto de software, inclusive no GitHub e no GitLab.",
  },
  python: {
    name: "Python",
    aliases: [],
    riddle: "Linguagem com nome de grupo de comédia britânico e mascote de cobra. Usa espaços para organizar o código.",
    what: "Uma linguagem de programação fácil de ler, com muita coisa pronta em bibliotecas.",
    why: "É ótima para começar a programar e para automatizar tarefas, analisar dados e treinar IA.",
    where: "Ciência de dados, inteligência artificial, automação, sites (Django) e no ensino.",
  },
  javascript: {
    name: "JavaScript",
    aliases: ["js", "java script"],
    riddle: "Criada em cerca de 10 dias para dar vida às páginas. Roda dentro de todo navegador.",
    what: "A linguagem de programação dos navegadores, que deixa as páginas interativas.",
    why: "Sem ela, os sites seriam só texto parado: botões, jogos e animações dependem dela.",
    where: "Em quase todo site, em apps de celular e computador e em servidores com Node.js. Este jogo é feito com ela.",
  },
  html: {
    name: "HTML",
    aliases: ["hypertext markup language"],
    riddle: "Não é bem uma linguagem de programação: marca títulos, parágrafos e links com etiquetas entre < e >.",
    what: "A linguagem de marcação que descreve a estrutura de uma página: títulos, textos, imagens e links.",
    why: "É o esqueleto de toda página da web; o navegador lê o HTML para saber o que mostrar.",
    where: "Em todo site da internet, em e-mails e em apps feitos com tecnologia web.",
  },
  css: {
    name: "CSS",
    aliases: ["folha de estilo", "folhas de estilo"],
    riddle: "Decide cores, fontes, espaços e onde cada coisa fica na página. O HTML diz o quê; eu digo como fica.",
    what: "A linguagem de estilo das páginas: cores, tamanhos, posições e animações.",
    why: "Separa a aparência do conteúdo, então o mesmo site pode ficar bonito no computador e no celular.",
    where: "Em todo site e app web. Os botões e painéis deste jogo são desenhados com CSS.",
  },
  sql: {
    name: "SQL",
    aliases: ["structured query language"],
    riddle: "Fala com tabelas: SELECT para ler, WHERE para filtrar, ORDER BY para ordenar.",
    what: "A linguagem para guardar, buscar e mudar dados em bancos de dados relacionais.",
    why: "Permite perguntar coisas a milhões de linhas de dados em uma frase e receber a resposta rápido.",
    where: "Em bancos, lojas online, redes sociais, hospitais: quase todo sistema que guarda dados.",
  },
  api: {
    name: "API",
    aliases: ["interface de programacao", "interface de programação de aplicações"],
    riddle: "É o cardápio de um sistema: lista o que outro programa pode pedir e como pedir.",
    what: "Uma interface que um programa oferece para outros programas conversarem com ele.",
    why: "Para juntar sistemas sem precisar conhecer o código por dentro: o app pede, o servidor responde.",
    where: "Em apps de clima, mapas, pagamentos, login com redes sociais: quase todo app usa várias.",
  },
  docker: {
    name: "Docker",
    aliases: ["conteiner", "contêiner", "container", "containers"],
    riddle: "Tem uma baleia que carrega caixas. Empacota o programa com tudo que ele precisa para rodar igual em qualquer lugar.",
    what: "Uma ferramenta de contêineres: empacota um programa com suas dependências num pacote isolado.",
    why: "Acaba com o \"na minha máquina funciona\": o mesmo contêiner roda igual no notebook e no servidor.",
    where: "Em empresas e na nuvem, para publicar sistemas e rodar muitos serviços no mesmo servidor.",
  },
  cloud: {
    name: "Computação em nuvem",
    aliases: ["nuvem", "cloud", "cloud computing"],
    riddle: "Seus arquivos e programas moram em computadores de outra pessoa, e você paga pelo que usar.",
    what: "Usar servidores, armazenamento e programas pela internet, alugados de grandes data centers.",
    why: "Não precisa comprar máquinas: dá para crescer ou diminuir na hora e pagar só o uso.",
    where: "Backup de fotos, streaming de vídeo, e-mail, jogos online e quase todo serviço da internet.",
  },
  firewall: {
    name: "Firewall",
    aliases: ["parede de fogo"],
    riddle: "Fica na porta da rede como um segurança: só deixa passar o tráfego permitido.",
    what: "Um filtro de rede que bloqueia ou libera conexões seguindo regras.",
    why: "Protege computadores e servidores de acessos indesejados vindos da internet.",
    where: "Em roteadores, sistemas operacionais, empresas e servidores na nuvem.",
  },
  algorithm: {
    name: "Algoritmo",
    aliases: ["algorithm", "algoritmos"],
    riddle: "Uma receita de bolo também é um: passos em ordem para resolver um problema.",
    what: "Uma sequência de passos bem definidos para resolver um problema.",
    why: "Todo programa é feito de algoritmos; escolher um bom deixa o programa muito mais rápido.",
    where: "Em tudo: ordenar listas, achar rotas no mapa, recomendar vídeos. A Guilda deste jogo ensina alguns.",
  },
  recursion: {
    name: "Recursão",
    aliases: ["recursao", "recursividade", "recursion"],
    riddle: "Para entender esta pista, leia esta pista. Uma função que chama a si mesma.",
    what: "Quando uma função resolve um problema chamando a si mesma com um pedaço menor dele.",
    why: "Deixa simples problemas que se repetem dentro de si, como pastas dentro de pastas.",
    where: "Em buscas em árvores e pastas, fractais, alguns algoritmos de ordenação como o merge sort.",
  },
  variable: {
    name: "Variável",
    aliases: ["variavel", "variaveis", "variáveis", "variable"],
    riddle: "Uma caixa com etiqueta onde o programa guarda um valor que pode mudar.",
    what: "Um nome que guarda um valor na memória, como pontos = 10.",
    why: "Para o programa lembrar coisas: a vida do bug, suas moedas, o nome do caçador.",
    where: "Em todo programa, em todas as linguagens.",
  },
  loop: {
    name: "Laço",
    aliases: ["laco", "loop", "repetição", "repeticao", "lacos", "laços"],
    riddle: "Repete o mesmo trecho de código enquanto uma condição for verdadeira. For e while são exemplos.",
    what: "Uma estrutura que repete instruções várias vezes.",
    why: "Para não escrever a mesma coisa mil vezes: percorrer listas, contar, esperar algo acontecer.",
    where: "Em todo programa. O próprio jogo roda num laço que atualiza tudo 10 vezes por segundo.",
  },
  array: {
    name: "Vetor",
    aliases: ["array", "lista", "arranjo", "vetores", "arrays"],
    riddle: "Guarda vários valores em fila, cada um numa posição numerada a partir do zero.",
    what: "Uma estrutura que guarda vários valores em sequência, acessados por índice.",
    why: "Para guardar coleções: os bugs da equipe, as notas de uma turma, as letras de uma palavra.",
    where: "Em todo programa. Sua equipe de bugs é um vetor de até 6 posições.",
  },
  compiler: {
    name: "Compilador",
    aliases: ["compiler", "compiladores"],
    riddle: "Tradutor que transforma o código que você escreve em instruções que a máquina entende.",
    what: "Um programa que traduz código de uma linguagem (como C) para linguagem de máquina.",
    why: "O processador só entende números; o compilador deixa a gente escrever em algo parecido com texto.",
    where: "Em linguagens como C, C++, Rust e Go, e em jogos e sistemas operacionais.",
  },
  cpu: {
    name: "Processador",
    aliases: ["cpu", "processador central", "unidade central de processamento", "chip"],
    riddle: "O cérebro do computador: faz bilhões de contas por segundo.",
    what: "O chip que executa as instruções dos programas, uma depois da outra, muito rápido.",
    why: "Sem ele nada roda: cada clique, cálculo e quadro de jogo passa por ele.",
    where: "Em computadores, celulares, videogames, carros e até em máquinas de lavar.",
  },
  ram: {
    name: "Memória RAM",
    aliases: ["ram", "memoria", "memória", "memoria ram"],
    riddle: "Memória rápida e esquecida: guarda o que está aberto agora e se apaga quando a energia acaba.",
    what: "A memória de trabalho do computador, onde ficam os programas e dados em uso.",
    why: "É muito mais rápida que o disco; quanto mais RAM, mais coisas abertas ao mesmo tempo.",
    where: "Em todo computador e celular. Vazamentos de memória, como o Leaklet, enchem a RAM.",
  },
  encryption: {
    name: "Criptografia",
    aliases: ["criptografia", "encryption", "cifra", "criptografar"],
    riddle: "Embaralha a mensagem para que só quem tem a chave consiga ler. É o cadeado do HTTPS.",
    what: "Técnicas para transformar dados em algo ilegível sem a chave certa.",
    why: "Protege senhas, mensagens e pagamentos de quem estiver espiando a rede.",
    where: "Em sites com HTTPS, apps de mensagem, bancos, Wi-Fi e no seu celular.",
  },
  binary: {
    name: "Binário",
    aliases: ["binario", "sistema binario", "sistema binário", "binary", "bits"],
    riddle: "Só dois dígitos, 0 e 1, e mesmo assim representa todos os números, textos e imagens.",
    what: "O sistema de numeração de base 2, que usa só 0 e 1.",
    why: "Os circuitos só sabem dois estados (ligado e desligado), então tudo vira 0 e 1 por dentro.",
    where: "Dentro de todo computador: cada número, letra, foto e som é guardado em bits.",
  },
  http: {
    name: "HTTP",
    aliases: ["https", "protocolo http"],
    riddle: "O protocolo da web: o navegador pede uma página com GET e o servidor responde com um código como 200 ou 404.",
    what: "O protocolo que navegadores e servidores usam para pedir e entregar páginas e dados.",
    why: "Dá uma língua comum para qualquer navegador conversar com qualquer servidor. Com S (HTTPS), é criptografado.",
    where: "Em todo site e na maioria das APIs que os apps usam.",
  },
  terminal: {
    name: "Terminal",
    aliases: ["linha de comando", "console", "shell", "prompt"],
    riddle: "Tela de texto onde você digita comandos em vez de clicar. Este jogo tem um no F2.",
    what: "Um programa onde você controla o computador digitando comandos.",
    why: "É rápido, dá para automatizar tarefas em scripts e controlar servidores de longe.",
    where: "Em servidores, no trabalho de programadores e administradores, e no Linux, macOS e Windows.",
  },
  bug: {
    name: "Bug",
    aliases: ["defeito", "erro", "falha", "bugs"],
    riddle: "Em 1947 uma mariposa presa num relé deu nome a todos eles. Você caça esses aqui.",
    what: "Um erro em um programa que faz ele se comportar diferente do esperado.",
    why: "Entender bugs é metade de programar: achar, reproduzir e corrigir é o trabalho do dia a dia.",
    where: "Em todo software já feito. Cada bicho deste jogo é um tipo de bug de verdade.",
  },
};
