/**
 * Second lesson of every species, so the daily review does not repeat. Same
 * format as lessons.ts; ids end in "#2" and their explanation is in
 * LESSON_WHY under the same id.
 */
import type { Lesson } from "./lessons";

const L = (speciesId: string, language: Lesson["language"], lines: string[], badLine: number, fix: string): Lesson => ({
  id: `${speciesId}#2`,
  speciesId,
  language,
  lines,
  badLine,
  fix,
});

// prettier-ignore
export const MORE_LESSONS: readonly Lesson[] = [
  L("typobit", "js", ["const items = [1, 2, 3];", "console.log(items.lenght);"], 1, "console.log(items.length);"),
  L("typoworm", "js", ["function soma(a, b) {", "  return a + b;", "}", "soma(2, 3;"], 3, "soma(2, 3);"),
  L("syntaxwyrm", "js", ["const nomes = [", "  \"Ana\",", "  \"Bia\"", "  \"Caio\",", "];"], 2, "  \"Bia\","),
  L("mergefly", "git", ["git switch feature", "git commit -am \"novo botao\"", "git push --force"], 2, "git push"),
  L("regexorpion", "js", ["const cep = /\\d{5}-\\d{3}/;", "cep.test(\"12345-678xyz\"); // true?!"], 0, "const cep = /^\\d{5}-\\d{3}$/;"),
  L("nullit", "js", ["const config = loadConfig();", "const port = config.server.port;"], 1, "const port = config?.server?.port ?? 3000;"),
  L("nullpointer", "js", ["const user = users[0];", "return user.name.toUpperCase();"], 1, "return user?.name?.toUpperCase() ?? \"\";"),
  L("offbyone", "js", ["const last = items[items.length];"], 0, "const last = items[items.length - 1];"),
  L("fencepost", "js", ["// paginas de 10 itens", "const pages = Math.floor(total / 10);"], 1, "const pages = Math.ceil(total / 10);"),
  L("floatfly", "js", ["let saldo = 0.1;", "saldo += 0.2;", "if (saldo === 0.3) aprovar();"], 2, "if (Math.round(saldo * 100) === 30) aprovar();"),
  L("roundrot", "js", ["const parcela = Number((100 / 3).toFixed(2));", "const total = parcela * 3; // 99.99"], 1, "const ultima = 100 - parcela * 2; // a ultima leva a diferenca"),
  L("leaklet", "js", ["function abrirTela() {", "  setInterval(atualizar, 1000);", "}"], 1, "  timer = setInterval(atualizar, 1000); // e clearInterval(timer) ao fechar"),
  L("leakroach", "js", ["const logs = [];", "app.use((req) => logs.push(req));"], 1, "app.use((req) => logger.write(req.url));"),
  L("heapocalypse", "js", ["const dados = await lerArquivo(\"10GB.csv\");", "processar(dados);"], 0, "for await (const linha of lerLinhas(\"10GB.csv\")) processar(linha);"),
  L("segfaultula", "c", ["int v[3] = {1, 2, 3};", "v[3] = 4;"], 1, "v[2] = 4;"),
  L("stackmantis", "js", ["function fib(n) {", "  return fib(n - 1) + fib(n - 2);", "}"], 1, "  return n < 2 ? n : fib(n - 1) + fib(n - 2);"),
  L("racemite", "js", ["let saldo = 100;", "await Promise.all([sacar(80), sacar(80)]);", "// os dois saques veem saldo 100"], 1, "await sacar(80); await sacar(80); // um de cada vez"),
  L("deadlocust", "js", ["await tarefaA.esperar(tarefaB);", "await tarefaB.esperar(tarefaA);"], 1, "await tarefaB.terminar(); // ninguem espera em circulo"),
  L("heisenbug", "js", ["let resultado;", "setTimeout(() => (resultado = 42), 0);", "console.log(resultado);"], 2, "setTimeout(() => console.log(resultado), 0);"),
  L("timeoutick", "js", ["const res = await fetch(url);", "// sem limite: pode esperar para sempre"], 0, "const res = await fetch(url, { signal: AbortSignal.timeout(5000) });"),
  L("packetfly", "js", ["for (let i = 0; i < 3; i++) {", "  try { return await enviar(); } catch {}", "}"], 1, "  try { return await enviar(); } catch { await esperar(2 ** i * 100); }"),
  L("lagmoth", "js", ["const fotos = await api.fotos();", "mostrar(fotos); // 50 MB de imagens"], 0, "const fotos = await api.fotos({ tamanho: \"miniatura\" });"),
  L("dnsnail", "js", ["fetch(\"http://192.168.0.10/api\");", "// o servidor mudou de IP"], 0, "fetch(\"https://api.meusite.com/api\");"),
  L("corsbee", "js", ["app.use(cors({ origin: \"*\", credentials: true }));"], 0, "app.use(cors({ origin: \"https://meusite.com\", credentials: true }));"),
  L("injectick", "sql", ["const q = \"SELECT * FROM produtos WHERE preco < \" + max;", "db.query(q);"], 0, "const q = \"SELECT * FROM produtos WHERE preco < ?\"; // e db.query(q, [max])"),
  L("injecthorn", "js", ["exec(\"ping \" + req.query.host);"], 0, "execFile(\"ping\", [req.query.host]);"),
  L("xssquito", "js", ["link.href = req.query.next;"], 0, "link.href = urlSegura(req.query.next); // so http(s) do proprio site"),
  L("spinloop", "js", ["while (!arquivo.pronto()) {}", "ler(arquivo);"], 0, "await arquivo.quandoPronto();"),
  L("infiniloop", "js", ["for (let i = 10; i > 0; i++) {", "  contagem(i);", "}"], 0, "for (let i = 10; i > 0; i--) {"),
  L("nplusone", "sql", ["for (const id of ids) {", "  db.query(\"SELECT * FROM pedidos WHERE id = ?\", [id]);", "}"], 1, "db.query(\"SELECT * FROM pedidos WHERE id IN (?)\", [ids]);"),
  L("cachemoth", "js", ["const cache = new Map();", "function preco(id) {", "  return cache.get(id) ?? buscar(id);", "}"], 2, "  if (!cache.has(id)) cache.set(id, buscar(id)); return cache.get(id);"),
  L("cachequeen", "js", ["res.setHeader(\"Cache-Control\", \"public, max-age=86400\");", "res.json(dadosDoUsuario);"], 0, "res.setHeader(\"Cache-Control\", \"private, no-store\");"),
  L("pixelmite", "css", [".botao {", "  font-size: 13.5px;", "}"], 1, "  font-size: 14px;"),
  L("overflowasp", "css", [".modal {", "  height: 600px;", "}"], 1, "  max-height: 90vh; overflow-y: auto;"),
  L("flickerfly", "js", ["{lista.map((item) => (", "  <Linha key={Math.random()} item={item} />", "))}"], 1, "  <Linha key={item.id} item={item} />"),
  L("y2kbeetle", "c", ["int32_t segundos = time(NULL);", "// em 2038 o numero nao cabe mais"], 0, "int64_t segundos = time(NULL);"),
  L("zeroday", "js", ["const hash = md5(senha);", "salvar(usuario, hash);"], 0, "const hash = await bcrypt.hash(senha, 12);"),
  L("markmoth", "js", ["// o programa travou", "reiniciarTudo();"], 1, "lerLog(); reproduzir(); corrigir(); // ache a causa"),
];
