// ====== LINKS DAS SUAS ABAS (TSV é mais seguro) ======
const abas = {
  lista:  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLs-DQkKOVGs2daPxrhRb_1a1u8a-X2AAgk0lQjqlKxOfxi58Gfqft1jsLL-taCTmr_DaFVz1o6EBz/pub?gid=0&single=true&output=tsv",
  lista1: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLs-DQkKOVGs2daPxrhRb_1a1u8a-X2AAgk0lQjqlKxOfxi58Gfqft1jsLL-taCTmr_DaFVz1o6EBz/pub?gid=76847642&single=true&output=tsv",
  lista2: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLs-DQkKOVGs2daPxrhRb_1a1u8a-X2AAgk0lQjqlKxOfxi58Gfqft1jsLL-taCTmr_DaFVz1o6EBz/pub?gid=1893600573&single=true&output=tsv"
};

// Se você quiser mostrar apenas algumas colunas por NOME de cabeçalho,
// preencha aqui, exemplo: ["Pessoa","Presente","Cor"]
const COLUNAS_DESEJADAS = null; // ou ['Nome','Item','Tamanho']

async function carregar(qual) {
  const url = abas[qual];
  if (!url) return;

  const cont = document.getElementById("tabela");
  cont.innerHTML = "<p>Carregando…</p>";
  console.log("Carregando:", qual, "→", url);

  try {
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const texto = await resp.text();

    // Parse TSV
    const linhas = texto.split(/\r?\n/).filter(l => l.trim() !== "");
    if (linhas.length === 0) {
      cont.innerHTML = "<p>Nenhum dado encontrado.</p>";
      return;
    }

    // Cabeçalho (usa primeira linha)
    const cabecalho = linhas[0].split("\t").map(s => s.trim());
    const dados = linhas.slice(1).map(l => l.split("\t"));

    console.log("Cabeçalhos encontrados:", cabecalho);

    // Descobrir quais colunas mostrar
    let indices;
    if (Array.isArray(COLUNAS_DESEJADAS) && COLUNAS_DESEJADAS.length) {
      indices = COLUNAS_DESEJADAS.map(nome => cabecalho.indexOf(nome)).filter(i => i >= 0);
      if (!indices.length) {
        cont.innerHTML = `<p>As colunas desejadas não foram encontradas. Disponíveis: <b>${cabecalho.join(", ")}</b></p>`;
        return;
      }
    } else {
      // sem filtro → mostra todas
      indices = cabecalho.map((_, i) => i);
    }

    // Monta tabela
    const table = document.createElement("table");
    table.border = "1";
    table.cellPadding = "6";
    table.style.borderCollapse = "collapse";

    // Thead
    const thead = document.createElement("thead");
    const trH = document.createElement("tr");
    indices.forEach(i => {
      const th = document.createElement("th");
      th.textContent = cabecalho[i] ?? `Col ${i+1}`;
      trH.appendChild(th);
    });
    thead.appendChild(trH);
    table.appendChild(thead);

    // Tbody
    const tbody = document.createElement("tbody");
    dados.forEach(row => {
      // pula linhas totalmente vazias
      if (row.every(c => (c??"").trim() === "")) return;
      const tr = document.createElement("tr");
      indices.forEach(i => {
        const td = document.createElement("td");
        td.textContent = (row[i] ?? "").trim();
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    cont.innerHTML = "";
    cont.appendChild(table);

  } catch (e) {
    console.error(e);
    cont.innerHTML = `<p>Erro: ${e.message}</p>`;
  }
}

// carrega a primeira aba ao abrir
document.addEventListener("DOMContentLoaded", () => carregar("lista"));
