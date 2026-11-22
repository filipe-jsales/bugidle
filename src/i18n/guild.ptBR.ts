/** Guild of Algorithms texts (pt-BR). */

export const CHAMPION_TEXT: Record<string, { name: string; description: string }> = {
  bubbleSort: { name: "Bubble Sort", description: "Compara vizinhos e troca os fora de ordem, passando pela lista várias vezes. Simples, mas lento em listas grandes." },
  insertionSort: { name: "Insertion Sort", description: "Insere cada item no lugar certo, como quem arruma cartas na mão. Muito rápido quando a lista já está quase em ordem." },
  mergeSort: { name: "Merge Sort", description: "Divide a lista ao meio, ordena cada metade e junta. Sempre O(n log n), mas precisa de memória extra do tamanho da lista." },
  quickSort: { name: "Quick Sort", description: "Escolhe um pivô e separa menores e maiores. Rápido na média, mas cai para O(n²) quando a lista já vem ordenada." },
  heapSort: { name: "Heap Sort", description: "Monta uma pilha de prioridade (heap) e tira sempre o maior. O(n log n) e quase sem memória extra." },
  countingSort: { name: "Counting Sort", description: "Conta quantas vezes cada valor aparece. Linear, mas só funciona quando os valores cabem numa faixa pequena." },
  linearSearch: { name: "Busca Linear", description: "Olha um item de cada vez até achar. Funciona em qualquer lista, mas demora em listas grandes." },
  binarySearch: { name: "Busca Binária", description: "Olha o meio e descarta metade a cada passo. Muito rápida, mas a lista precisa estar ordenada." },
  hashTable: { name: "Tabela Hash", description: "Monta um índice uma vez e depois acha qualquer item em um passo. Ótima para muitas buscas, gasta memória." },
};

export const RAID_TEXT: Record<string, { name: string; description: string }> = {
  sortGrades: { name: "Ordenar 100 notas", description: "Uma lista pequena: qualquer algoritmo resolve." },
  findName: { name: "Achar um nome", description: "Uma busca numa lista de 5 mil nomes fora de ordem." },
  almostSorted: { name: "Lista quase em ordem", description: "20 mil itens, quase todos já no lugar certo." },
  leaderboard: { name: "Ranking de 50 mil jogadores", description: "Uma lista grande e embaralhada." },
  phoneBook: { name: "Lista telefônica", description: "200 buscas num catálogo de 1 milhão de nomes já ordenados." },
  tinyMemory: { name: "Memória apertada", description: "Ordenar 50 mil itens com só 64 posições de memória extra." },
  alreadySorted: { name: "Lista já ordenada", description: "50 mil itens que já estão em ordem, com pouca memória." },
  manyLookups: { name: "100 mil buscas", description: "100 mil buscas numa lista de 100 mil itens fora de ordem." },
  censusAges: { name: "Idades do censo", description: "Ordenar as idades de 1 milhão de pessoas (de 0 a 120 anos)." },
};

export const GUILD_UI = {
  title: "GUILDA DE ALGORITMOS",
  navLabel: "Guilda",
  intro:
    "Seus campeões são algoritmos. Cada missão tem um tamanho n e algumas características. A missão dura o número de operações que o algoritmo faz para aquela entrada, então escolher o algoritmo certo é tudo. Big-O descreve como o tempo cresce quando n cresce.",
  champions: "CAMPEÕES",
  raids: "MISSÕES",
  recruit: "Recrutar",
  owned: "na guilda",
  best: "melhor",
  average: "médio",
  worst: "pior",
  memory: "memória",
  send: "Enviar",
  stop: "Parar",
  running: (name: string) => `Em missão: ${name}`,
  autoRepeat: "Repetir a missão sozinha",
  locked: "Conclua a missão anterior",
  size: (n: string) => `n = ${n}`,
  queries: (q: string) => `${q} buscas`,
  traits: { nearlySorted: "quase ordenada", sorted: "já ordenada", smallRange: "faixa pequena de valores" },
  memoryLimit: (cells: string) => `memória extra: ${cells}`,
  unlimited: "sem limite",
  reward: (coins: string) => `${coins} moedas`,
  firstClear: "1a vez: x3",
  clears: (n: number) => `concluída ${n}x`,
  ops: (ops: string) => `${ops} operações`,
  reasons: { wrongKind: "não é deste tipo", cannot: "não serve para estes dados", memory: "não cabe na memória" },
  suggestion: "mais rápido que você tem",
};
