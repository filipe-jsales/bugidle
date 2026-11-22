/** Player text for the house categories and each milestone. Ids match game/housing.ts. */
import type { HouseCategory } from "../game/housing";

export interface EraText {
  name: string;
  year: string;
  description: string;
}

export interface CategoryText {
  name: string;
  /** One line under the tab. */
  short: string;
  intro: string;
  eras: Record<string, EraText>;
}

export const HOUSE_CATEGORY_TEXT: Record<HouseCategory, CategoryText> = {
  history: {
    name: "Histórica",
    short: "a evolução do hardware",
    intro:
      "A casa que guarda a evolução da computação, da válvula ao celular. Cada passo dobra a produção, como na Lei de Moore: por décadas, o número de transistores num chip dobrou mais ou menos a cada dois anos.",
    eras: {
      vacuumTube: { name: "Válvulas", year: "1946", description: "O ENIAC ocupava uma sala, tinha cerca de 17 mil válvulas e queimava algumas por dia. Programar era religar cabos." },
      transistor: { name: "Transistor", year: "1947", description: "Criado no Bell Labs, faz o papel da válvula sendo menor, mais frio e muito mais confiável. É a peça de todo chip." },
      integratedCircuit: { name: "Circuito integrado", year: "1958", description: "Vários transistores feitos juntos num único pedaço de silício, em vez de soldados um a um." },
      microprocessor: { name: "Microprocessador", year: "1971", description: "O Intel 4004 coloca um processador inteiro num chip só, com 2.300 transistores." },
      personalComputer: { name: "Computador pessoal", year: "1977", description: "Computadores baratos o bastante para uma mesa de casa. Teclado, monitor e disquete viram coisa comum." },
      web: { name: "World Wide Web", year: "1991", description: "Tim Berners-Lee cria no CERN as páginas ligadas por links, o endereço (URL) e o HTML." },
      smartphone: { name: "Smartphone", year: "2007", description: "Um computador no bolso, com tela de toque, internet o tempo todo e lojas de aplicativos." },
    },
  },
  languages: {
    name: "Linguagens",
    short: "como falamos com a máquina",
    intro: "A casa das linguagens de programação. Cada uma nasceu para resolver um problema da época. Bugs aqui aprendem mais: rende menos moedas e bem mais XP.",
    eras: {
      assembly: { name: "Assembly", year: "1949", description: "Instruções da máquina com nomes curtos, como MOV e ADD, no lugar de números. Cada processador tem o seu." },
      fortran: { name: "FORTRAN", year: "1957", description: "A primeira linguagem de alto nível popular. O compilador transforma fórmulas matemáticas em código de máquina." },
      cobol: { name: "COBOL", year: "1959", description: "Feita para empresas, com comandos parecidos com o inglês. Ainda roda em muitos bancos hoje." },
      c: { name: "C", year: "1972", description: "Criada no Bell Labs para reescrever o Unix. Rápida e próxima do hardware, é a base de sistemas operacionais até hoje." },
      python: { name: "Python", year: "1991", description: "Fácil de ler, com muita coisa pronta. Virou a linguagem preferida para dados, automação e IA." },
      javascript: { name: "JavaScript", year: "1995", description: "Criada em cerca de 10 dias para dar vida às páginas do navegador. Hoje roda também em servidores." },
      rust: { name: "Rust", year: "2015", description: "Segurança de memória sem coletor de lixo: o compilador recusa o código que causaria vazamentos e corridas de dados." },
    },
  },
  cloud: {
    name: "Nuvem",
    short: "computadores alugados",
    intro: "A casa da nuvem: rodar programas nos computadores de outra pessoa, pagando pelo uso. O armazém aqui é elástico e guarda o dobro.",
    eras: {
      timeSharing: { name: "Tempo compartilhado", year: "1961", description: "Vários usuários dividem um mesmo mainframe por terminais, cada um com uma fatia do tempo. É a ideia original da nuvem." },
      datacenter: { name: "Data center", year: "1990", description: "Salas refrigeradas cheias de servidores, com energia e rede de reserva para nunca parar." },
      virtualization: { name: "Virtualização", year: "1999", description: "Uma máquina física roda várias máquinas virtuais isoladas, cada uma achando que está sozinha." },
      iaas: { name: "Infraestrutura como serviço", year: "2006", description: "Servidores e armazenamento alugados por hora pela internet. Ninguém precisa mais comprar máquina para começar." },
      containers: { name: "Contêineres", year: "2013", description: "O programa vai empacotado com tudo de que precisa. Sobe em segundos e roda igual em qualquer lugar." },
      orchestration: { name: "Orquestração", year: "2014", description: "Um sistema cuida de milhares de contêineres: reinicia os que caem e cria mais quando o tráfego aumenta." },
      serverless: { name: "Serverless", year: "2014", description: "Você envia só a função e paga por execução. O servidor existe, mas não é mais problema seu." },
    },
  },
  databases: {
    name: "Bancos de Dados",
    short: "guardar e achar dados",
    intro: "A casa dos bancos de dados, de furos em papel a vetores. Rende um pouco mais e guarda mais antes de lotar.",
    eras: {
      punchedCards: { name: "Cartões perfurados", year: "1890", description: "No censo dos EUA, as máquinas de Hollerith contavam furos em cartões. Os dados já eram lidos por máquina." },
      magneticTape: { name: "Fita magnética", year: "1951", description: "Arquivos gravados em fita. Para achar um registro era preciso ler tudo o que vinha antes, em sequência." },
      hierarchical: { name: "Banco hierárquico", year: "1966", description: "Registros organizados em árvore, de pai para filho. Usado pela IBM no programa Apollo." },
      relational: { name: "Modelo relacional", year: "1970", description: "Edgar Codd propõe tabelas com linhas e colunas, ligadas por chaves. A ideia domina até hoje." },
      sql: { name: "SQL", year: "1974", description: "Uma linguagem para pedir dados dizendo o que você quer, não como buscar. O banco escolhe o caminho mais rápido." },
      nosql: { name: "NoSQL", year: "2009", description: "Documentos, chave-valor e grafos espalhados por muitas máquinas. Troca parte da rigidez das tabelas por escala." },
      vectorDb: { name: "Banco vetorial", year: "2020", description: "Guarda vetores de números que representam textos e imagens e acha os mais parecidos. Usado em busca e IA." },
    },
  },
  networks: {
    name: "Redes",
    short: "computadores conversando",
    intro: "A casa das redes, da primeira mensagem entre duas universidades ao 5G. Rende mais moedas e um pouco menos de XP.",
    eras: {
      arpanet: { name: "ARPANET", year: "1969", description: "A primeira mensagem entre UCLA e Stanford deveria ser LOGIN. O sistema caiu depois de LO." },
      ethernet: { name: "Ethernet", year: "1973", description: "Um cabo liga os computadores da mesma sala. Quando dois falam ao mesmo tempo, cada um espera um tempo sorteado e tenta de novo." },
      tcpip: { name: "TCP/IP", year: "1983", description: "Regras comuns para dividir mensagens em pacotes e garantir que cheguem inteiras e na ordem. Nasce a internet." },
      dns: { name: "DNS", year: "1983", description: "A lista telefônica da internet: traduz nomes como site.com para o endereço IP do servidor." },
      wifi: { name: "Wi-Fi", year: "1997", description: "Rede sem fio por ondas de rádio. O computador deixa de precisar de cabo." },
      cdn: { name: "CDN", year: "1998", description: "Cópias do conteúdo em servidores espalhados pelo mundo, perto de quem acessa. Menos distância, menos espera." },
      fiveG: { name: "5G", year: "2019", description: "Internet móvel com espera muito baixa e muitos aparelhos conectados ao mesmo tempo na mesma área." },
    },
  },
  security: {
    name: "Cibersegurança",
    short: "proteger sistemas e dados",
    intro: "A casa da segurança, da primeira senha à confiança zero. Rende um pouco mais de moedas e de XP.",
    eras: {
      password: { name: "Senha", year: "1961", description: "O sistema de tempo compartilhado do MIT cria senhas para separar os arquivos de cada usuário." },
      firstVirus: { name: "Primeiro vírus", year: "1971", description: "O Creeper pulava entre computadores da ARPANET mostrando uma mensagem. O Reaper foi criado para apagá-lo: o primeiro antivírus." },
      publicKey: { name: "Chave pública", year: "1977", description: "Duas chaves: a pública tranca e só a privada abre. Permite conversar em segredo sem combinar uma senha antes." },
      firewall: { name: "Firewall", year: "1988", description: "Um filtro entre a rede interna e a internet que só deixa passar o tráfego permitido." },
      https: { name: "HTTPS", year: "1995", description: "A conversa entre navegador e site vai criptografada. É o cadeado na barra de endereço." },
      twoFactor: { name: "Dois fatores", year: "anos 2000", description: "Além da senha, algo que só você tem, como um código no celular. Senha vazada sozinha não basta." },
      zeroTrust: { name: "Confiança zero", year: "2010", description: "Estar dentro da rede da empresa não prova nada: cada pedido é verificado, sempre." },
    },
  },
  ai: {
    name: "Inteligência Artificial",
    short: "máquinas que aprendem",
    intro: "A casa da IA, da pergunta de Turing aos transformers. A mais cara, e a que mais rende moedas e XP.",
    eras: {
      turingTest: { name: "Teste de Turing", year: "1950", description: "Alan Turing pergunta se máquinas podem pensar e propõe um teste: conversar sem saber se do outro lado há uma pessoa." },
      perceptron: { name: "Perceptron", year: "1958", description: "O primeiro neurônio artificial que aprende, ajustando pesos a cada exemplo certo ou errado." },
      expertSystems: { name: "Sistemas especialistas", year: "1972", description: "Centenas de regras SE ... ENTÃO escritas por especialistas, como as suas regras de automação." },
      backprop: { name: "Retropropagação", year: "1986", description: "Redes com várias camadas aprendem medindo o erro na saída e corrigindo os pesos de trás para frente." },
      deepBlue: { name: "Deep Blue", year: "1997", description: "Um computador vence o campeão mundial de xadrez analisando milhões de jogadas por segundo." },
      deepLearning: { name: "Aprendizado profundo", year: "2012", description: "Redes neurais grandes treinadas em placas de vídeo passam a reconhecer imagens melhor que tudo antes." },
      transformer: { name: "Transformer", year: "2017", description: "Uma rede que presta atenção em todas as palavras ao mesmo tempo. É a base dos grandes modelos de linguagem." },
    },
  },
};

export const HOUSES_UI = {
  tabLocked: (badge: string) => `precisa do ${badge}`,
  timeline: "LINHA DO TEMPO",
  timelineHint: "A história desta área, do mais antigo ao mais novo. Os marcos em dourado sua casa já alcançou; o roxo é o próximo.",
  current: "atual",
  next: "próximo",
  perks: { coins: (m: number) => `moedas x${m}`, xp: (m: number) => `XP x${m}`, storage: (m: number) => `armazém x${m}` },
  xpPerMinute: "XP/min",
  production: (m: number) => `produção x${m}`,
};
