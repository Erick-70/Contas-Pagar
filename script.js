var contabilizarPagosCronograma = false;
function funcaoContabilizarPagosCronograma() {
  if (contabilizarPagosCronograma){
    contabilizarPagosCronograma = false;
    document.getElementById("btnContabilizarPagosCronograma").innerText = "Não Contabilizar os Pagos";
  } else {
    contabilizarPagosCronograma = true;
    document.getElementById("btnContabilizarPagosCronograma").innerText = "Contabilizar os Pagos";
  }
  barraFiltroPaginaPrincipal.forcarAtualizacao();
}

let barraFiltroPaginaPrincipal = criarBarraDeFiltros('filtrosPrincipal', filtrarPorDescricaoPaginaPrincipal, true);

function filtrarPorDescricaoPaginaPrincipal(filtros, conjunto) {
  if (!Array.isArray(filtros)) return;

  document
    .querySelectorAll('.linhaPaginaPrincipal')
    .forEach(tr => {
      let colunas = tr.querySelectorAll('td');

      const empresa = colunas[0].textContent.trim().toLowerCase();
      const destinatario = colunas[1].textContent.trim().toLowerCase();
      const valor = colunas[2].textContent.trim().toLowerCase();
      const data = colunas[3].textContent.trim();
      const diasDaSemana = colunas[4].textContent.trim().toLowerCase();

      let   mostrar;

      const corresponde = txt => {
        txt = txt.toLowerCase();
        return (
          empresa.includes(txt) ||
          destinatario.includes(txt) ||
          valor.includes(txt) ||
          data.includes(txt) ||
          diasDaSemana.includes(txt)
        );
      };

      if (filtros.length === 0) {
        mostrar = true;
      } else if (conjunto) {
        mostrar = filtros.every(corresponde);
      } else {
        mostrar = filtros.some(corresponde);
      }

      if (mostrar) {
        tr.style.display = '';
      } else {
        tr.style.display = 'none';
      }
    });

    filtrarPorDescricao21Dias(filtros, dadosTratados, conjunto)
    const dadosAgrupados = agruparPorAnoMes(criarDicionarioCadastro(), filtros, conjunto);
    let html = renderizarDados(dadosAgrupados);
    document.getElementById('dadosTratadosDiv').innerHTML = '';
    document.getElementById('dadosTratadosDiv').appendChild(html);
    ativarFuncoesTabela(html);
    ativarToggle(html);
}


function btnMostrarPaginaPrincipal(){
  tratarDadosPaginaPrincipal();
  mostrarIconer('principal');
}

let dadosTratados = {};
function tratarDadosPaginaPrincipal (){
  let _ = agruparPorAnoMes(criarDicionarioCadastro());
  let html = renderizarDados(_);
  document.getElementById('dadosTratadosDiv').innerHTML = '';
  document.getElementById('dadosTratadosDiv').appendChild(html);
  ativarFuncoesTabela(html);
  ativarToggle(html);
  dadosTratados = agruparPor21Dias(_);
  renderizarCronograma21Dias(dadosTratados);

}

function ativarFuncoesTabela(container) {
    const tabelas = container.querySelectorAll("table");

    tabelas.forEach((tabela) => {
        ativarOrdenacaoPlanilha(tabela);
    });
}



function renderizarDados(agrupados) {
    let contador = 0;
    const container = document.createElement("div");

    const diasSemana = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];

    function parseDataLocal(dataStr) {
        const [ano, mes, dia] = dataStr.split("-").map(Number);
        return new Date(ano, mes - 1, dia);
    }

    function diferencaDias(data) {
        const hoje = new Date();
        hoje.setHours(0,0,0,0);

        const alvo = new Date(data);
        alvo.setHours(0,0,0,0);

        return Math.floor((alvo - hoje) / (1000 * 60 * 60 * 24));
    }

    function formatarMoeda(valor) {
        return Number(valor).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    for (const ano in agrupados) {
        let totalAno = 0;
        let totalAnoPago = 0;
        let totalAnoPendente = 0;

        const divAno = document.createElement("div");
        divAno.classList.add("ano");

        const tituloAno = document.createElement("h2");
        tituloAno.classList.add("titulo-ano");
        tituloAno.style.whiteSpace = "pre-line";

        const conteudoAno = document.createElement("div");
        conteudoAno.classList.add("conteudo-ano");

        for (const mes in agrupados[ano]) {
            let totalMes = 0;
            let totalMesPago = 0;
            let totalMesPendente = 0;

            const idMes = `mes-${contador}`;
            const idTbody = `tabela-exibicao-${contador}`;

            const divMes = document.createElement("div");
            divMes.classList.add("mes");
            divMes.id = idMes;

            const tituloMes = document.createElement("h3");
            tituloMes.classList.add("titulo-mes");
            tituloMes.style.whiteSpace = "pre-line";

            const tabela = document.createElement("table");
            tabela.classList.add("tabela");
            tabela.border = "1";

            tabela.innerHTML = `
                <thead>
                    <tr>
                        <th>Empresa</th>
                        <th>Destinatário</th>
                        <th>Valor</th>
                        <th>Data</th>
                        <th>Dia</th>
                    </tr>
                </thead>
                <tbody id="${idTbody}"></tbody>
            `;

            const tbody = tabela.querySelector("tbody");
            const itens = agrupados[ano][mes];

            for (const key in itens) {
                const item = itens[key];
                const valorNum = Number(item.valor);

                // 🔥 Totais
                totalMes += valorNum;
                totalAno += valorNum;

                if (item.status === true) {
                    totalMesPago += valorNum;
                    totalAnoPago += valorNum;
                } else {
                    totalMesPendente += valorNum;
                    totalAnoPendente += valorNum;
                }

                const dataObj = parseDataLocal(item.data);
                const diaSemana = diasSemana[dataObj.getDay()];
                const diffDias = diferencaDias(dataObj);

                const tr = document.createElement("tr");
                tr.classList.add("linhaPaginaPrincipal");

                // 🎨 Cores
                if (item.status === true) {
                    tr.style.backgroundColor = "#2196F3"; // azul = pago
                    tr.style.color = "white";
                } else if (diffDias <= 0) {
                    tr.style.backgroundColor = "#f44336"; // vencido
                    tr.style.color = "white";
                } else if (diffDias <= 1) {
                    tr.style.backgroundColor = "#ffeb3b"; // vence hoje/amanhã
                }

                tr.innerHTML = `
                    <td>${item.empresa}</td>
                    <td>${item.destinatario}</td>
                    <td>${formatarMoeda(valorNum)}</td>
                    <td>${item.data.split("-").reverse().join("/")}</td>
                    <td>${diaSemana}</td>
                `;

                tbody.appendChild(tr);
            }

            // 📊 Título do mês
            tituloMes.innerText = `${mes} - Total Geral: ${formatarMoeda(totalMes)} - Total Pago: ${formatarMoeda(totalMesPago)} - Total Pendente: ${formatarMoeda(totalMesPendente)}`;

            tabela.style.display = "none";

            divMes.appendChild(tituloMes);
            divMes.appendChild(tabela);
            conteudoAno.appendChild(divMes);

            contador++;
        }

        // 📊 Título do ano
        tituloAno.innerText = `${ano} - Total Geral: ${formatarMoeda(totalAno)} - Total Pago: ${formatarMoeda(totalAnoPago)} - Total Pendente: ${formatarMoeda(totalAnoPendente)}`;

        divAno.appendChild(tituloAno);
        divAno.appendChild(conteudoAno);

        container.appendChild(divAno);
    }

    return container;
}

function ativarToggle(container) {
    const anos = container.querySelectorAll(".ano");

    anos.forEach(ano => {
        const tituloAno = ano.querySelector(".titulo-ano");
        const conteudoAno = ano.querySelector(".conteudo-ano");

        // começa fechado
        conteudoAno.style.display = "none";

        tituloAno.style.cursor = "pointer";

        tituloAno.addEventListener("click", () => {
            const aberto = conteudoAno.style.display === "block";

            // 👇 agora só alterna esse
            conteudoAno.style.display = aberto ? "none" : "block";
        });

        // controle dos meses
        const meses = ano.querySelectorAll(".mes");

        meses.forEach(mes => {
            const tituloMes = mes.querySelector(".titulo-mes");
            const tabela = mes.querySelector(".tabela");

            tabela.style.display = "none";
            tituloMes.style.cursor = "pointer";

            tituloMes.addEventListener("click", () => {
                const aberta = tabela.style.display === "table";

                // 👇 agora só alterna essa tabela
                tabela.style.display = aberta ? "none" : "table";
            });
        });
    });
}


function agruparPorAnoMes(dados, filtros = [], conjunto = false) {
  function formatarDataBR(dataStr) {
        const [ano, mes, dia] = dataStr.split("-");
        return `${dia}/${mes}/${ano}`;
    }

    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril",
        "Maio", "Junho", "Julho", "Agosto",
        "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    function parseDataLocal(dataStr) {
        const [ano, mes, dia] = dataStr.split("-").map(Number);
        return new Date(ano, mes - 1, dia);
    }

    // 🔎 mesma lógica de filtro
    const corresponde = (item, txt) => {
        txt = txt.toLowerCase();

        const empresa = (item.empresa || "").toLowerCase();
        const destinatario = (item.destinatario || "").toLowerCase();
        const valor = String(item.valor || "").toLowerCase();
        const data = formatarDataBR(item.data) || "";

        const dataObj = parseDataLocal(item.data);
        const diasSemana = ["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
        const diaSemana = diasSemana[dataObj.getDay()];

        return (
            empresa.includes(txt) ||
            destinatario.includes(txt) ||
            valor.includes(txt) ||
            data.includes(txt) ||
            diaSemana.includes(txt)
        );
    };

    // 🔥 FILTRO APLICADO AQUI
    const listaFiltrada = Object.values(dados).filter(item => {
        if (!Array.isArray(filtros) || filtros.length === 0) return true;

        if (conjunto) {
            return filtros.every(f => corresponde(item, f));
        } else {
            return filtros.some(f => corresponde(item, f));
        }
    });

    // 🔄 ordena após filtrar
    const listaOrdenada = listaFiltrada.sort((a, b) => {
        return parseDataLocal(a.data) - parseDataLocal(b.data);
    });

    const resultado = {};

    listaOrdenada.forEach((item) => {
        const data = parseDataLocal(item.data);
        const ano = String(data.getFullYear());
        const mes = meses[data.getMonth()];

        if (!resultado[ano]) resultado[ano] = {};
        if (!resultado[ano][mes]) resultado[ano][mes] = {};

        const tamanhoMes = Object.keys(resultado[ano][mes]).length;
        resultado[ano][mes][tamanhoMes] = item;
    });

    return resultado;
}


function agruparPor21Dias(dadosAgrupados) {

    function parseDataLocal(dataStr) {
        const [ano, mes, dia] = dataStr.split("-").map(Number);
        return new Date(ano, mes - 1, dia);
    }

    function formatarDataISO(data) {
        const y = data.getFullYear();
        const m = String(data.getMonth() + 1).padStart(2, '0');
        const d = String(data.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // 🔥 NOVO: formatação BR
    function formatarDataBR(dataStr) {
        const [ano, mes, dia] = dataStr.split("-");
        return `${dia}/${mes}/${ano}`;
    }

    // 🔥 pega hoje (zerado)
    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    // 🔥 encontra o sábado da semana passada
    const diaSemana = hoje.getDay(); // 0=Domingo ... 6=Sábado

    const diffParaSabadoPassado = (diaSemana + 1); 
    const sabadoPassado = new Date(hoje);
    sabadoPassado.setDate(hoje.getDate() - diffParaSabadoPassado - 7);

    // 🔥 cria estrutura 0 até 21
    const resultado = {};

    for (let i = 0; i <= 21; i++) {
        const dataAtual = new Date(sabadoPassado);
        dataAtual.setDate(sabadoPassado.getDate() + i);

        resultado[i] = {
            data: formatarDataISO(dataAtual), // 👈 permanece ISO
            itens: []
        };
    }

    // 🔥 percorre seus dados
    for (const ano in dadosAgrupados) {
        for (const mes in dadosAgrupados[ano]) {
            const itens = dadosAgrupados[ano][mes];

            for (const key in itens) {
                const item = itens[key];
                const dataItem = parseDataLocal(item.data);

                const diff = Math.floor((dataItem - sabadoPassado) / (1000 * 60 * 60 * 24));

                if (diff >= 0 && diff <= 21) {
                    resultado[diff].itens.push({
                        ...item,
                        data: formatarDataBR(item.data) // 👈 AQUI está a mudança
                    });
                }
            }
        }
    }

    return resultado;
}


function filtrarPorDescricao21Dias(filtros, dados, conjunto = false) {
    if (!Array.isArray(filtros)) return dados;

    const resultado = {};

    // normaliza filtros
    const filtrosTratados = filtros.map(f => f.toLowerCase());

    // função de comparação
    const corresponde = (item, txt) => {
        txt = txt.toLowerCase();

        const empresa = item.empresa.toLowerCase();
        const destinatario = item.destinatario.toLowerCase();
        const valor = String(item.valor).toLowerCase();
        const data = item.data.toLowerCase();

        return (
            empresa.includes(txt) ||
            destinatario.includes(txt) ||
            valor.includes(txt) ||
            data.includes(txt)
        );
    };

    for (const dia in dados) {
        const diaObj = dados[dia];

        // copia estrutura
        resultado[dia] = {
            data: diaObj.data,
            itens: []
        };

        diaObj.itens.forEach(item => {
            let mostrar;

            if (filtrosTratados.length === 0) {
                mostrar = true;
            } else if (conjunto) {
                mostrar = filtrosTratados.every(f => corresponde(item, f));
            } else {
                mostrar = filtrosTratados.some(f => corresponde(item, f));
            }

            if (mostrar) {
                resultado[dia].itens.push(item);
            }
        });
    }
    renderizarCronograma21Dias(resultado);
}

function renderizarCronograma21Dias(dados) {

  function formatarDataBRCompleta(dataStr) {
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function parseDataLocal(dataStr) {
    const [ano, mes, dia] = dataStr.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  function diferencaDias(data) {
    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    const alvo = new Date(data);
    alvo.setHours(0,0,0,0);

    return Math.floor((alvo - hoje) / (1000 * 60 * 60 * 24));
  }

  function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  function ehHoje(dataStr) {
    const [ano, mes, dia] = dataStr.split("-").map(Number);
    const data = new Date(ano, mes - 1, dia);
    return data.getTime() === hoje.getTime();
  }

  document.getElementById("Cronograma").innerHTML = "";
  const container = document.getElementById("Cronograma");

  const tabela = document.createElement("table");
  tabela.border = "1";
  tabela.style.width = "100%";
  tabela.style.marginTop = "20px";
  tabela.style.textAlign = "center";

  const diasHeader = ["Sáb","Dom","Seg","Ter","Qua","Qui","Sex"];

  const trHeader = document.createElement("tr");
  diasHeader.forEach(dia => {
    const th = document.createElement("th");
    th.innerText = dia;
    th.style.backgroundColor = "#1976d2";
    th.style.color = "white";
    trHeader.appendChild(th);
  });
  tabela.appendChild(trHeader);

  // 🔁 semanas
  for (let inicio = 0; inicio <= 14; inicio += 7) {

    let totalSemana = 0;

    // 📅 datas da semana
    const dataInicio = formatarDataBRCompleta(dados[inicio].data);
    const dataFim = formatarDataBRCompleta(dados[inicio + 6].data);

    // 🔥 calcula total ANTES de renderizar
    for (let i = 0; i < 7; i++) {
      const diaObj = dados[inicio + i];

      const totalDia = diaObj.itens.reduce((acc, item) => {
        const valor = Number(item.valor);

        if (contabilizarPagosCronograma && item.status === true) {
          return acc;
        }

        return acc + valor;
      }, 0);

      totalSemana += totalDia;
    }

    // 🔥 LINHA TOTAL DA SEMANA (AGORA VEM PRIMEIRO)
    const trTotalSemana = document.createElement("tr");
    const tdTotal = document.createElement("td");

    tdTotal.colSpan = 7;
    tdTotal.style.backgroundColor = "#333";
    tdTotal.style.color = "white";
    tdTotal.style.fontWeight = "bold";
    tdTotal.style.textAlign = "center";

    tdTotal.innerText = `Valor Total da Semana (${dataInicio} até ${dataFim}): ${formatarMoeda(totalSemana)}`;

    trTotalSemana.appendChild(tdTotal);
    tabela.appendChild(trTotalSemana);

    // 🔵 LINHA DAS DATAS
    const trDatas = document.createElement("tr");

    for (let i = 0; i < 7; i++) {
      const diaObj = dados[inicio + i];
      const td = document.createElement("td");

      const totalDia = diaObj.itens.reduce((acc, item) => {
        const valor = Number(item.valor);

        if (contabilizarPagosCronograma && item.status === true) {
          return acc;
        }

        return acc + valor;
      }, 0);

      td.innerHTML = `
        <strong>${formatarDataBRCompleta(diaObj.data)}</strong><br>
        Total do Dia: ${formatarMoeda(totalDia)}
      `;

      td.style.backgroundColor = "#0a7f00";
      td.style.color = "white";
      //td.style.fontWeight = "bold";
      td.style.textAlign = "center";

      if (ehHoje(diaObj.data)) {
        td.style.color = "#ffeb3b";
        td.style.fontWeight = "bold";
      }

      trDatas.appendChild(td);
    }

    tabela.appendChild(trDatas);

    // 🔢 ITENS
    let maxLinhas = 0;
    for (let i = 0; i < 7; i++) {
      maxLinhas = Math.max(maxLinhas, dados[inicio + i].itens.length);
    }

    for (let linha = 0; linha < maxLinhas; linha++) {
      const tr = document.createElement("tr");

      for (let i = 0; i < 7; i++) {
        const diaObj = dados[inicio + i];
        const item = diaObj.itens[linha];

        const td = document.createElement("td");

        if (item) {
          const dataISO = item.data.split("/").reverse().join("-");
          const dataObj = parseDataLocal(dataISO);
          const diffDias = diferencaDias(dataObj);

          td.innerText = `${item.empresa} - ${item.destinatario} - ${formatarMoeda(item.valor)}`;
          td.style.textAlign = "left";

          if (item.status === true) {
            td.style.backgroundColor = "#2196F3";
            td.style.color = "white";
          } else if (diffDias <= 0) {
            td.style.backgroundColor = "#f44336";
            td.style.color = "white";
          } else if (diffDias <= 1) {
            td.style.backgroundColor = "#ffeb3b";
          }
        }

        tr.appendChild(td);
      }

      tabela.appendChild(tr);
    }
  }

  container.appendChild(tabela);
}

let hoje = new Date(); let carregou = false;

function addLinhaCadastro(){
    const tabelaCorpo = document.getElementById(`tabela-cadastro`);

    const novaLinha = document.createElement('tr');
    novaLinha.className = 'linha-cadastro'
    novaLinha.innerHTML = `
        <td><input type="text" class="descricao-input empresa-input"></td>
        <td><input type="text" class="descricao-input destinatario-input"></td>
        <td><input placeholder="Valor" class="valor-input" data-valor="" onblur="formatarMoeda(this)" value="R$ 0,00"></td>
        <td><input type="date" class="data-input" value="${hoje.toISOString().slice(0,10)}"></td>
        <td><input type="checkbox" class="checkbox status-input"></td>
        <td><button class="remover-linha">Remover</button></td>
    `;
    
    if (!carregou) {tabelaCorpo.appendChild(novaLinha);}
    else {tabelaCorpo.insertBefore(novaLinha, tabelaCorpo.firstChild);}

    novaLinha.querySelector('.remover-linha').addEventListener('click', () => {
        tabelaCorpo.removeChild(novaLinha);
    });
}

function criarDicionarioCadastro (){
    var tabela = document.getElementById('tabela-cadastro');
    var linhas = tabela.getElementsByTagName('tr');
    var dicionario = {};

    for (let i = 0; i < linhas.length; i++) {
        const celulas = linhas[i].getElementsByTagName('td');
        var empresa = celulas[0].querySelector('.empresa-input').value;
        var destinatario = celulas[1].querySelector('.destinatario-input').value;
        var valor = celulas[2].querySelector('.valor-input').getAttribute('data-valor');
        var data = celulas[3].querySelector('.data-input').value;
        var status = celulas[4].querySelector('.status-input').checked;

        dicionario[i] = {
            empresa: empresa,
            destinatario: destinatario,
            valor: valor,
            data: data,
            status: status,
        };
    }
    return dicionario;
}


async function BaixarDadosCadastrados() {

    function converterData(data) {
      if (!data) return null;

      return new Date(data + "T12:00:00");
    }

    function converterNumero(valor) {
        if (!valor) return 0;

        // troca vírgula por ponto e transforma em número
        return parseFloat(valor.toString().replace(',', '.'));
    }

    const dicionarioCartoes = criarDicionarioCadastro();

    const DadosCadastrados = [
        ['Empresa', 'Destinatário', 'Valor', 'Data', 'Paga']
    ];

    Object.values(dicionarioCartoes).forEach(dados => {
        DadosCadastrados.push([
            dados.empresa,
            dados.destinatario,
            converterNumero(dados.valor),
            converterData(dados.data),
            dados.status ? 'Sim' : 'Nao'
        ]);
    });

    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet(DadosCadastrados);

    // 👉 aplicar formatação nas células
    Object.keys(sheet).forEach(cell => {
        if (cell.startsWith('C')) { // coluna Valor
            sheet[cell].z = 'R$ #,##0.00';
        }

        if (cell.startsWith('D')) { // coluna Data
            sheet[cell].z = 'dd/mm/yyyy';
        }
    });

    XLSX.utils.book_append_sheet(workbook, sheet, "Dados");
    XLSX.writeFile(workbook, "Dados_Cadastrados.xlsx");
}


document.getElementById("btnImportarExcel")
  .addEventListener("click", selecionarELerExcel)

function selecionarELerExcel() {
  const input = document.createElement("input")
  input.type = "file"
  input.accept = ".xlsx,.xls"

  input.onchange = function (event) {
    const arquivo = event.target.files[0]
    if (!arquivo) return

    const leitor = new FileReader()

    leitor.onload = function (e) {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: "array" })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]

        // Lê de A2 até E (até acabar as linhas)
        const linhas = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          range: "A2:E100000",
          blankrows: false
        })

        const dicionarioValidos = {}

        let contador = 1;
        linhas.forEach((linha, index) => {
          const linhaExcel = index + 2

          const empresa = linha[0]
          const destinatario = linha[1]
          const valor = linha[2]
          const data = linha[3]
          const status = linha[4] || '';
          let status_ = false

          const data_ = validarDataExcel(data)
          if (!data_) return

          const valorNum = Number(valor)
          if (isNaN(valorNum) || valorNum <= 0) return

          if (status.toLowerCase() == 'sim') {
            status_ = true
          }

          dicionarioValidos[contador] = {
            empresa,
            destinatario,
            valorNum,
            data_,
            status_,
          }
            contador++;
        })

        adicionarDadosCadastradosImportados(dicionarioValidos);

      } catch (erro) {
        console.error(erro)
        alert("Erro ao ler a planilha.")
      }
    }

    leitor.onerror = function () {
      alert("Erro ao ler o arquivo.")
    }

    leitor.readAsArrayBuffer(arquivo)
  }

  input.click()
}

function validarDataExcel(valor) {
  if (!valor) return null

  if (valor instanceof Date && !isNaN(valor)) {
    return valor
  }

  if (typeof valor === "number") {
    const d = XLSX.SSF.parse_date_code(valor)
    if (!d) return null
    return new Date(d.y, d.m - 1, d.d)
  }

  if (typeof valor === "string") {
    const partes = valor.split("/")
    if (partes.length !== 3) return null

    const dia = parseInt(partes[0], 10)
    const mes = parseInt(partes[1], 10) - 1
    const ano = parseInt(partes[2], 10)

    const data = new Date(ano, mes, dia)
    if (
      data.getFullYear() !== ano ||
      data.getMonth() !== mes ||
      data.getDate() !== dia
    ) return null

    return data
  }

  return null
}


function adicionarDadosCadastradosImportados(dicionario) {
    var tabelaCorpo = document.getElementById("tabela-cadastro");
    var btnsExcluir = tabelaCorpo.querySelectorAll('.remover-linha');
    btnsExcluir.forEach(btn => btn.click());
    Object.values(dicionario).forEach(dado => {
        addLinhaCadastro();
        let novaLinha = tabelaCorpo.querySelectorAll('tr')[0];

        let empresaInput = novaLinha.querySelector('.empresa-input');
        let destinatarioInput = novaLinha.querySelector('.destinatario-input');
        let valorInput = novaLinha.querySelector('.valor-input');
        let dataInput = novaLinha.querySelector('.data-input');
        let statusInput = novaLinha.querySelector('.status-input');

        let _ = dado.valorNum.toString().replace(',', '');
        dado.valorNum = _.replace('.', ',');
        valorInput.value = dado.valorNum;

        empresaInput.value = dado.empresa;
        destinatarioInput.value = dado.destinatario;
        statusInput.checked = dado.status_;

        const data = new Date(dado.data_);
        const dataFormatada = data.toISOString().split('T')[0];
        dataInput.value = dataFormatada;

        formatarMoeda(valorInput);

        novaLinha.style.backgroundColor = "rgba(211, 249, 216, 0.5)";
        novaLinha.style.color = "black";
    });
}


function formatarMoeda(input) {
    let valor = input.value;

    valor = valor.replace(/[^\d,]/g, '');
    valor = valor.replace(",", ".");
    let _valor = parseFloat(valor).toFixed(2);
    valor = formatarResultado(_valor.toString(), 2);

    if (valor === 'NaN,00') {valor = '0,00'}
    let valordado = valor.replace('.', '');
    input.setAttribute('data-valor', valordado.replace(',', '.'));
    input.value = `R$ ${valor}`;

}

function formatarResultado(texto, numeroCasasDecimais) {
    // garante número
    let numero = Number(texto);

    // fixa casas decimais
    let base = numero.toFixed(numeroCasasDecimais);

    let partes = base.split(".");
    let resultado = "";

    let antes = partes[0].replace("-", "").split("").reverse().join("");

    // adiciona separador de milhar
    for (let t = 0; t < antes.length; t++) {
        if (t > 0 && t % 3 === 0) {
            resultado += ".";
        }
        resultado += antes[t];
    }

    resultado = resultado.split("").reverse().join("");

    // recoloca sinal negativo se existir
    if (numero < 0) {
        resultado = "-" + resultado;
    }

    // parte decimal sempre com tamanho correto
    if (numeroCasasDecimais > 0) {
        resultado += "," + partes[1];
    }

    return resultado;
}


function salvarDicionario() {
  let dicionarioDados = criarDicionarioCadastro();

  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const ano = agora.getFullYear();
  const horas = String(agora.getHours()).padStart(2, '0');
  const minutos = String(agora.getMinutes()).padStart(2, '0');
  const segundos = String(agora.getSeconds()).padStart(2, '0');
  let dataCompleta = `${dia}/${mes}/${ano} - ${horas}:${minutos}:${segundos}`;
  
  let dados = {
      ulitmaHoraSalvo: dataCompleta,
      dicionarioDados: dicionarioDados,
  };

  const texto = JSON.stringify(dados, null, 2);
  const blob = new Blob([texto], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `Dados Cadastrados - Salvo:${dia}/${mes}/${ano}.txt`;
  a.click();

  URL.revokeObjectURL(url);

  notificacaoSalvamento(); // Opcional: sua função de feedback visual
  salvarProgresso(dados); // Chama a função para salvar o progresso

  // ✅ Salvar também no JSONBin
    fetch("https://api.jsonbin.io/v3/b/69db7271856a68218925b784", {
    method: "PUT",
    headers: {
        "Content-Type": "application/json",
        "X-Master-Key": "$2a$10$D1fPJRXoywaWqqf1DhR6zeNjODxL3ASitdO5To2teDxjlJ.MTawV2"
    },
    body: JSON.stringify(dados)
    })
    .then(response => response.json())
    .then(res => {
    console.log("Salvo no JSONBin:", res);
    })
    .catch(err => {
    console.error("Erro ao salvar no JSONBin:", err);
    });
}

var listaNotificacaoExplicacaoLinha = [];

function notificacaoSalvamento () {
    if (listaNotificacaoExplicacaoLinha.length > 0) {
        let toastRemover = listaNotificacaoExplicacaoLinha.pop();
        if (document.body.contains(toastRemover)) {
            toastRemover.style.animation = "fadeOut 0.5s ease-in-out";
            setTimeout(() => toastRemover.remove(), 500);
            listaNotificacaoExplicacaoLinha = listaNotificacaoExplicacaoLinha.filter(item => item !== toast);
        }
    }
    // Criar elemento da notificação
    let toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = "Salvo com Sucesso";

    // Criar botão de fechar
    let closeButton = document.createElement("button");
    closeButton.className = 'remover-linha';
    closeButton.innerHTML = "✖";
    closeButton.onclick = function () {
        toast.style.animation = "fadeOut 0.5s ease-in-out";
        setTimeout(() => toast.remove(), 500);
        listaNotificacaoExplicacaoLinha = listaNotificacaoExplicacaoLinha.filter(item => item !== toast);
    };

    // Adicionar botão à notificação
    toast.appendChild(closeButton);

    // Adicionar à página
    document.body.appendChild(toast);

    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.style.animation = "fadeOut 0.5s ease-in-out";
            setTimeout(() => toast.remove(), 500);
        }
    }, 5000);
}

function salvarProgresso(dadosObjeto) {
  try {
    const dadosSalvos = JSON.stringify(dadosObjeto);
    localStorage.setItem('progressoSalvo', dadosSalvos);
  } catch (erro) {
    console.error("Erro ao salvar progresso no localStorage:", erro);
  }
}

async function carregarProgressoSalvo() {
  mostrarIconer('carregando');

  carregou = false;

  try {
    // 🔹 Tenta carregar do JSONBin primeiro
    /*const res = await fetch("https://api.jsonbin.io/v3/b/69db7271856a68218925b784/latest", {
      headers: {
        "X-Master-Key": "$2a$10$D1fPJRXoywaWqqf1DhR6zeNjODxL3ASitdO5To2teDxjlJ.MTawV2"
      }
    });*/

    if (!res.ok) throw new Error("Falha no JSONBin");

    const json = await res.json();
    const objeto = json.record;

    const dicionarios = parseDicionarios(objeto);
    CarregarTudo(dicionarios);

    carregou = true;
    console.log("Progresso carregado do JSONBin.");

    // 🔹 Atualiza cache local (ótima prática)
    localStorage.setItem('progressoSalvo', JSON.stringify(objeto));

    return;

  } catch (erro) {
    console.warn("JSONBin falhou — usando localStorage:", erro);
  }

  // 🔹 Fallback local
  const dadosJSON = localStorage.getItem('progressoSalvo');
  if (!dadosJSON) {
    console.warn("Nenhum progresso encontrado localmente.");
    return;
  }

  try {
    const objeto = JSON.parse(dadosJSON);
    const dicionarios = parseDicionarios(objeto);
    CarregarTudo(dicionarios);

    carregou = true;
    console.log("Progresso carregado do localStorage.");

  } catch (erro) {
    console.error("Erro ao carregar progresso local:", erro);
  }
}

function parseDicionarios(data) {
    return [
        data.dicionarioDados || {},
    ];
}

function CarregarTudo(dicionarios) {
    limparConteudo();

    function pegarLinha(idTabela){
      const tabelaCorpoReceitas = document.getElementById(idTabela);
      const linhasReceitas = tabelaCorpoReceitas.getElementsByTagName('tr');
      return linhasReceitas;
    }

    let contador = 0;

    let dicionarioDados = dicionarios[0];
    for (const [rendKey, Dados] of Object.entries(dicionarioDados)) {
      addLinhaCadastro()
      var linhas = pegarLinha('tabela-cadastro');
      const linha = linhas[contador];
      const colunas = linha.getElementsByTagName('td');
      colunas[0].querySelector('input').value = Dados.empresa;
      colunas[1].querySelector('input').value = Dados.destinatario;

      const valorInput = colunas[2].querySelector('input');
      let valor = Dados.valor.toString();
      valorInput.value = valor.replace('.',',');
      formatarMoeda(valorInput); // Formata o valor para o formato de moeda

      colunas[3].querySelector('input').value = Dados.data;
      colunas[4].querySelector('input').checked = Dados.status;

      contador++;
    }
    ordenarTodasAsPlanilhas();
    tratarDadosPaginaPrincipal();
    mostrarIconer('principal');
}

function limparConteudo() {
    // Remover todas as linhas das tabelas
    var tabelaCadastro = document.getElementById('tabela-cadastro');

    if (tabelaCadastro) {
        tabelaCadastro.innerHTML = ''; // Remove todo o conteúdo da tabela
    }
}

document.getElementById('logoutButton').addEventListener('click', selecionarElerTXT);

function selecionarElerTXT() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.txt';

  input.onchange = function (event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();

    leitor.onload = async function (e) {
      const conteudo = e.target.result;

      try {
        const objeto = JSON.parse(conteudo);

        // ✅ Salva local
        localStorage.setItem('dadosSalvos', JSON.stringify(objeto));
        localStorage.setItem('deveCarregar', 'sim');

        // ✅ Envia para JSONBin
        try {
          await fetch("https://api.jsonbin.io/v3/b/69db7271856a68218925b784", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-Master-Key": "$2a$10$D1fPJRXoywaWqqf1DhR6zeNjODxL3ASitdO5To2teDxjlJ.MTawV2",
            },
            body: JSON.stringify(objeto)
          });

          console.log("Arquivo enviado para JSONBin.");

        } catch (erroCloud) {
          console.warn("Falha ao enviar para JSONBin — continuando local:", erroCloud);
        }

        // ✅ Recarrega página
        location.reload();

      } catch (erro) {
        alert("Não foi possível carregar o arquivo.");
      }
    };

    leitor.onerror = function () {
      alert("Erro ao ler o arquivo.");
    };

    leitor.readAsText(arquivo);
  };

  input.click();
}


let barraFiltroBoletins = criarBarraDeFiltros('filtrosCadastro', filtrarPorDescricao, true);


function criarBarraDeFiltros(containerId, callbackQuandoAtualizar, tipo = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Digite um filtro...';
  input.classList.add('input-filtro');
  
  let select = null; // ← declare aqui

  if (!tipo) {
    select = document.createElement('select'); // ← e inicialize aqui
    select.classList.add('filtroBoletinsTipo', 'descricao-input');

    const opcoes = [
      { value: '', label: 'Selecione' },
      { value: 'cartao', label: 'Cartões' },
      { value: 'receita', label: 'Receitas' },
      { value: 'dividas-diversas', label: 'Dívidas Diversas' },
      { value: 'investimento', label: 'Investimento' },
      { value: 'cambio', label: 'Câmbio' },
      { value: 'cofrinho', label: 'Cofrinho' },
      { value: 'caixa', label: 'Caixa' },
      { value: 'movimentacao-entrada', label: 'Movimentação de Entrada' },
      { value: 'movimentacao-saida', label: 'Movimentação de Saída' }
    ];

    opcoes.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      select.appendChild(option);
    });
  }
  

  const modoCheckbox = document.createElement('input');
  modoCheckbox.type = 'checkbox';
  modoCheckbox.checked = true;
  modoCheckbox.title = "Modo conjunto (todos os filtros devem coincidir)";
  modoCheckbox.classList.add('modo-checkbox');

  const modoLabel = document.createElement('label');
  modoLabel.textContent = 'Conjunto ';
  modoLabel.appendChild(modoCheckbox);

  const btnLimpar = document.createElement('button');
    btnLimpar.textContent = 'Limpar filtros';
    btnLimpar.classList.add('btn-limpar-filtros', 'remover-linha');
    btnLimpar.onclick = () => {
        filtros.length = 0; // zera o array
        const chips = container.querySelectorAll('.chip');
        chips.forEach(chip => container.removeChild(chip));
        notificarAtualizacao();
    };

    container.appendChild(btnLimpar);

  container.classList.add('filtro-container');
  container.appendChild(modoLabel);
  container.appendChild(input);
  if (!tipo) {container.appendChild(select)};

  const filtros = [];

  function notificarAtualizacao() {
    callbackQuandoAtualizar?.([...filtros], modoCheckbox.checked);
  }

  function criarChip(valorFiltro, textoExibicao = null) {
    const valor = valorFiltro.trim().toLowerCase();
    if (!valor || filtros.includes(valor)) return;

    filtros.push(valor);

    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.textContent = textoExibicao || valor;

    const btn = document.createElement('span');
    btn.className = 'close-btn';
    btn.textContent = '×';
    btn.onclick = () => {
      container.removeChild(chip);
      const index = filtros.indexOf(valor);
      if (index > -1) filtros.splice(index, 1);
      notificarAtualizacao();
    };

    chip.appendChild(btn);
    container.insertBefore(chip, input);
    input.value = '';
    notificarAtualizacao();
  }

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      criarChip(input.value);
    }
  });

  input.addEventListener('blur', function () {
    criarChip(input.value);
  });
  
  if (!tipo){
    select.addEventListener('change', function () {
      if (select.value) {
        const selectedOption = select.options[select.selectedIndex];
        criarChip(selectedOption.value, selectedOption.textContent);
        select.value = '';
      }
    });
  }
  
  modoCheckbox.addEventListener('change', notificarAtualizacao);

  return {
    getFiltros: () => ({
      filtros: [...filtros],
      modoConjunto: modoCheckbox.checked
    }),
    adicionarFiltro: criarChip,
    limparTodos: () => {
      filtros.length = 0;
      const chips = container.querySelectorAll('.chip');
      chips.forEach(chip => container.removeChild(chip));
      notificarAtualizacao();
    },
    forcarAtualizacao: notificarAtualizacao // ← aqui está o que você precisa
  };
}



function filtrarPorDescricao(filtros, conjunto) {
  if (!Array.isArray(filtros)) return;

  document
    .querySelectorAll('.linha-cadastro')
    .forEach(tr => {
      let colunas = tr.querySelectorAll('td');

      const empresa = colunas[0].querySelector('input').value.toLowerCase();
      const destinatario = colunas[1].querySelector('input').value.toLowerCase();
      const valor = colunas[2].querySelector('input').value.toLowerCase();
      const data = colunas[3].querySelector('input').value;
      let dataFormatada = data.split('-').reverse().join('/');
      let   mostrar;

      const corresponde = txt => {
        txt = txt.toLowerCase();
        return (
          empresa.includes(txt) ||
          destinatario.includes(txt) ||
          valor.includes(txt) ||
          dataFormatada.includes(txt)
        );
      };

      if (filtros.length === 0) {
        mostrar = true;
      } else if (conjunto) {
        mostrar = filtros.every(corresponde);
      } else {
        mostrar = filtros.some(corresponde);
      }

      if (mostrar) {
        tr.style.display = '';
      } else {
        tr.style.display = 'none';
      }
    });
}

let marcadoresCheckListOcultarOuMostrar = true;
function ocultarOuMostrarMacados(){
    if (marcadoresCheckListOcultarOuMostrar){
        checkListOcultarMacados();
        marcadoresCheckListOcultarOuMostrar = false;
        document.getElementById('btnOcultarOuMostrar').innerText = "Mostrar Pagos";
    } else {
        checkListMostrarMacados();
        marcadoresCheckListOcultarOuMostrar = true;
        document.getElementById('btnOcultarOuMostrar').innerText = "Ocultar Pagos";
    }
}

function checkListOcultarMacados(){
    let checkboxes = document.querySelectorAll('#tabela-cadastro input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        const tr = checkbox.closest('tr');
        const statusFiltrado = tr.getAttribute('data-filtrado');
        if (statusFiltrado === 'false'){
            tr.style.display = 'none';
        } else if (checkbox.checked){
            tr.style.display = 'none';
        }
    });
}

function checkListMostrarMacados(){
    let checkboxes = document.querySelectorAll('#tabela-cadastro input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        const tr = checkbox.closest('tr');
        const statusFiltrado = tr.getAttribute('data-filtrado');
        if (statusFiltrado === 'false'){
            tr.style.display = 'none';
        } else if (checkbox.checked){
            tr.style.display = '';
        }
    });
}

mostrarIconer('principal');
function mostrarIconer(icone) {
    document.querySelectorAll('.div-pagina').forEach(function(div) {
        if (div.classList.contains(icone)) {
            div.classList.remove('hidden');
            div.style.width = '100%';
            div.style.height = '100%'; // Ajusta a altura para ocupar 100% do espaço
        } else {
            div.classList.add('hidden');
            div.style.width = ''; // Reseta a largura
            div.style.height = ''; // Reseta a altura
        }
    });
}

function ordenarTodasAsPlanilhas(){
    // receita
    atualizarDataValorTbody('tabela-cadastro', ['texto', 'texto', 'numero', 'data', 'checkbox', '']);
    ativarOrdenacaoTabelaGenerico('.cadastro table thead th', 'tabela-cadastro');
}

function atualizarDataValorTbody(tbodyId, tiposColunas = []) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  // ---------- PROCESSA UM TD ----------
  function processarTd(td, index) {
    const tipo = tiposColunas[index] ?? "";
    if (!tipo) return;

    const input = td.querySelector("input, select"); // agora aceita select também
    if (!input) return;

    let valor = "";

    switch (tipo) {
      case "texto":
        valor = input.value?.trim() || "";
        td.dataset.valor = valor;
        break;

      case "numero":
        valor = input.value?.trim() || "";

        if (!valor) {
          td.dataset.valor = "";
          break;
        }

        valor = valor
          .replace(/r\$\s?/i, "")
          .replace(/\./g, "")
          .replace(",", ".")
          .trim();

        td.dataset.valor = Number(valor) || 0;
        break;

      case "data":
        td.dataset.valor = input.value || "";
        break;

      case "select":
        // pega o TEXTO da opção selecionada
        if (input.tagName === "SELECT") {
          const textoSelecionado =
            input.selectedOptions?.[0]?.text?.trim() || "";
          td.dataset.valor = textoSelecionado;
        }
        break;
      
      case "checkbox":
        td.dataset.valor = input.checked;
        break;

      default:
        break;
    }
  }

  // ---------- ATUALIZA TODA TABELA ----------
  function atualizarTudo() {
    const linhas = tbody.querySelectorAll("tr");

    linhas.forEach(tr => {
      const colunas = tr.querySelectorAll("td");
      colunas.forEach((td, index) => processarTd(td, index));
    });
  }

  atualizarTudo();

  // ---------- AUTO ATUALIZA AO EDITAR ----------
  if (tbody.dataset.autoValorAtivo) return;
  tbody.dataset.autoValorAtivo = "true";

  tbody.addEventListener("input", atualizarCelula);
  tbody.addEventListener("change", atualizarCelula);
  tbody.addEventListener("blur", atualizarCelula, true);

  function atualizarCelula(event) {
    const campo = event.target.closest("input, select"); // agora aceita select
    if (!campo) return;

    const tr = campo.closest("tr");
    if (!tr) return;

    const colunas = Array.from(tr.children);

    // executa depois de qualquer cálculo ou atualização da linha
    requestAnimationFrame(() => {
      colunas.forEach((td, i) => processarTd(td, i));
    });
  }

	// ---------- OBSERVA NOVAS LINHAS AUTOMATICAMENTE ----------
	if (!tbody.dataset.observandoLinhas) {
		tbody.dataset.observandoLinhas = "true";

		const observer = new MutationObserver(mutations => {
			mutations.forEach(mutation => {
				mutation.addedNodes.forEach(node => {
					if (node.nodeName === "TR") {
						const colunas = node.querySelectorAll("td");

						// espera DOM estabilizar (inputs e valores carregarem)
						requestAnimationFrame(() => {
							colunas.forEach((td, i) => processarTd(td, i));
						});
					}
				});
			});
		});
		observer.observe(tbody, { childList: true });
	}
}

function ativarOrdenacaoTabelaGenerico(thsOuSeletor, tbodyId) {
  let ths;

  if (typeof thsOuSeletor === "string") {
    ths = document.querySelectorAll(thsOuSeletor);
  } else if (thsOuSeletor instanceof Element) {
    ths = [thsOuSeletor];
  } else {
    ths = thsOuSeletor;
  }

  if (!ths || !ths.length) return;

  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  const direcao = {};

  // detecta se string é data yyyy-mm-dd
  const ehDataISO = v => /^\d{4}-\d{2}-\d{2}$/.test(v);

  ths.forEach((th, colunaIndex) => {
    th.style.cursor = "pointer";

    th.addEventListener("click", () => {
      const linhas = Array.from(tbody.querySelectorAll("tr"));
      direcao[colunaIndex] = !direcao[colunaIndex];

      linhas.sort((a, b) => {
        const tdA = a.children[colunaIndex];
        const tdB = b.children[colunaIndex];

        let valorA = (tdA?.dataset.valor ?? "").trim();
        let valorB = (tdB?.dataset.valor ?? "").trim();

        // valores vazios sempre no final
        if (!valorA && !valorB) return 0;
        if (!valorA) return 1;
        if (!valorB) return -1;

        // ---------- NUMERO ----------
        const numA = parseFloat(valorA);
        const numB = parseFloat(valorB);

        if (!isNaN(numA) && !isNaN(numB) && !ehDataISO(valorA)) {
          return direcao[colunaIndex]
            ? numA - numB
            : numB - numA;
        }

        // ---------- DATA ----------
        if (ehDataISO(valorA) && ehDataISO(valorB)) {
          const timeA = new Date(valorA).getTime();
          const timeB = new Date(valorB).getTime();

          return direcao[colunaIndex]
            ? timeA - timeB
            : timeB - timeA;
        }

        // ---------- TEXTO ----------
        return direcao[colunaIndex]
          ? valorA.localeCompare(valorB, "pt-BR", { sensitivity: "base" })
          : valorB.localeCompare(valorA, "pt-BR", { sensitivity: "base" });
      });

      tbody.append(...linhas);
    });
  });
}

function ativarOrdenacaoPlanilha(tabela){

    var cabecalhos = tabela.querySelectorAll('thead th');

    cabecalhos.forEach((th, index) => {
        // evita registrar evento 2x
        if (th.dataset.ordenacaoAtiva) return;
        th.dataset.ordenacaoAtiva = true;

        // ordem inicial
        th.dataset.ordem = 'desc';

        th.style.cursor = 'pointer';

        th.addEventListener('click', () => {

            // alterna ordem
            var novaOrdem = th.dataset.ordem === 'asc' ? 'desc' : 'asc';
            th.dataset.ordem = novaOrdem;

            ordenarTabelaPlanilha(tabela, index, novaOrdem);
        });
    });
}

function ordenarTabelaPlanilha(tabela, indiceColuna, ordem) {

    var tbody = tabela.querySelector('tbody');
    var todasLinhas = Array.from(tbody.querySelectorAll('tr'));

    // linhas que não devem se mover
    var linhasFixas = todasLinhas.filter(linha =>
        linha.classList.contains('boletim-mensal-total-filtro') ||
        linha.classList.contains('boletim-mensal-saldoMesPassado') ||
        linha.offsetParent === null
    );

    // linhas que serão ordenadas
    var linhasOrdenar = todasLinhas.filter(linha =>
        !linhasFixas.includes(linha)
    );

    linhasOrdenar.sort((a, b) => {
        var valorA = obterValorCelulaPlanilha(a.children[indiceColuna]);
        var valorB = obterValorCelulaPlanilha(b.children[indiceColuna]);

        if (valorA === '' || valorB === '') return 0;

        if (typeof valorA === 'number' && typeof valorB === 'number') {
            return ordem === 'asc'
                ? valorA - valorB
                : valorB - valorA;
        }

        return ordem === 'asc'
            ? valorA.localeCompare(valorB)
            : valorB.localeCompare(valorA);
    });

    // limpa tbody
    tbody.innerHTML = '';

    // adiciona ordenadas primeiro
    linhasOrdenar.forEach(l => tbody.appendChild(l));

    // adiciona fixas no final (sempre última)
    linhasFixas.forEach(l => tbody.appendChild(l));
}

function obterValorCelulaPlanilha(celula){

    if (celula === undefined) return '';

    var elemento = celula.querySelector('[data-valor]');

    if (elemento) {
        var valor = elemento.dataset.valor;

        // se for número → retorna número
        if (!isNaN(valor)) return parseFloat(valor);

        return valor.toString().toLowerCase();
    }

    var texto = celula.textContent.trim();

    if (!isNaN(texto)) return parseFloat(texto);

    return texto.toLowerCase();
}

window.addEventListener('DOMContentLoaded', () => {
  carregou = false; // Reseta a variável carregou
  const deveCarregar = localStorage.getItem('deveCarregar');
  const dadosSalvos = localStorage.getItem('dadosSalvos');

  if (deveCarregar === 'sim' && dadosSalvos) {
    try {
      const objeto = JSON.parse(dadosSalvos);
      const dicionarios = parseDicionarios(objeto); // Sua função de conversão
      CarregarTudo(dicionarios); // Sua função principal de carregamento
      carregou = true; // Marca como carregado
      salvarProgresso(objeto); // Salva o progresso após carregar

      // Limpa os dados após carregar
      localStorage.removeItem('deveCarregar');
      localStorage.removeItem('dadosSalvos');
    } catch (erro) {
      console.error("Erro ao processar dados após o F5:", erro);
    }
  }
});
