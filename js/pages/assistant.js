// js/pages/assistant.js
// Assistant pédagogique DISSIPL : tout se passe dans le navigateur.
// Aucune question n'est envoyée à un serveur ni enregistrée ; aucune IA externe n'est appelée.
// Le contenu vient de /assistant/knowledge.json (concepts, besoins, sources) et
// /assistant/catalogue.json (fiches des outils) : on les enrichit sans toucher à ce code.

const DATA_VERSION = "20261115";
const CONTACT = "contact@dissipl.fr";
// racine du site ("/" sur dissipl.fr, "/dissipl-preview/" sur le lien de test)
const ROOT = new URL("/dissipl-preview/", import.meta.url).pathname;
const href = (u) => (u.startsWith("/") ? ROOT + u.slice(1) : u);

let KB = null;          // knowledge.json
let CAT = null;         // catalogue.json (outils validés seulement)
const state = {
  profile: null,        // "specialist" | "teacher" | "parent" | "pro" | null
  level: "",            // niveau choisi dans la liste (facultatif)
  last: null,           // dernier contexte de réponse : { conceptId, lang, typeIds, needIds, level, variant }
  pendingText: "",      // question en attente d'une précision (notion non trouvée)
  lang: "fr",
};

// ------------------------------------------------------------------ textes de l'interface

const UI = {
  fr: {
    title: "Assistant pédagogique",
    subtitle: "Décrivez une difficulté rencontrée par un élève : l'assistant propose une démarche concrète, une activité de manipulation et, quand c'est pertinent, un outil DISSIPL.",
    noticeTitle: "À lire avant de commencer",
    notice: [
      "<strong>Ceci n'est pas un avis médical.</strong> L'assistant ne pose aucun diagnostic. Ses réponses s'appuient sur la recherche en sciences de l'éducation et en neurosciences et sur des documents officiels (ministères, autorités de santé), cités sous chaque réponse.",
      "<strong>N'écrivez aucune donnée personnelle</strong> : pas de nom, prénom, adresse, date de naissance ni dossier médical. Parlez de « l'élève » ou de « mon enfant ».",
      "<strong>Rien n'est enregistré ni envoyé</strong> : l'assistant fonctionne entièrement dans votre navigateur. Vos questions disparaissent quand vous fermez la page."
    ],
    profileLabel: "Je suis (facultatif) :",
    profiles: { specialist: "Enseignant spécialisé", teacher: "Enseignant en classe ordinaire", parent: "Parent", pro: "Autre professionnel" },
    levelLabel: "Niveau de l'élève (facultatif) :",
    levelNone: "Non précisé",
    levels: ["Maternelle", "CP", "CE1", "CE2", "CM1", "CM2", "Collège", "ULIS / SEGPA / IME"],
    placeholder: "Ex. : Mon élève de CE2 récite la suite des nombres mais ne comprend pas la valeur des chiffres…",
    send: "Envoyer",
    newChat: "Nouvelle conversation",
    examplesTitle: "Exemples de questions",
    examples: [
      "Mon élève de CM1 ne comprend pas la différence entre unités, dizaines et centaines.",
      "Il confond les lettres et les sons, surtout b et d.",
      "Ma fille n'arrive pas à mémoriser les tables de multiplication.",
      "Il sait faire le calcul mais ne comprend pas ce qu'il fait avec la retenue.",
      "Elle ne comprend pas les fractions.",
      "Mon élève a besoin de manipuler pour comprendre la multiplication."
    ],
    you: "Vous",
    bot: "Assistant DISSIPL",
    masked: { name: "[prénom masqué]", email: "[e-mail masqué]", phone: "[téléphone masqué]", address: "[adresse masquée]", birth: "[date masquée]" },
    privacyWarn: "J'ai masqué ce qui ressemble à une donnée personnelle dans votre message. Pour protéger l'élève, ne donnez ni nom, ni adresse, ni coordonnées : ce n'est pas nécessaire pour vous aider.",
    disclaimer: "Proposition pédagogique, pas un diagnostic médical. Elle s'appuie sur la recherche et sur des documents officiels (voir les sources). Pour toute question de santé ou de diagnostic, adressez-vous à un professionnel de santé.",
    sec: {
      understood: "1. Ce que j'ai compris",
      facts: "Ce que vous avez décrit",
      hypotheses: "Pistes à vérifier (hypothèses pédagogiques, pas des certitudes)",
      prereq: "Prérequis à vérifier",
      objective: "2. Objectif d'apprentissage",
      proposal: "3. Proposition pédagogique",
      manip: "4. Activité de manipulation",
      progression: "5. Progression, du plus simple au plus complexe",
      check: "6. Vérifier la compréhension",
      tool: "7. Outil DISSIPL",
      adapt: "Adaptations possibles",
      sources: "Sources"
    },
    secParent: {
      understood: "1. Ce qui se passe",
      objective: "2. Le but",
      proposal: "3. Comment s'y prendre",
      manip: "4. Une activité à faire ensemble",
      progression: "5. Pas à pas",
      check: "6. Comment savoir si c'est compris",
      tool: "7. Outil DISSIPL",
      adapt: "Adaptations possibles"
    },
    concept: "Notion travaillée",
    domain: "Domaine",
    typeLabel: "Type de difficulté",
    levelInfo: "Niveau",
    levelMissing: "Je n'ai pas le niveau de l'élève : la proposition est générale, à ajuster. Vous pouvez le préciser au-dessus.",
    unknownType: "non précisé : la proposition commence par le sens, puis la mémorisation",
    toolWhy: "Pourquoi cet outil", toolStart: "Pour commencer", toolSay: "Ce que vous pouvez dire à l'élève", toolDevelop: "Pour aller plus loin", toolObserve: "À observer",
    openFree: "Ouvrir la version gratuite", openPremium: "Version Premium", tutorial: "Tutoriel",
    otherTool: "Autre outil possible",
    noTool: "Pour cette difficulté, je n'ai pas actuellement d'outil DISSIPL suffisamment adapté. Voici une proposition pédagogique que vous pouvez mettre en œuvre autrement.",
    partialTool: "Peut servir d'appui partiel :",
    needIntro: "Vous avez mentionné {needs}. Ces pistes sont des adaptations pédagogiques générales : chaque élève est différent, et elles ne remplacent pas les recommandations des professionnels qui le suivent.",
    needNoDiag: "Une difficulté ne correspond pas forcément à un trouble : seule une évaluation par des professionnels de santé peut le dire.",
    diagnosis: "Je ne peux pas dire si l'élève a un trouble : ce n'est pas mon rôle, et un diagnostic ne peut être posé que par des professionnels de santé (médecin, orthophoniste, psychologue, neuropsychologue…). En France, vous pouvez en parler au médecin traitant, au médecin ou au psychologue de l'Éducation nationale. En revanche, je peux vous aider sur le plan pédagogique :",
    medical: "Je ne donne pas d'avis sur les traitements, médicaments ou soins : parlez-en au médecin qui suit l'enfant. Je peux en revanche vous aider à adapter les activités d'apprentissage.",
    parentTip: "À la maison : des séances courtes (10 minutes), avec des objets du quotidien, sous forme de jeu. Si l'école utilise une méthode, demandez-la à l'enseignant pour ne pas brouiller l'élève.",
    teacherTip: "En classe : cette activité peut se mener en petit groupe pendant que les autres travaillent en autonomie ; le même matériel peut servir à tous, avec des niveaux de difficulté différents.",
    specialistTip: "Pour un dispositif spécialisé : observez les procédures de l'élève (comment il s'y prend) plutôt que le seul résultat, et retirez l'étayage progressivement (montrer, faire avec, laisser faire seul).",
    proTip: "Adaptez la proposition à votre cadre d'intervention et coordonnez-vous avec l'enseignant et la famille pour que l'élève retrouve les mêmes repères.",
    ask: "Je n'ai pas bien identifié la notion travaillée. Sur quoi porte la difficulté ?",
    askNeed: "Pour vous proposer une activité précise, sur quelle notion l'élève a-t-il besoin d'aide ?",
    greeting: "Bonjour ! Décrivez la difficulté de l'élève avec vos mots : ce qu'il sait déjà faire, ce qui bloque, son niveau si vous le connaissez. Je vous propose une démarche concrète.",
    alsoAbout: "Votre question parle aussi de {name}.",
    switchTo: "Plutôt {name}",
    domains: "Choisir une notion",
    fb: { worked: "Ça a marché", notUnderstood: "L'élève n'a pas compris", tooHard: "C'est trop difficile", another: "Une autre proposition" },
    fbAnswer: {
      worked: "Très bien ! Voici l'étape suivante pour {name}.",
      notUnderstood: "D'accord, revenons un pas en arrière pour {name}. Une incompréhension vient souvent d'un prérequis pas encore installé.",
      tooHard: "Allégeons la tâche pour {name}. L'idée : réduire la difficulté, puis enlever l'aide peu à peu (montrer, faire ensemble, laisser faire seul).",
      another: "Voici une autre façon d'aborder {name}."
    },
    nextStep: "Étape suivante", simpler: "Version plus simple", prereqCheck: "Vérifiez d'abord", altApproach: "Autre approche", scaffold: "Étayage", scaffoldText: "1) Vous montrez en disant ce que vous faites. 2) Vous faites ensemble. 3) L'élève fait seul et vous observez. Revenez à l'étape précédente dès qu'il bloque.",
    followTitle: "Pour continuer",
    follow: { level: "Préciser le niveau de l'élève", next: "Et ensuite ?", dys: "Adapter pour un élève dyslexique", attention: "Adapter pour un élève qui a du mal à se concentrer", parentVersion: "Version pour un parent" },
    report: "Signaler une réponse inadaptée",
    reportTitle: "Signaler cette réponse",
    reportHelp: "Dites-nous ce qui ne convient pas. N'indiquez aucune donnée personnelle sur l'élève. Le signalement s'ouvre dans votre messagerie : vous voyez tout ce qui sera envoyé.",
    reportSend: "Préparer l'e-mail",
    reportPlaceholder: "Ex. : l'activité proposée ne correspond pas à l'âge de l'élève…",
    reportSubject: "Assistant pédagogique : réponse inadaptée",
    thinking: "Je prépare une proposition…",
  },
  en: {
    title: "Teaching assistant",
    subtitle: "Describe a difficulty a student is having: the assistant suggests a concrete approach, a hands-on activity and, when relevant, a DISSIPL tool.",
    noticeTitle: "Please read before you start",
    notice: [
      "<strong>This is not medical advice.</strong> The assistant never makes a diagnosis. Its answers are based on education and neuroscience research and on official documents (ministries, health authorities), cited under each answer.",
      "<strong>Do not write any personal data</strong>: no name, address, date of birth or medical record. Say \"the student\" or \"my child\".",
      "<strong>Nothing is saved or sent</strong>: the assistant runs entirely in your browser. Your questions disappear when you close the page."
    ],
    profileLabel: "I am (optional):",
    profiles: { specialist: "Specialist teacher", teacher: "Mainstream teacher", parent: "Parent", pro: "Other professional" },
    levelLabel: "Student's level (optional):",
    levelNone: "Not specified",
    levels: ["Nursery / Kindergarten", "Age 6", "Age 7", "Age 8", "Age 9", "Age 10", "Secondary", "Specialist setting"],
    placeholder: "E.g.: My Year 5 student can recite numbers but does not understand the value of the digits…",
    send: "Send",
    newChat: "New conversation",
    examplesTitle: "Example questions",
    examples: [
      "My Year 5 student does not understand the difference between units, tens and hundreds.",
      "She confuses letters and sounds, especially b and d.",
      "My child cannot memorise the times tables.",
      "He can do the calculation but does not understand what he is doing when carrying.",
      "He does not understand fractions.",
      "My student needs to handle objects to understand multiplication."
    ],
    you: "You",
    bot: "DISSIPL assistant",
    masked: { name: "[name hidden]", email: "[email hidden]", phone: "[phone hidden]", address: "[address hidden]", birth: "[date hidden]" },
    privacyWarn: "I hid something that looks like personal data in your message. To protect the student, please do not give names, addresses or contact details: they are not needed to help you.",
    disclaimer: "Teaching suggestion, not a medical diagnosis. It is based on research and official documents (see sources). For any health or diagnosis question, please consult a health professional.",
    sec: {
      understood: "1. What I understood",
      facts: "What you described",
      hypotheses: "Things to check (teaching hypotheses, not certainties)",
      prereq: "Prerequisites to check",
      objective: "2. Learning objective",
      proposal: "3. Teaching approach",
      manip: "4. Hands-on activity",
      progression: "5. Progression, from simplest to hardest",
      check: "6. Checking understanding",
      tool: "7. DISSIPL tool",
      adapt: "Possible adaptations",
      sources: "Sources"
    },
    secParent: {
      understood: "1. What is going on",
      objective: "2. The goal",
      proposal: "3. How to go about it",
      manip: "4. An activity to do together",
      progression: "5. Step by step",
      check: "6. How to tell it is understood",
      tool: "7. DISSIPL tool",
      adapt: "Possible adaptations"
    },
    concept: "Concept",
    domain: "Area",
    typeLabel: "Type of difficulty",
    levelInfo: "Level",
    levelMissing: "I don't know the student's level: this is a general suggestion, to adjust. You can set it above.",
    unknownType: "not specified: the suggestion starts with meaning, then memorisation",
    toolWhy: "Why this tool", toolStart: "To begin", toolSay: "What you can say to the student", toolDevelop: "Going further", toolObserve: "What to watch for",
    openFree: "Open the free version", openPremium: "Premium version", tutorial: "Tutorial",
    otherTool: "Another possible tool",
    noTool: "For this difficulty, I currently do not have a sufficiently suitable DISSIPL tool. Here is a teaching suggestion that you can carry out in another way.",
    partialTool: "Can be a partial support:",
    needIntro: "You mentioned {needs}. These are general teaching adaptations: every student is different, and they do not replace the advice of the professionals who support the student.",
    needNoDiag: "A difficulty does not necessarily mean a disorder: only an assessment by health professionals can say.",
    diagnosis: "I cannot say whether the student has a disorder: that is not my role, and only health professionals (doctor, speech therapist, psychologist…) can make a diagnosis. You can talk to the family doctor or the school's health and psychology services. I can, however, help with teaching:",
    medical: "I do not give advice on treatment, medication or therapy: please ask the doctor who follows the child. I can help you adapt learning activities.",
    parentTip: "At home: short sessions (10 minutes), with everyday objects, as a game. If the school uses a particular method, ask the teacher so you don't confuse the child.",
    teacherTip: "In class: this activity can run with a small group while others work independently; the same materials can serve everyone at different levels of difficulty.",
    specialistTip: "In a specialist setting: observe the student's procedures (how they go about it) rather than just the result, and withdraw support gradually (show, do together, let them do it alone).",
    proTip: "Adapt the suggestion to your setting and coordinate with the teacher and family so the student finds the same landmarks.",
    ask: "I did not quite identify the concept being worked on. What is the difficulty about?",
    askNeed: "To suggest a specific activity, which concept does the student need help with?",
    greeting: "Hello! Describe the student's difficulty in your own words: what they can already do, what is blocking, their level if you know it. I will suggest a concrete approach.",
    alsoAbout: "Your question is also about {name}.",
    switchTo: "Rather {name}",
    domains: "Choose a concept",
    fb: { worked: "It worked", notUnderstood: "The student did not understand", tooHard: "It is too difficult", another: "Another suggestion" },
    fbAnswer: {
      worked: "Great! Here is the next step for {name}.",
      notUnderstood: "All right, let's go back one step for {name}. Not understanding often comes from a prerequisite that is not yet secure.",
      tooHard: "Let's make the task lighter for {name}. The idea: reduce the difficulty, then remove help little by little (show, do together, let them do it alone).",
      another: "Here is another way to approach {name}."
    },
    nextStep: "Next step", simpler: "Simpler version", prereqCheck: "Check first", altApproach: "Another approach", scaffold: "Scaffolding", scaffoldText: "1) You show, saying what you do. 2) You do it together. 3) The student does it alone while you watch. Go back a step as soon as they get stuck.",
    followTitle: "To continue",
    follow: { level: "Set the student's level", next: "What next?", dys: "Adapt for a dyslexic student", attention: "Adapt for a student who struggles to focus", parentVersion: "Version for a parent" },
    report: "Report an unsuitable answer",
    reportTitle: "Report this answer",
    reportHelp: "Tell us what is wrong. Do not include any personal data about the student. The report opens in your email app: you see everything that will be sent.",
    reportSend: "Prepare the email",
    reportPlaceholder: "E.g.: the activity does not suit the student's age…",
    reportSubject: "Teaching assistant: unsuitable answer",
    thinking: "Preparing a suggestion…",
  },
};

// ------------------------------------------------------------------ utilitaires

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

/** minuscules, sans accents, ponctuation → espaces, entouré d'espaces (recherche « début de mot ») */
function norm(s) {
  return " " + String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[’'`]/g, " ").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim() + " ";
}

/** un déclencheur court (≤ 4 lettres) doit être un mot entier ; un plus long peut être un début de mot */
function hits(text, trigger) {
  const t = norm(trigger).trim();
  if (!t) return false;
  return t.length <= 4 ? text.includes(" " + t + " ") : text.includes(" " + t);
}

function score(text, triggers) {
  let s = 0;
  for (const tr of triggers || []) if (hits(text, tr)) s += 1 + norm(tr).trim().length / 6;
  return s;
}

function pageLang() {
  let code = "fr";
  try { code = localStorage.getItem("dissipl-lang") || (navigator.language || "fr").slice(0, 2); } catch { /* navigation privée */ }
  return code === "fr" ? "fr" : "en";
}

/** langue de la question : français ou anglais d'après les petits mots, sinon celle du site */
function detectLang(raw) {
  const t = norm(raw);
  const fr = [" le ", " la ", " les ", " des ", " un ", " une ", " il ", " elle ", " est ", " pas ", " mon ", " ma ", " ne ", " comment ", " eleve ", " bonjour ", " salut ", " merci ", " c est ", " trop ", " ca "].filter((w) => t.includes(w)).length;
  const en = [" the ", " he ", " she ", " is ", " not ", " my ", " does ", " how ", " student ", " can ", " cannot ", " doesn ", " hello ", " hi ", " thanks ", " it ", " too "].filter((w) => t.includes(w)).length;
  if (fr > en) return "fr";
  if (en > fr) return "en";
  return state.last?.lang || state.lang || pageLang();
}

// ------------------------------------------------------------------ protection des données

/** Masque ce qui ressemble à une donnée personnelle. Rien n'est envoyé : c'est pour l'affichage et pour sensibiliser. */
function maskPersonal(raw, L) {
  let found = false;
  const m = L.masked;
  let s = raw;
  const sub = (re, rep) => { s = s.replace(re, (...a) => { found = true; return typeof rep === "function" ? rep(...a) : rep; }); };
  sub(/[\w.+-]+@[\w-]+\.[\w.-]+/g, m.email);
  sub(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{1,4}\)?[\s.-]?){3,}\d{2,}/g, (x) => (x.replace(/\D/g, "").length >= 9 ? m.phone : x));
  sub(/\b\d{1,4}\s*(?:bis|ter)?\s*,?\s*(?:rue|avenue|av\.|boulevard|bd|chemin|all[ée]e|impasse|place|route|quai|street|st\.|road|rd\.|lane|drive|way)\b[^,.\n]*/gi, m.address);
  sub(/\b(?:n[ée]e?\s+le|date de naissance|born on|date of birth)\s*:?\s*[\d\s\/.-]{6,10}/gi, m.birth);
  sub(/\b(s[' ]appelle|se nomme|se pr[ée]nomme|son (?:pr[ée])?nom est|pr[ée]nom\s*:|nom\s*:|named|called|his name is|her name is|name\s*:)\s+([A-ZÀ-Ý][\p{L}'-]+(?:\s+[A-ZÀ-Ý][\p{L}'-]+)?)/gu, (_, cue) => cue + " " + m.name);
  return { text: s, found };
}

// ------------------------------------------------------------------ compréhension de la question

const DIAG_RE = /\b(diagnos\w*|est[- ]il|est[- ]elle|est[- ]ce qu.?il est|a[- ]t[- ]il (un|une|des)|a[- ]t[- ]elle (un|une|des)|is (he|she|my (child|son|daughter)|the (child|student)) (dyslexic|autistic|dyspraxic|adhd|dyscalculic)|does (he|she|my (child|son|daughter)) have|test (pour|for) (la |l )?(dys|adhd|tdah|autis))/i;
const MED_RE = /\b(m[ée]dicament|ritaline|m[ée]thylph[ée]nidate|traitement m[ée]dical|posologie|medication|ritalin|methylphenidate|dosage|prescri)\w*/i;

const FEEDBACK = {
  worked: ["ca a marche", "ca marche", "ca a fonctionne", "il a compris", "elle a compris", "c est bon", "it worked", "it works", "he understood", "she understood", "got it"],
  notUnderstood: ["pas compris", "comprend toujours pas", "n a pas compris", "ca ne marche pas", "ca marche pas", "didn t understand", "did not understand", "still doesn t", "not working", "doesn t work"],
  tooHard: ["trop difficile", "trop dur", "trop complique", "too difficult", "too hard", "too complicated"],
  another: ["autre proposition", "autre idee", "autre chose", "une autre", "another suggestion", "another idea", "something else", "different approach"],
};

const LEVEL_RE = [
  [/\b(ps|ms|gs|maternelle|petite section|moyenne section|grande section|nursery|kindergarten|reception|preschool)\b/i, "young"],
  [/\b(cp|ce1|ce2|year [1-4]|grade [1-3]|1st grade|2nd grade|3rd grade)\b/i, "primary1"],
  [/\b(cm1|cm2|year [56]|grade [45]|4th grade|5th grade)\b/i, "primary2"],
  [/\b(6e|6eme|sixi[eè]me|5e|4e|3e|coll[eè]ge|year [7-9]|grade [6-9]|middle school|secondary)\b/i, "secondary"],
  [/\b(ulis|segpa|ime|itep|sessad|sen unit|special school)\b/i, "special"],
];

function detectLevel(raw) {
  const age = raw.match(/\b(\d{1,2})\s*(ans|years? old|-year-old|yo)\b/i);
  const found = [];
  for (const [re] of LEVEL_RE) { const m = raw.match(re); if (m) found.push(m[0]); }
  if (age) found.push(age[0]);
  return found.join(", ");
}

function detectProfile(t) {
  if (/ (ulis|segpa|ime|enseignant specialise|enseignante specialisee|coordonnat|rased|specialist teacher|senco|sen teacher) /.test(t)) return "specialist";
  if (/ (mon fils|ma fille|mon enfant|je suis parent|en tant que parent|my son|my daughter|my child|as a parent|i m a parent|at home|a la maison) /.test(t)) return "parent";
  if (/ (mes eleves|ma classe|mon eleve|en classe|my students|my class|my pupil|my student|in class) /.test(t)) return "teacher";
  if (/ (orthophon|psychomotric|ergotherap|educateur|educatrice|aesh|avs|speech therapist|occupational therapist|teaching assistant) /.test(t)) return "pro";
  return null;
}

function analyse(raw) {
  const t = norm(raw);
  const ranked = KB.concepts
    .map((c) => ({ c, s: score(t, c.triggers) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  const types = KB.difficultyTypes.filter((d) => score(t, d.triggers) > 0);
  const needs = KB.needs.filter((n) => score(t, n.triggers) > 0);
  let feedback = null;
  for (const [k, list] of Object.entries(FEEDBACK)) if (list.some((p) => t.includes(" " + p))) { feedback = k; break; }
  return {
    t, ranked, types, needs, feedback,
    diag: DIAG_RE.test(raw), medical: MED_RE.test(raw),
    level: detectLevel(raw), profile: detectProfile(t),
    greeting: /^ (bonjour|salut|hello|hi|coucou|bonsoir|hey)( [a-z]+)? $/.test(t),
  };
}

// ------------------------------------------------------------------ construction des réponses

const concept = (id) => KB.concepts.find((c) => c.id === id);
const tool = (id) => CAT.find((x) => x.id === id);
const ul = (items) => "<ul>" + items.map((i) => `<li>${esc(i)}</li>`).join("") + "</ul>";
const ol = (items) => "<ol>" + items.map((i) => `<li>${esc(i)}</li>`).join("") + "</ol>";
const block = (title, html, cls = "") => `<section class="as-sec ${cls}"><h4>${esc(title)}</h4>${html}</section>`;

function toolCard(c, id, lang, L, primary) {
  const tl = tool(id);
  if (!tl) return "";
  const use = c.toolUse?.[id]?.[lang];
  const rows = use ? [
    [L.toolWhy, use.why], [L.toolStart, use.start], [L.toolSay, use.say], [L.toolDevelop, use.develop], [L.toolObserve, use.observe],
  ].map(([k, v]) => `<div class="as-row"><span>${esc(k)}</span><p>${esc(v)}</p></div>`).join("") : `<p>${esc(tl.summary[lang])}</p>`;
  return `<div class="as-tool ${primary ? "" : "as-tool-alt"}">
    <div class="as-tool-head"><strong>${esc(primary ? tl.name[lang] : L.otherTool + " : " + tl.name[lang])}</strong><em>${esc(tl.status[lang])}</em></div>
    ${rows}
    <p class="as-limit"><span>⚠</span> ${esc(tl.limits[lang])}</p>
    <div class="as-links">
      <a class="as-btn red" href="${esc(href(tl.url.free))}" target="_blank" rel="noopener">${esc(L.openFree)} →</a>
      <a class="as-btn line" href="${esc(href(tl.url.premium))}" target="_blank" rel="noopener">${esc(L.openPremium)}</a>
      <a class="as-btn line" href="${esc(href(tl.tutorial))}" target="_blank" rel="noopener">${esc(L.tutorial)}</a>
    </div>
  </div>`;
}

function toolSection(c, lang, L, which) {
  const list = c.tools.filter((id) => tool(id));
  if (!list.length) {
    let html = `<p class="as-notool">${esc(L.noTool)}</p>`;
    const partial = (c.partialTools || []).map(tool).filter(Boolean);
    if (partial.length) html += `<p>${esc(L.partialTool)} ${partial.map((p) => `<a href="${esc(href(p.url.free))}" target="_blank" rel="noopener">${esc(p.name[lang])}</a>`).join(", ")}</p>`;
    return html;
  }
  // which = 1 : on met en avant le deuxième outil (pour « une autre proposition »)
  const order = which && list.length > 1 ? [list[1], list[0]] : list;
  return order.map((id, i) => toolCard(c, id, lang, L, i === 0)).join("");
}

function needsSection(needs, lang, L) {
  if (!needs.length) return "";
  const names = needs.map((n) => n.name[lang]).join(", ");
  const items = needs.flatMap((n) => n.adapt[lang]);
  return block(L.sec.adapt, `<p>${esc(fill(L.needIntro, { needs: names }))}</p>${ul([...new Set(items)])}<p class="as-small">${esc(L.needNoDiag)}</p>`, "as-adapt");
}

function sourcesSection(ids, lang, L) {
  const uniq = [...new Set(ids)].map((id) => KB.sources[id]).filter(Boolean);
  if (!uniq.length) return "";
  const items = uniq.map((s) => `<li><cite>${esc(s.title)}</cite> — ${esc(s.origin)}, ${esc(s.year)} <span class="as-field">(${esc(s.field[lang])})</span></li>`).join("");
  return `<details class="as-sources"><summary>${esc(L.sec.sources)} (${uniq.length})</summary><ul>${items}</ul></details>`;
}

function profileTip(L) {
  return { parent: L.parentTip, teacher: L.teacherTip, specialist: L.specialistTip, pro: L.proTip }[state.profile] || "";
}

/** Réponse complète (sections A à F de la demande + outil + adaptations + sources). */
function buildAnswer(c, a, lang, maskedQuestion) {
  const L = UI[lang];
  const parent = state.profile === "parent";
  const S = parent ? { ...L.sec, ...L.secParent } : L.sec;
  const level = a.level || state.level;
  const typeNames = a.types.map((d) => d.name[lang]);

  // 1. compréhension : ce qui a été dit (faits) / hypothèses
  let understood = `<dl class="as-dl">
    <dt>${esc(L.concept)}</dt><dd>${esc(c.name[lang])} <span class="as-small">(${esc(c.domain[lang])})</span></dd>
    <dt>${esc(L.typeLabel)}</dt><dd>${esc(typeNames.length ? typeNames.join(", ") : L.unknownType)}</dd>
    ${level ? `<dt>${esc(L.levelInfo)}</dt><dd>${esc(level)}</dd>` : ""}
  </dl>`;
  understood += `<p>${esc(c.understanding[lang])}</p>`;
  if (maskedQuestion) understood += `<div class="as-facts"><h5>${esc(L.sec.facts)}</h5><blockquote>${esc(maskedQuestion)}</blockquote></div>`;
  understood += `<h5>${esc(L.sec.hypotheses)}</h5>${ul(c.obstacles[lang])}`;
  if (!parent) understood += `<h5>${esc(L.sec.prereq)}</h5>${ul(c.prerequisites[lang])}`;
  if (!level) understood += `<p class="as-small as-warn">${esc(L.levelMissing)}</p>`;

  // 3. proposition + conseils selon le type de difficulté et le profil
  let proposal = `<p>${esc(c.approach[lang])}</p>`;
  if (a.types.length) proposal += ul(a.types.map((d) => d.advice[lang]));
  const tip = profileTip(L);
  if (tip) proposal += `<p class="as-tip">${esc(tip)}</p>`;

  let html = "";
  if (a.medical) html += `<p class="as-alert">${esc(L.medical)}</p>`;
  if (a.diag) html += `<p class="as-alert">${esc(L.diagnosis)}</p>`;
  if (a.alsoAbout) html += `<p class="as-small">${esc(fill(L.alsoAbout, { name: a.alsoAbout.name[lang] }))}</p>`;
  html += block(S.understood, understood);
  html += block(S.objective, `<p>${esc(c.objective[lang])}</p>`);
  html += block(S.proposal, proposal);
  html += block(S.manip, `<p>${esc(c.manipulation[lang])}</p>`);
  html += block(S.progression, ol(c.steps[lang]));
  html += block(S.check, `<p>${esc(c.check[lang])}</p>`);
  html += block(S.tool, toolSection(c, lang, L, 0), "as-toolsec");
  html += needsSection(a.needs, lang, L);
  html += sourcesSection([...c.sources, ...a.needs.flatMap((n) => n.sources), ...(a.types.length && c.id !== "attention-work" ? [] : [])], lang, L);
  return html;
}

/** Retour de l'utilisateur sur la dernière proposition (spécification : « ça a marché », « trop difficile »…). */
function buildFeedback(kind, lang) {
  const L = UI[lang];
  const ctx = state.last;
  const c = concept(ctx.conceptId);
  const name = c.name[lang];
  let html = `<p><strong>${esc(fill(L.fbAnswer[kind], { name }))}</strong></p>`;
  if (kind === "worked") {
    html += block(L.nextStep, `<p>${esc(c.next[lang])}</p>`);
    html += block(UI[lang].sec.check, `<p>${esc(c.check[lang])}</p>`);
    const use = c.toolUse?.[c.tools[0]]?.[lang];
    if (use) html += block(tool(c.tools[0]).name[lang], `<p>${esc(use.develop)}</p>`);
  } else if (kind === "notUnderstood") {
    html += block(L.prereqCheck, ul(c.prerequisites[lang]));
    html += block(L.simpler, `<p>${esc(c.simpler[lang])}</p>`);
    html += block(L.altApproach, `<p>${esc(c.alt[lang])}</p>`);
    html += block(L.scaffold, `<p>${esc(L.scaffoldText)}</p>`);
  } else if (kind === "tooHard") {
    html += block(L.simpler, `<p>${esc(c.simpler[lang])}</p>`);
    html += block(L.scaffold, `<p>${esc(L.scaffoldText)}</p>`);
    html += block(L.progression || UI[lang].sec.progression, ol(c.steps[lang].slice(0, 2)));
  } else {
    html += block(L.altApproach, `<p>${esc(c.alt[lang])}</p>`);
    if (c.tools.length > 1) html += block(UI[lang].sec.tool, toolSection(c, lang, L, 1), "as-toolsec");
  }
  html += sourcesSection([...c.sources, ...(kind !== "worked" ? ["wood-bruner"] : [])], lang, L);
  return html;
}

// ------------------------------------------------------------------ interface

const $ = (sel) => document.querySelector(sel);
let log, input;

function addMessage(who, html, opts = {}) {
  const L = UI[state.lang];
  const wrap = document.createElement("div");
  wrap.className = "as-msg " + (who === "user" ? "as-user" : "as-bot");
  wrap.innerHTML = `<div class="as-who">${esc(who === "user" ? L.you : L.bot)}</div><div class="as-bubble">${html}</div>`;
  const bubble = wrap.querySelector(".as-bubble");
  if (opts.disclaimer) bubble.insertAdjacentHTML("beforeend", `<p class="as-disclaimer">${esc(L.disclaimer)}</p>`);
  if (opts.chips?.length) {
    const row = document.createElement("div");
    row.className = "as-chips";
    if (opts.chipsTitle) row.insertAdjacentHTML("beforeend", `<span class="as-chips-title">${esc(opts.chipsTitle)}</span>`);
    for (const ch of opts.chips) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "as-chip" + (ch.cls ? " " + ch.cls : "");
      b.textContent = ch.label;
      b.addEventListener("click", ch.onClick);
      row.appendChild(b);
    }
    bubble.appendChild(row);
  }
  if (opts.report) {
    const r = document.createElement("button");
    r.type = "button";
    r.className = "as-report";
    r.textContent = "⚑ " + L.report;
    r.addEventListener("click", () => openReport(opts.report));
    bubble.appendChild(r);
  }
  log.appendChild(wrap);
  wrap.scrollIntoView({ behavior: "smooth", block: "start" });
  return wrap;
}

function feedbackChips(lang) {
  const L = UI[lang];
  return Object.keys(L.fb).map((k) => ({ label: L.fb[k], cls: "as-fb", onClick: () => send(L.fb[k], { feedback: k, lang }) }));
}

function followChips(c, a, lang) {
  const L = UI[lang];
  const chips = [];
  if (!a.level && !state.level) chips.push({ label: L.follow.level, onClick: () => $("#asLevel").focus() });
  chips.push({ label: L.follow.next, onClick: () => send(L.fb.worked, { feedback: "worked", lang }) });
  if (!a.needs.some((n) => n.id === "dyslexia") && /lecture|reading|ecriture|writing|grammaire|grammar/i.test(c.domain.en + c.domain.fr))
    chips.push({ label: L.follow.dys, onClick: () => send(L.follow.dys + " (" + c.name[lang] + ")", { forceConcept: c.id, addNeed: "dyslexia", lang }) });
  if (!a.needs.some((n) => n.id === "attention"))
    chips.push({ label: L.follow.attention, onClick: () => send(L.follow.attention + " (" + c.name[lang] + ")", { forceConcept: c.id, addNeed: "attention", lang }) });
  if (state.profile !== "parent")
    chips.push({ label: L.follow.parentVersion, onClick: () => { setProfile("parent"); send(L.follow.parentVersion + " (" + c.name[lang] + ")", { forceConcept: c.id, lang }); } });
  return chips;
}

function domainChips(lang, text) {
  return KB.concepts.map((c) => ({ label: c.name[lang], onClick: () => send(c.name[lang], { forceConcept: c.id, carry: text, lang }) }));
}

/** Point d'entrée : une question tapée, un exemple, une puce. */
function send(raw, opts = {}) {
  raw = String(raw || "").trim();
  if (!raw) return;
  const lang = opts.lang || detectLang(raw);
  state.lang = lang;
  const L = UI[lang];
  const masked = maskPersonal(raw, L);
  addMessage("user", esc(masked.text));
  if (masked.found) addMessage("bot", `<p class="as-alert">${esc(L.privacyWarn)}</p>`);

  // l'analyse porte sur le texte masqué, plus la question laissée en attente
  // une puce de notion (forceConcept) : seul le texte de l'utilisateur compte, pas l'intitulé de la puce
  const full = opts.forceConcept ? (opts.carry || "") : (opts.carry ? opts.carry + " " : "") + masked.text;
  const a = analyse(full);
  if (opts.addNeed) { const n = KB.needs.find((x) => x.id === opts.addNeed); if (n && !a.needs.includes(n)) a.needs.push(n); }
  if (a.profile && !state.profile) setProfile(a.profile, true);

  // 1) retour sur la proposition précédente
  const fb = opts.feedback || (!a.ranked.length && a.feedback);
  if (fb && state.last) {
    addMessage("bot", buildFeedback(fb, lang), { disclaimer: true, chips: feedbackChips(lang), report: { ...state.last, kind: fb } });
    return;
  }

  // 2) quelle notion ?
  let c = opts.forceConcept ? concept(opts.forceConcept) : a.ranked[0]?.c;
  if (!c && a.needs.some((n) => n.id === "attention")) c = concept("attention-work");

  if (!c) {
    let html = "";
    if (a.medical) html += `<p class="as-alert">${esc(L.medical)}</p>`;
    if (a.diag) html += `<p class="as-alert">${esc(L.diagnosis)}</p>`;
    if (a.greeting) {
      addMessage("bot", html + `<p>${esc(L.greeting)}</p>`, { chips: L.examples.slice(0, 3).map((e) => ({ label: e, onClick: () => send(e, { lang }) })) });
      return;
    }
    if (a.needs.length) {
      html += needsSection(a.needs, lang, L) + sourcesSection(a.needs.flatMap((n) => n.sources), lang, L);
      html += `<p><strong>${esc(L.askNeed)}</strong></p>`;
    } else html += `<p><strong>${esc(L.ask)}</strong></p>`;
    state.pendingText = full;
    addMessage("bot", html, { disclaimer: a.needs.length > 0 || a.diag, chips: domainChips(lang, full), chipsTitle: L.domains });
    return;
  }

  // une autre notion proche ? on la signale et on propose d'y passer
  const second = !opts.forceConcept && a.ranked[1] && a.ranked[1].s >= a.ranked[0].s * 0.75 ? a.ranked[1].c : null;
  a.alsoAbout = second;
  const question = opts.forceConcept && opts.carry ? maskPersonal(opts.carry, L).text : (opts.forceConcept ? "" : masked.text);
  const html = buildAnswer(c, a, lang, question);
  state.last = { conceptId: c.id, lang, profile: state.profile, level: a.level || state.level, needs: a.needs.map((n) => n.id) };
  state.pendingText = "";
  const chips = [...feedbackChips(lang)];
  if (second) chips.push({ label: fill(L.switchTo, { name: second.name[lang] }), onClick: () => send(second.name[lang], { forceConcept: second.id, carry: full, lang }) });
  const msg = addMessage("bot", html, { disclaimer: true, chips, report: state.last });
  const follow = followChips(c, a, lang);
  if (follow.length) {
    const row = document.createElement("div");
    row.className = "as-chips as-follow";
    row.insertAdjacentHTML("beforeend", `<span class="as-chips-title">${esc(L.followTitle)}</span>`);
    for (const ch of follow) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "as-chip"; b.textContent = ch.label;
      b.addEventListener("click", ch.onClick);
      row.appendChild(b);
    }
    msg.querySelector(".as-bubble").insertBefore(row, msg.querySelector(".as-report"));
  }
}

// ------------------------------------------------------------------ signalement (ouvre la messagerie : l'utilisateur voit tout)

function openReport(ctx) {
  const L = UI[state.lang];
  const dlg = $("#asReport");
  dlg.querySelector("h3").textContent = L.reportTitle;
  dlg.querySelector("p").textContent = L.reportHelp;
  const ta = dlg.querySelector("textarea");
  ta.placeholder = L.reportPlaceholder;
  ta.value = "";
  const btn = dlg.querySelector(".as-send-report");
  btn.textContent = L.reportSend;
  btn.onclick = () => {
    const note = maskPersonal(ta.value, L).text;
    const body = [
      note,
      "",
      "---",
      "Concept: " + (ctx.conceptId || "-"),
      "Feedback: " + (ctx.kind || "-"),
      "Profile: " + (ctx.profile || "-"),
      "Level: " + (ctx.level || "-"),
      "Language: " + (ctx.lang || state.lang),
      "Knowledge base: " + KB.version,
    ].join("\n");
    window.location.href = `mailto:${CONTACT}?subject=${encodeURIComponent(L.reportSubject)}&body=${encodeURIComponent(body)}`;
    dlg.close();
  };
  dlg.showModal();
}

// ------------------------------------------------------------------ mise en place

function setProfile(p, silent) {
  state.profile = state.profile === p && !silent ? null : p;
  document.querySelectorAll(".as-profile").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.p === state.profile)));
}

function renderChrome() {
  const L = UI[state.lang];
  $("#asTitle").textContent = L.title;
  $("#asSubtitle").textContent = L.subtitle;
  $("#asNoticeTitle").textContent = L.noticeTitle;
  $("#asNotice").innerHTML = L.notice.map((n) => `<li>${n}</li>`).join("");
  $("#asProfileLabel").textContent = L.profileLabel;
  const prof = $("#asProfiles");
  prof.innerHTML = "";
  for (const [k, v] of Object.entries(L.profiles)) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "as-profile"; b.dataset.p = k; b.textContent = v;
    b.setAttribute("aria-pressed", String(state.profile === k));
    b.addEventListener("click", () => setProfile(k));
    prof.appendChild(b);
  }
  $("#asLevelLabel").textContent = L.levelLabel;
  const sel = $("#asLevel");
  sel.innerHTML = `<option value="">${esc(L.levelNone)}</option>` + L.levels.map((l) => `<option${l === state.level ? " selected" : ""}>${esc(l)}</option>`).join("");
  input.placeholder = L.placeholder;
  $("#asSend").textContent = L.send;
  $("#asNew").textContent = "↺ " + L.newChat;
  $("#asExamplesTitle").textContent = L.examplesTitle;
  const ex = $("#asExamples");
  ex.innerHTML = "";
  for (const e of L.examples) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "as-chip"; b.textContent = e;
    b.addEventListener("click", () => send(e, { lang: state.lang }));
    ex.appendChild(b);
  }
}

function newConversation() {
  log.innerHTML = "";
  state.last = null;
  state.pendingText = "";
  state.lang = pageLang();
  $("#asExamplesWrap").hidden = false;
  input.value = "";
  input.focus();
}

async function init() {
  log = $("#asLog");
  input = $("#asInput");
  state.lang = pageLang();
  renderChrome();
  try {
    const [k, c] = await Promise.all([
      fetch(`${ROOT}assistant/knowledge.json?v=${DATA_VERSION}`).then((r) => r.json()),
      fetch(`${ROOT}assistant/catalogue.json?v=${DATA_VERSION}`).then((r) => r.json()),
    ]);
    KB = k;
    CAT = c.tools.filter((t) => t.validated);
  } catch (e) {
    console.error("[assistant] base de connaissances introuvable", e);
    $("#asForm").insertAdjacentHTML("beforebegin", `<p class="as-alert">Le chargement a échoué. Rechargez la page. / Loading failed. Please reload the page.</p>`);
    return;
  }
  $("#asForm").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const v = input.value;
    input.value = "";
    $("#asExamplesWrap").hidden = true;
    send(v);
  });
  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); $("#asForm").requestSubmit(); }
  });
  $("#asLevel").addEventListener("change", (ev) => { state.level = ev.target.value; });
  $("#asNew").addEventListener("click", newConversation);
  $("#asExamples").addEventListener("click", () => { $("#asExamplesWrap").hidden = true; });
  document.querySelector("#asReport .as-close").addEventListener("click", () => $("#asReport").close());
  // le sélecteur de langue du site : on change l'interface (la conversation reste)
  window.addEventListener("dissipl:lang", () => { state.lang = pageLang(); renderChrome(); });
}

// pour les tests automatiques
window.DissiplAssistant = { analyse: (t) => analyse(t), send, state };

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
