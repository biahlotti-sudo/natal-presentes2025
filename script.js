// ====== URLs das 3 abas publicadas como CSV ======
const abas = {
  lista:  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLs-DQkKOVGs2daPxrhRb_1a1u8a-X2AAgk0lQjqlKxOfxi58Gfqft1jsLL-taCTmr_DaFVz1o6EBz/pub?gid=0&single=true&output=csv",
  lista1: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLs-DQkKOVGs2daPxrhRb_1a1u8a-X2AAgk0lQjqlKxOfxi58Gfqft1jsLL-taCTmr_DaFVz1o6EBz/pub?gid=76847642&single=true&output=csv",
  lista2: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSLs-DQkKOVGs2daPxrhRb_1a1u8a-X2AAgk0lQjqlKxOfxi58Gfqft1jsLL-taCTmr_DaFVz1o6EBz/pub?gid=1893600573&single=true&output=csv"
};

// ====== SE TIVER web app do Apps Script, coloque a URL /exec aqui ======
const WEBAPP_URL = ""; // ex.: "https://script.google.com/macros/s/AKfycb.../exec"

// ====== parser de CSV que respeita aspas e vírgulas dentro de células ======
function parseCSVLine(line) {
  const re = /("(?:[^"]|"")*"|[^,]+)/g;
  const out = [];
  let m;
  while ((m = re.exec(line)) !== null) {
    let v = m[0];
    // remove espaços externos, sem estragar valores entre aspas
    if (!(v.startsWith('"') && v.endsWith('"'))) v = v.trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/""/g, '"');
    out.push(v);
  }
  return out;
}

function normalizarCab(h) {
  return String(h).trim().toLowerCase();
}

let dadosAtuais = [];   // guarda as linhas renderizadas
let headersAtuais = []; // guarda cabeçalhos
let gidAtual = "";      // qual gid está sendo exibido (pra enviar ao Apps Script)

async function carregar(qualAba) {
  const url = abas[qualAba];
  gidAtual = new URL(url).searchParams.get("gid") || ""; // útil pro Apps Script

  const status = document.getElementById('status');
  const ul = document.getElementById('lista-ul');
  status.textContent = 'Carregando…';
  ul.innerHTML = '';

  try {
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const texto = await resp.text();

    const linhas = texto.split(/\r?\n/).filter(l => l.trim() !== '');
    if (linhas.length === 0) {
      status.textContent = 'Planilha vazia.';
      return;
    }

    headersAtuais = parseCSVLine(linhas[0]).map(normalizarCab);
    const iPessoa = headersAtuais.indexOf('pessoa');
    const iItem   = headersAtuais.indexOf('item');
    const iLink   = headersAtuais.indexOf('link');
    const iStatus = headersAtuais.indexOf('status');

    if ([iPessoa, iItem, iLink, iStatus].some(i => i < 0)) {
      status.textContent = 'Cabeçalhos esperados: Pessoa, Item, Link, Status.';
      return;
    }

    dadosAtuais = linhas.slice(1).map((ln, idx) => {
      const cols = parseCSVLine(ln);
      return {
        _rowIndex: idx + 2, // índice real na planilha (pula cabeçalho)
        pessoa: cols[iPessoa] || '',
        item:   cols[iItem]   || '',
        link:   cols[iLink]   || '',
        status: (cols[iStatus] || '').toLowerCase()
      };
    });

    render(dadosAtuais);
    status.textContent = '';
  } catch (err) {
    console.error(err);
    status.textContent = 'Erro ao carregar dados (veja o console).';
  }
}

function render(linhas) {
  const ul = document.getElementById('lista-ul');
  ul.innerHTML = '';

  linhas.forEach(reg => {
    const li = document.createElement('li');
    li.className = 'item';

    const a = reg.link ? `<a href="${reg.link}" target="_blank" rel="noopener noreferrer">ver link</a>` : '';
    const reservado = /^reservad/o.test(reg.status) || reg.status === 'reservado';

    li.innerHTML = `
      <div><strong>${reg.item}</strong> ${a ? `— ${a}` : ''}</div>
      <div><small>para: ${reg.pessoa || '-'}</small></div>
      <div style="margin-top:4px;">
        <span class="pill ${reservado ? 'ok' : 'livre'}">${reservado ? 'Reservado' : 'Livre'}</span>
        <button class="btn-reservar" data-row="${reg._rowIndex}" data-novo="${reservado ? 'Livre' : 'Reservado'}">
          ${reservado ? 'Cancelar reserva' : 'Reservar'}
        </button>
      </div>
    `;
    ul.appendChild(li);
  });
}

function aplicarFiltro(txt) {
  const q = txt.trim().toLowerCase();
  if (!q) return render(dadosAtuais);
  const filtrado = dadosAtuais.filter(r =>
    r.pessoa.toLowerCase().includes(q) || r.item.toLowerCase().includes(q)
  );
  render(filtrado);
}

// Clique em Reservar/Cancelar (se houver WEBAPP_URL configurada)
document.addEventListener('click', async (ev) => {
  const btn = ev.target.closest('.btn-reservar');
  if (!btn) return;

  if (!WEBAPP_URL) {
    alert('Para reservar, configure o Apps Script (ver instruções na página).');
    return;
  }

  const row = Number(btn.dataset.row);
  const novo = btn.dataset.novo; // "Reservado" ou "Livre"

  try {
    btn.disabled = true;
    const resp = await fetch(WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'setStatus',
        gid: gidAtual,          // qual aba (gid)
        rowIndex: row,          // linha real (2 = primeira linha após cabeçalho)
        value: novo             // "Reservado" ou "Livre"
      })
    });
    const data = await resp.json();
    if (!resp.ok || data.error) throw new Error(data.error || `HTTP ${resp.status}`);

    // Atualiza o array local e re-renderiza
    const i = dadosAtuais.findIndex(r => r._rowIndex === row);
    if (i >= 0) dadosAtuais[i].status = novo.toLowerCase();
    render(dadosAtuais);
  } catch (e) {
    console.error(e);
    alert('Falhou ao atualizar. Tente de novo.');
  } finally {
    btn.disabled = false;
  }
});

// carregar ao abrir e ligar os controles
document.addEventListener('DOMContentLoaded', () => {
  const sel = document.getElementById('aba');
  const filtro = document.getElementById('filtro');

  carregar(sel.value);
  sel.addEventListener('change', () => carregar(sel.value));
  filtro.addEventListener('input', (e) => aplicarFiltro(e.target.value));
});
