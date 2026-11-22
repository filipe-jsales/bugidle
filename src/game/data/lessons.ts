/**
 * One short lesson per species: a few lines of code that contain that bug, the
 * line where it is, and the corrected line. Used by "Debug to capture", the
 * Bugdex "how to fix", boss code reviews, the daily challenge and the terminal.
 * The explanation text lives in i18n (LESSON_WHY).
 */
export interface Lesson {
  readonly speciesId: string;
  readonly language: "js" | "c" | "css" | "sql" | "git";
  readonly lines: readonly string[];
  /** Index of the line with the bug. */
  readonly badLine: number;
  /** Replacement for the bad line. */
  readonly fix: string;
}

const L = (speciesId: string, language: Lesson["language"], lines: string[], badLine: number, fix: string): Lesson => ({ speciesId, language, lines, badLine, fix });

// prettier-ignore
export const LESSONS: readonly Lesson[] = [
  L("typobit", "js", ["const total = 10;", "console.log(totl);"], 1, "console.log(total);"),
  L("typoworm", "js", ["if (ready) {", "  start();", "// faltou fechar o bloco"], 2, "}"),
  L("syntaxwyrm", "js", ["const user = {", "  name: \"Ana\",", "  age: 30", ";"], 3, "};"),
  L("mergefly", "git", ["<<<<<<< HEAD", "const port = 3000;", "=======", "const port = 8080;", ">>>>>>> feature"], 0, "const port = 8080; // conflito resolvido, marcas apagadas"),
  L("regexorpion", "js", ["const valid = /^(a+)+$/.test(input);"], 0, "const valid = /^a+$/.test(input);"),
  L("nullit", "js", ["let user = null;", "console.log(user.name);"], 1, "console.log(user?.name);"),
  L("nullpointer", "js", ["const item = list.find((x) => x.id === 7);", "item.price += 10;"], 1, "if (item) item.price += 10;"),
  L("offbyone", "js", ["for (let i = 0; i <= items.length; i++) {", "  show(items[i]);", "}"], 0, "for (let i = 0; i < items.length; i++) {"),
  L("fencepost", "js", ["// cerca de 10 metros, um poste por metro", "const posts = meters;"], 1, "const posts = meters + 1;"),
  L("floatfly", "js", ["if (0.1 + 0.2 === 0.3) {", "  pay();", "}"], 0, "if (Math.abs(0.1 + 0.2 - 0.3) < 1e-9) {"),
  L("roundrot", "js", ["let total = 0;", "for (const p of prices) total += p * 0.1;", "charge(total);"], 1, "for (const p of prices) totalCents += Math.round(p * 10);"),
  L("leaklet", "js", ["function open() {", "  window.addEventListener(\"resize\", onResize);", "}", "function close() {", "  hide();", "}"], 4, "  hide(); window.removeEventListener(\"resize\", onResize);"),
  L("leakroach", "js", ["const cache = {};", "function get(id) {", "  cache[id] = load(id);", "  return cache[id];", "}"], 0, "const cache = new LruCache(100);"),
  L("heapocalypse", "js", ["const all = [];", "while (true) all.push(new Array(1e6));"], 1, "for (let i = 0; i < 10; i++) all.push(new Array(1e6));"),
  L("segfaultula", "c", ["int *p = NULL;", "*p = 42;"], 1, "p = malloc(sizeof(int)); *p = 42;"),
  L("stackmantis", "js", ["function count(n) {", "  return count(n - 1) + 1;", "}"], 1, "  return n === 0 ? 0 : count(n - 1) + 1;"),
  L("racemite", "js", ["const views = await db.get(\"views\");", "await db.set(\"views\", views + 1);"], 1, "await db.increment(\"views\"); // atomico"),
  L("deadlocust", "js", ["// tarefa A", "lock(a); lock(b);", "// tarefa B", "lock(b); lock(a);"], 3, "lock(a); lock(b); // mesma ordem nas duas"),
  L("heisenbug", "js", ["let ready = false;", "loadAsync().then(() => (ready = true));", "if (ready) start();"], 2, "loadAsync().then(start);"),
  L("timeoutick", "js", ["const res = await fetch(url, { timeout: 1 });"], 0, "const res = await fetch(url, { timeout: 5000 });"),
  L("packetfly", "js", ["socket.send(bigFile);", "// nada confere se chegou"], 0, "await sendWithRetry(socket, bigFile);"),
  L("lagmoth", "js", ["for (const id of ids) {", "  await fetch(`/api/item/${id}`);", "}"], 1, "  // await Promise.all(ids.map((id) => fetch(`/api/item/${id}`)));"),
  L("dnsnail", "js", ["fetch(\"https://api.exemplo.cm/dados\");"], 0, "fetch(\"https://api.exemplo.com/dados\");"),
  L("corsbee", "js", ["app.get(\"/api\", handler);", "// o navegador bloqueia: falta permissao de CORS"], 0, "app.get(\"/api\", cors({ origin: \"https://meusite.com\" }), handler);"),
  L("injectick", "sql", ["db.query(\"SELECT * FROM users WHERE name = '\" + name + \"'\");"], 0, "db.query(\"SELECT * FROM users WHERE name = ?\", [name]);"),
  L("injecthorn", "sql", ["const sql = `DELETE FROM posts WHERE id = ${req.query.id}`;", "db.run(sql);"], 0, "db.run(\"DELETE FROM posts WHERE id = ?\", [req.query.id]);"),
  L("xssquito", "js", ["comment.innerHTML = userText;"], 0, "comment.textContent = userText;"),
  L("spinloop", "js", ["while (!job.done) {", "  // pergunta de novo, sem parar", "}"], 0, "await job.finished;"),
  L("infiniloop", "js", ["let i = 0;", "while (i < 10) {", "  console.log(i);", "}"], 2, "  console.log(i); i++;"),
  L("nplusone", "js", ["const posts = await db.posts();", "for (const p of posts) p.author = await db.user(p.userId);"], 1, "const authors = await db.usersByIds(posts.map((p) => p.userId));"),
  L("cachemoth", "js", ["cache.set(\"price\", 10);", "db.update(\"price\", 12);", "show(cache.get(\"price\"));"], 1, "db.update(\"price\", 12); cache.delete(\"price\");"),
  L("cachequeen", "js", ["res.setHeader(\"Cache-Control\", \"max-age=31536000\");", "res.sendFile(\"app.js\"); // o arquivo mudou, o nome nao"], 1, "res.sendFile(\"app.3f9a.js\"); // nome novo a cada versao"),
  L("pixelmite", "css", [".logo {", "  margin-left: 1px;", "}"], 1, "  margin-left: 0;"),
  L("overflowasp", "css", [".card { width: 200px; }", ".card p { white-space: nowrap; }"], 1, ".card p { overflow-wrap: anywhere; }"),
  L("flickerfly", "js", ["useEffect(() => {", "  setCount(count + 1);", "});"], 2, "}, []);"),
  L("y2kbeetle", "js", ["const year = \"99\";", "const full = 1900 + Number(year);"], 0, "const year = \"1999\"; // guarde os 4 digitos"),
  L("zeroday", "js", ["app.post(\"/login\", (req, res) => {", "  if (req.body.user) return res.send(token());", "});"], 1, "  if (checkPassword(req.body)) return res.send(token());"),
  L("markmoth", "js", ["relay(70).close();", "// uma mariposa esta presa no rele 70"], 0, "removeMoth(70); relay(70).close();"),
];

const BY_SPECIES = new Map(LESSONS.map((l) => [l.speciesId, l]));

export function lessonFor(speciesId: string): Lesson | undefined {
  return BY_SPECIES.get(speciesId);
}
