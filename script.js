// aqui estão os links das suas abas da planilha
const abas = {
  lista:  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLs-DQkKOVGs2daPxrhRb_1a1u8a-X2AAgk0lQjqlKxOfxi58Gfqft1jsLL-taCTmr_DaFVz1o6EBz/pub?gid=0&single=true&output=csv",
  lista1: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLs-DQkKOVGs2daPxrhRb_1a1u8a-X2AAgk0lQjqlKxOfxi58Gfqft1jsLL-taCTmr_DaFVz1o6EBz/pub?gid=76847642&single=true&output=csv",
  lista2: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLs-DQkKOVGs2daPxrhRb_1a1u8a-X2AAgk0lQjqlKxOfxi58Gfqft1jsLL-taCTmr_DaFVz1o6EBz/pub?gid=1893600573&single=true&output=csv"
};

// função que busca a aba escolhida e mostra os dados
async function carregar(aba) {
  const url = abas[aba];
  try {
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const texto = await resp.text();

    // separa em linhas
    const linhas = texto.split(/\r?\n/).filter(Boolean);
    linhas.shift(); // ignora a primeira linha (cabeçalho)
    const ul = document.getElementById("lista");
    ul.innerHTML = "";

    // mostra a primeira coluna de cada linha
    for (const linha of linhas) {
      const colunas = linha.split(",");
      const li = document.createElement("li");
      li.textContent = colunas[0];
      ul.appendChild(li);
    }
  } catch (err) {
    console.error(err);
    document.getElementById("lista").innerHTML = "<li>Erro ao carregar dados</li>";
  }
}
