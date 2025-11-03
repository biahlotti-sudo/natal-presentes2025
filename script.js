// ====== LINKS DAS SUAS ABAS (TSV é mais seguro que CSV) ======
const abas = {
  lista:  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLs-DQkKOVGs2daPxrhRb_1a1u8a-X2AAgk0lQjqlKxOfxi58Gfqft1jsLL-taCTmr_DaFVz1o6EBz/pub?gid=0&single=true&output=tsv",
  lista1: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLs-DQkKOVGs2daPxrhRb_1a1u8a-X2AAgk0lQjqlKxOfxi58Gfqft1jsLL-taCTmr_DaFVz1o6EBz/pub?gid=76847642&single=true&output=tsv",
  lista2: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLs-DQkKOVGs2daPxrhRb_1a1u8a-X2AAgk0lQjqlKxOfxi58Gfqft1jsLL-taCTmr_DaFVz1o6EBz/pub?gid=1893600573&single=true&output=tsv"
};

async function carregar(qual) {
  const url = abas[qual];
  if (!url) return;

  const ul = document.getElementById("lista");
  ul.innerHTML = "<li>Carregando…</li>";
  console.log("Carregando aba:", qual, "→", url);

  try {
    const resp = await fetch(url, { cache: "no-store" });
    console.log("HTTP status:", resp.status);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const texto = await resp.text();
    console.log("Início da resposta:", texto.slice(0, 200));

    // Parse TSV
    const linhas = texto.split(/\r?\n/).filter(l => l.trim() !== "");
    if (linhas.length === 0) {
      ul.innerHTML = "<li>Nenhum dado encontrado</li>";
      return;
    }

    // Se a 1ª linha for cabeçalho e você quiser pular:
    // linhas.shift();

    ul.innerHTML = "";
    for (const linha of linhas) {
      const colunas = linha.split("\t"); // TSV -> separa por TAB
      const li = document.createElement("li");
      li.textContent = colunas[0] ?? ""; // mostra a 1ª coluna
      ul.appendChild(li);
    }
  } catch (e) {
    console.error("Falha ao carregar:", e);
    ul.innerHTML = `<li>Erro: ${e.message}</li>`;
  }
}

// carrega a primeira aba ao abrir
document.addEventListener("DOMContentLoaded", () => carregar("lista"));
