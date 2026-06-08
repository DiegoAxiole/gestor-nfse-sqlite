import { XMLParser } from 'fast-xml-parser'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'

const _require = createRequire(
  typeof __dirname !== 'undefined' ? __dirname : fileURLToPath(new URL('.', import.meta.url))
)

const ROBOTO_FONTS = {
  normal: _require.resolve('pdfmake/build/fonts/Roboto/Roboto-Regular.ttf'),
  bold: _require.resolve('pdfmake/build/fonts/Roboto/Roboto-Medium.ttf'),
  italics: _require.resolve('pdfmake/build/fonts/Roboto/Roboto-Italic.ttf'),
  bolditalics: _require.resolve('pdfmake/build/fonts/Roboto/Roboto-MediumItalic.ttf'),
}

export interface PrestadorEndereco {
  logradouro: string
  numero: string
  bairro: string
  codigoMunicipio: string
  uf: string
  cep: string
}

export interface Prestador {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
  inscricaoMunicipal: string
  endereco: PrestadorEndereco
}

export interface TomadorEndereco {
  logradouro: string
  numero: string
  bairro: string
  codigoMunicipio: string
  uf: string
  cep: string
}

export interface Tomador {
  cpfCnpj: string
  razaoSocial: string
  email: string
  inscricaoMunicipal: string
  endereco: TomadorEndereco
}

export interface Servico {
  codigoTributacaoNacional: string
  codigoTributacaoMunicipal: string
  descricao: string
  nbs: string
  codigoMunicipioPrestacao: string
  informacoesComplementares: string
}

export interface Valores {
  valorServico: number
  descontoIncondicionado: number
  descontoCondicionado: number
  outrasRetencoes: number
  valorLiquido: number
}

export interface Impostos {
  valorBC: number
  aliquotaAplicada: number
  valorISSQN: number
  valorLiquido: number
  ibs: {
    valorBC: number
    aliquotaUF: number
    valIBSUF: number
    aliquotaMun: number
    valIBSMun: number
    valorTotalIBS: number
  }
  cbs: {
    valorBC: number
    aliquotaCBS: number
    valorCBS: number
  }
  totalCIBS: {
    valorTotalNF: number
    valorIBSTot: number
    valorIBSUF: number
    valorIBSMun: number
    valorCBS: number
  }
  pis: {
    valorBC: number
    aliquota: number
    valor: number
  }
  cofins: {
    valorBC: number
    aliquota: number
    valor: number
  }
}

export interface NfseDados {
  chaveAcesso: string
  numeroNfse: string
  numeroDps: string
  serieDps: string
  dataEmissao: string
  dataCompetencia: string
  dataProcessamento: string
  ambienteGerador: string
  tipoEmissao: string
  versao: string
  numeroDfse: string
  codigoStatus: string
  prestador: Prestador
  tomador: Tomador
  servico: Servico
  valores: Valores
  impostos: Impostos
  regimeEspecialTributacao: string
  optanteSimplesNacional: boolean
}

export interface GenerateOptions {
  ambienteGerador?: string
  hideWarnings?: boolean
  logoUrl?: string
  lgpdAtivo?: boolean
}

function cleanNamespaces(obj: any): any {
  if (obj === null || obj === void 0) return obj
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(cleanNamespaces)
  const cleanObj: Record<string, any> = {}
  for (const key of Object.keys(obj)) {
    const parts = key.split(':')
    const cleanKey = parts[parts.length - 1]
    let val = cleanNamespaces(obj[key])
    if (cleanObj[cleanKey] !== void 0) {
      if (Array.isArray(cleanObj[cleanKey])) {
        cleanObj[cleanKey].push(val)
      } else {
        cleanObj[cleanKey] = [cleanObj[cleanKey], val]
      }
    } else {
      cleanObj[cleanKey] = val
    }
  }
  return cleanObj
}

function parseFloatSafe(val: any): number {
  if (val === void 0 || val === null || val === '') return 0
  const num = typeof val === 'number' ? val : parseFloat(String(val))
  return isNaN(num) ? 0 : num
}

export function parseNfseXml(xmlString: string): NfseDados {
  if (!xmlString || xmlString.trim() === '') {
    throw new Error('O XML de entrada está vazio ou inválido.')
  }
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: true,
    trimValues: true,
  })
  const parsed = parser.parse(xmlString)
  const clean = cleanNamespaces(parsed)
  const nfseRoot = clean.NFSe || clean.nfse || clean
  const infNFSe = nfseRoot.infNFSe || nfseRoot.infNfse || nfseRoot
  if (!infNFSe) {
    throw new Error('Não foi possível localizar o elemento infNFSe no XML fornecido.')
  }
  const chaveRaw = infNFSe['@_Id'] || infNFSe['@_id'] || ''
  const chaveAcesso = chaveRaw.replace(/^NFS/i, '')
  const numeroNfse = String(infNFSe.nNFSe || infNFSe.nnfse || '')
  const numeroDfse = String(infNFSe.nDFSe || infNFSe.ndfse || '')
  const dataProcessamento = String(infNFSe.dhProc || '')
  const ambienteGerador = String(infNFSe.ambGer || '')
  const tipoEmissao = String(infNFSe.tpEmis || '')
  const versao = String(nfseRoot['@_versao'] || nfseRoot['@_Versao'] || '1.00')
  const codigoStatus = String(infNFSe.cStat || '')
  const dps = infNFSe.DPS || infNFSe.dps || {}
  const infDPS = dps.infDPS || dps.infDps || {}
  const numeroDps = String(infDPS.nDPS || infDPS.ndps || '')
  const serieDps = String(infDPS.serie || '')
  const dataEmissao = String(infDPS.dhEmi || '')
  const dataCompetencia = String(infDPS.dCompet || '')
  const emit = infNFSe.emit || {}
  const prest = infDPS.prest || {}
  const enderNacEmit = emit.enderNac || {}
  const emitEndereco: PrestadorEndereco = {
    logradouro: enderNacEmit.xLgr || '',
    numero: String(enderNacEmit.nro || ''),
    bairro: enderNacEmit.xBairro || '',
    codigoMunicipio: String(enderNacEmit.cMun || ''),
    uf: enderNacEmit.UF || '',
    cep: String(enderNacEmit.CEP || ''),
  }
  const prestador: Prestador = {
    cnpj: emit.CNPJ || emit.cnpj || prest.CNPJ || '',
    razaoSocial: emit.xNome || emit.xnome || '',
    nomeFantasia: emit.xFant || emit.xfant || '',
    inscricaoMunicipal: emit.IM || emit.im || prest.im || '',
    endereco: emitEndereco,
  }
  const toma = infDPS.toma || {}
  const endToma = toma.end || {}
  const endNacToma = endToma.endNac || {}
  const tomaEndereco: TomadorEndereco = {
    logradouro: endToma.xLgr || '',
    numero: String(endToma.nro || ''),
    bairro: endToma.xBairro || '',
    codigoMunicipio: String(endNacToma.cMun || ''),
    uf: endNacToma.UF || '',
    cep: String(endNacToma.CEP || ''),
  }
  const tomador: Tomador = {
    cpfCnpj: toma.CPF || toma.cpf || toma.CNPJ || toma.cnpj || '',
    razaoSocial: toma.xNome || toma.xnome || '',
    email: toma.email || '',
    inscricaoMunicipal: toma.IM || toma.im || '',
    endereco: tomaEndereco,
  }
  const serv = infDPS.serv || {}
  const cServ = serv.cServ || {}
  const locPrest = serv.locPrest || {}
  const infoCompl = serv.infoCompl || {}
  const servico: Servico = {
    codigoTributacaoNacional: String(cServ.cTribNac || ''),
    codigoTributacaoMunicipal: String(cServ.cTribMun || ''),
    descricao: cServ.xDescServ || '',
    nbs: String(cServ.cNBS || ''),
    codigoMunicipioPrestacao: String(locPrest.cLocPrestacao || ''),
    informacoesComplementares: infoCompl.xInfComp || '',
  }
  const valoresNfse = infNFSe.valores || {}
  const dpsValores = infDPS.valores || {}
  const vServPrest = dpsValores.vServPrest || {}
  const valorServico = parseFloatSafe(vServPrest.vServ || valoresNfse.vLiq || 0)
  const descontoIncondicionado = parseFloatSafe(dpsValores.vDescIncond || 0)
  const descontoCondicionado = parseFloatSafe(dpsValores.vDescCond || 0)
  const outrasRetencoes = parseFloatSafe(dpsValores.vOutRet || 0)
  const valorLiquido = parseFloatSafe(valoresNfse.vLiq || valorServico)
  const ibscbsTot = infNFSe.IBSCBS || infNFSe.ibscbs || {}
  const totCIBS = ibscbsTot.totCIBS || {}
  const gIBS = totCIBS.gIBS || {}
  const gIBSUFTot = gIBS.gIBSUFTot || {}
  const gIBSMunTot = gIBS.gIBSMunTot || {}
  const gCBS = totCIBS.gCBS || {}
  const ibsValues = ibscbsTot.valores || {}
  const ibsUf = ibsValues.uf || {}
  const ibsMun = ibsValues.mun || {}
  const ibsFed = ibsValues.fed || {}
  const trib = dpsValores.trib || {}
  const tribFed = trib.tribFed || {}
  const piscofins = tribFed.piscofins || {}
  const impostos: Impostos = {
    valorBC: parseFloatSafe(valoresNfse.vBC || dpsValores.vBC || 0),
    aliquotaAplicada: parseFloatSafe(valoresNfse.pAliqAplic || dpsValores.pAliq || 0),
    valorISSQN: parseFloatSafe(valoresNfse.vISSQN || dpsValores.vISS || 0),
    valorLiquido: parseFloatSafe(valoresNfse.vLiq || 0),
    ibs: {
      valorBC: parseFloatSafe(ibsValues.vBC || 0),
      aliquotaUF: parseFloatSafe(ibsUf.pIBSUF || ibsUf.pAliqEfetUF || 0),
      valIBSUF: parseFloatSafe(gIBSUFTot.vIBSUF || 0),
      aliquotaMun: parseFloatSafe(ibsMun.pIBSMun || ibsMun.pAliqEfetMun || 0),
      valIBSMun: parseFloatSafe(gIBSMunTot.vIBSMun || 0),
      valorTotalIBS: parseFloatSafe(gIBS.vIBSTot || 0),
    },
    cbs: {
      valorBC: parseFloatSafe(ibsValues.vBC || 0),
      aliquotaCBS: parseFloatSafe(ibsFed.pCBS || ibsFed.pAliqEfetCBS || 0),
      valorCBS: parseFloatSafe(gCBS.vCBS || 0),
    },
    totalCIBS: {
      valorTotalNF: parseFloatSafe(totCIBS.vTotNF || 0),
      valorIBSTot: parseFloatSafe(gIBS.vIBSTot || 0),
      valorIBSUF: parseFloatSafe(gIBSUFTot.vIBSUF || 0),
      valorIBSMun: parseFloatSafe(gIBSMunTot.vIBSMun || 0),
      valorCBS: parseFloatSafe(gCBS.vCBS || 0),
    },
    pis: {
      valorBC: parseFloatSafe(piscofins.vBCPisCofins || 0),
      aliquota: parseFloatSafe(piscofins.pAliqPis || 0),
      valor: parseFloatSafe(piscofins.vPis || 0),
    },
    cofins: {
      valorBC: parseFloatSafe(piscofins.vBCPisCofins || 0),
      aliquota: parseFloatSafe(piscofins.pAliqCofins || 0),
      valor: parseFloatSafe(piscofins.vCofins || 0),
    },
  }
  const prestReg = prest.regTrib || {}
  let regimeEspecialTributacao = String(prestReg.regEspTrib || '')
  let optanteSimplesNacional = prestReg.opSimpNac === 1 || prestReg.opSimpNac === '1'
  return {
    chaveAcesso,
    numeroNfse,
    numeroDps,
    serieDps,
    dataEmissao,
    dataCompetencia,
    dataProcessamento,
    ambienteGerador,
    tipoEmissao,
    versao,
    numeroDfse,
    codigoStatus,
    prestador,
    tomador,
    servico,
    valores: {
      valorServico,
      descontoIncondicionado,
      descontoCondicionado,
      outrasRetencoes,
      valorLiquido,
    },
    impostos,
    regimeEspecialTributacao,
    optanteSimplesNacional,
  }
}

function toStr(v: any): string {
  if (v === null || v === undefined) return ''
  return String(v)
}

function maskRazao(v: any): string {
  const s = toStr(v)
  if (!s) return s
  return s[0] + '*****'
}

function maskFull(v: any): string {
  const s = toStr(v)
  if (!s) return s
  return '*'.repeat(s.length)
}

function maskCnpj(v: any): string {
  const s = toStr(v).replace(/\D/g, '')
  if (s.length !== 14) return s || v
  return '**.***.***/****-**'
}

function maskCpf(v: any): string {
  const s = toStr(v).replace(/\D/g, '')
  if (s.length !== 11) return s || v
  return '***.***.***-**'
}

function maskDoc(v: any): string {
  const s = toStr(v).replace(/\D/g, '')
  if (s.length === 14) return maskCnpj(v)
  if (s.length === 11) return maskCpf(v)
  return maskFull(v)
}

function maskAddress(v: any): string {
  const s = toStr(v)
  if (!s) return s
  return s[0] + '*****'
}

function maskEmail(v: any): string {
  const s = toStr(v)
  if (!s) return s
  const parts = s.split('@')
  if (parts.length !== 2) return maskFull(s)
  return parts[0][0] + '*****@' + parts[1]
}

function applyLgpdMask(dados: NfseDados): NfseDados {
  const m = {
    chaveAcesso: maskFull(dados.chaveAcesso),
    numeroNfse: maskFull(dados.numeroNfse),
    numeroDps: maskFull(dados.numeroDps),
    prestador: {
      cnpj: maskCnpj(dados.prestador.cnpj),
      razaoSocial: maskRazao(dados.prestador.razaoSocial),
      nomeFantasia: dados.prestador.nomeFantasia ? maskRazao(dados.prestador.nomeFantasia) : '',
      inscricaoMunicipal: maskAddress(dados.prestador.inscricaoMunicipal),
      endereco: {
        logradouro: maskAddress(dados.prestador.endereco.logradouro),
        numero: dados.prestador.endereco.numero ? '*****' : '',
        bairro: maskAddress(dados.prestador.endereco.bairro),
        codigoMunicipio: '*****',
        uf: '**',
        cep: '*****-***',
      },
    },
    tomador: {
      cpfCnpj: maskDoc(dados.tomador.cpfCnpj),
      razaoSocial: maskRazao(dados.tomador.razaoSocial),
      email: maskEmail(dados.tomador.email),
      inscricaoMunicipal: maskAddress(dados.tomador.inscricaoMunicipal),
      endereco: {
        logradouro: maskAddress(dados.tomador.endereco.logradouro),
        numero: dados.tomador.endereco.numero ? '*****' : '',
        bairro: maskAddress(dados.tomador.endereco.bairro),
        codigoMunicipio: '*****',
        uf: '**',
        cep: '*****-***',
      },
    },
    servico: {
      descricao: '*****',
      informacoesComplementares: '*****',
      nbs: maskFull(dados.servico.nbs),
      codigoTributacaoNacional: dados.servico.codigoTributacaoNacional
        ? dados.servico.codigoTributacaoNacional[0] + '*****'
        : '',
      codigoTributacaoMunicipal: dados.servico.codigoTributacaoMunicipal
        ? dados.servico.codigoTributacaoMunicipal[0] + '*****'
        : '',
    },
  }
  return {
    ...dados,
    ...m,
    prestador: { ...dados.prestador, ...m.prestador, endereco: { ...dados.prestador.endereco, ...m.prestador.endereco } },
    tomador: { ...dados.tomador, ...m.tomador, endereco: { ...dados.tomador.endereco, ...m.tomador.endereco } },
    servico: { ...dados.servico, ...m.servico },
  } as NfseDados
}

export function formatCnpjCpf(val: any): string {
  if (val === void 0 || val === null) return ''
  const str = String(val)
  const clean = str.replace(/\D/g, '')
  if (clean.length === 11) return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  else if (clean.length === 14) return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return str
}

export function formatCep(val: any): string {
  if (val === void 0 || val === null) return ''
  const str = String(val)
  const clean = str.replace(/\D/g, '')
  if (clean.length === 8) return clean.replace(/(\d{5})(\d{3})/, '$1-$2')
  return str
}

export function formatCurrency(val: any): string {
  if (val === void 0 || val === null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

export function formatPercentage(val: any): string {
  if (val === void 0 || val === null) return '0,00%'
  return new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(val) + '%'
}

export function formatDateTime(val: any): string {
  if (!val) return '-'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) {
      const match = val.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
      if (match) return `${match[3]}/${match[2]}/${match[1]} ${match[4]}:${match[5]}:${match[6]}`
      return val.substring(0, 10).split('-').reverse().join('/')
    }
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  } catch {
    return val
  }
}

export function formatDateOnly(val: any): string {
  if (!val) return '-'
  try {
    const parts = val.substring(0, 10).split('-')
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
    return val
  } catch {
    return val
  }
}

export function formatChaveAcesso(val: any): string {
  if (val === void 0 || val === null) return ''
  const str = String(val)
  const clean = str.replace(/\D/g, '')
  return clean.replace(/(.{4})/g, '$1 ').trim()
}

export function getDanfseDefinition(dados: NfseDados, options?: GenerateOptions) {
  if (options?.lgpdAtivo) {
    dados = applyLgpdMask(dados)
  }
  const activeAmbiente = options?.ambienteGerador || dados.ambienteGerador || '1'
  const styles = {
    docTitle: { fontSize: 10, bold: true, alignment: 'center' as const },
    subDocTitle: { fontSize: 7, alignment: 'center' as const },
    label: { fontSize: 6, color: '#444444', bold: true },
    labelRight: { fontSize: 6, color: '#444444', bold: true, alignment: 'right' as const },
    value: { fontSize: 8, color: '#000000', bold: true },
    valueRight: { fontSize: 8, color: '#000000', bold: true, alignment: 'right' as const },
    valueCenter: { fontSize: 8, color: '#000000', bold: true, alignment: 'center' as const },
    valueDescription: { fontSize: 7.5, color: '#222222' },
    sectionHeader: { fontSize: 8, bold: true, color: '#1F2937', margin: [0, 4, 0, 2] as [number, number, number, number] },
  }
  const defaultStyle = { font: 'Roboto' }
  const buildCell = (label: string, value: any, valStyle = 'value', labelStyle = 'label') => {
    return {
      stack: [
        { text: label.toUpperCase(), style: labelStyle },
        Array.isArray(value) ? { stack: value } : { text: value || '-', style: valStyle },
      ],
      margin: [2, 1, 2, 1] as [number, number, number, number],
    }
  }
  const content: any[] = []
  const portalUrl = `https://www.nfse.gov.br/ConsultaPublica/?tpc=1&chave=${dados.chaveAcesso}`
  const logoCell = options?.logoUrl
    ? { image: options.logoUrl, fit: [50, 50] as [number, number], alignment: 'center' as const, margin: [0, 3, 0, 3] as [number, number, number, number] }
    : {
        stack: [
          { text: 'DANFSe', style: 'docTitle', color: '#1F2937', fontSize: 8.5 },
          { text: 'Nacional 2026', fontSize: 5.5, color: '#666666', bold: true, alignment: 'center' as const },
          { text: 'República Federativa do Brasil', fontSize: 4.5, color: '#777777', alignment: 'center' as const, margin: [0, 3, 0, 0] as [number, number, number, number] },
        ],
        alignment: 'center' as const,
        margin: [0, 3, 0, 3] as [number, number, number, number],
      }
  content.push({
    style: 'tableExample',
    table: {
      widths: [65, '*', 100, 60],
      body: [
        [
          logoCell,
          {
            stack: [
              { text: 'DOCUMENTO AUXILIAR DA NOTA FISCAL DE SERVIÇOS ELETRÔNICA', style: 'docTitle', margin: [0, 1, 0, 1] as [number, number, number, number], fontSize: 8.5 },
              { text: 'DANFSe Nacional', style: 'docTitle', color: '#4B5563', fontSize: 8.5 },
              { text: '', fontSize: 5 },
              { text: '', fontSize: 5 },
            ],
            margin: [0, 1, 0, 1] as [number, number, number, number],
          },
          {
            table: {
              widths: ['*'],
              body: [
                [{ stack: [{ text: 'NÚMERO DA NOTA FISCAL', style: 'label' }, { text: dados.numeroNfse || '-', style: 'docTitle', fontSize: 10, color: '#1E3A8A' }] }],
                [{ stack: [{ text: 'DATA E HORA DO COMPROVANTE', style: 'label' }, { text: formatDateTime(dados.dataProcessamento), style: 'value', fontSize: 7.5 }] }],
              ],
            },
            layout: 'noBorders',
          },
          {
            alignment: 'center' as const,
            margin: [1, 2, 1, 1] as [number, number, number, number],
            stack: [
              { qr: portalUrl, fit: 45, alignment: 'center' as const },
              { text: 'VALIDE NO PORTAL', fontSize: 4.5, bold: true, color: '#1E3A8A', margin: [0, 2, 0, 0] as [number, number, number, number], alignment: 'center' as const },
            ],
          },
        ],
      ],
    },
    layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => '#4B5563', vLineColor: '#4B5563' },
  })
  content.push({
    table: {
      widths: ['*', 120, 100],
      body: [
        [
          buildCell('CHAVE DE ACESSO DA NFSe', formatChaveAcesso(dados.chaveAcesso)),
          buildCell('NÚMERO DO DPS', dados.numeroDps),
          buildCell('SÉRIE DO DPS', dados.serieDps || 'Única'),
        ],
        [
          buildCell('CÓDIGO DE VERIFICAÇÃO / AUTENTICAÇÃO', dados.codigoStatus === '100' ? 'AUTORIZADA (100)' : 'PROCESSADA'),
          buildCell('DATA COMPETÊNCIA', formatDateOnly(dados.dataCompetencia)),
          buildCell('REGIME TRIBUTAÇÃO', dados.optanteSimplesNacional ? 'Simples Nacional' : 'Regime Geral'),
        ],
      ],
    },
    layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => '#9CA3AF', vLineColor: () => '#9CA3AF' },
    margin: [0, 4, 0, 0] as [number, number, number, number],
  })
  content.push({ text: 'PRESTADOR DO SERVIÇO', style: 'sectionHeader' })
  content.push({
    table: {
      widths: ['*', 140],
      body: [
        [buildCell('NOME / RAZÃO SOCIAL', dados.prestador.razaoSocial), buildCell('CNPJ', formatCnpjCpf(dados.prestador.cnpj || ''))],
        [buildCell('ENDEREÇO', `${dados.prestador.endereco?.logradouro}, ${dados.prestador.endereco?.numero || 'S/N'} - ${dados.prestador.endereco?.bairro || ''}`), buildCell('MUNICÍPIO / UF', `${dados.prestador.endereco?.uf ? `${dados.prestador.endereco.uf}` : 'Rio de Janeiro/RJ'}`)],
        [buildCell('CEP', formatCep(dados.prestador.endereco?.cep || '')), buildCell('INSCRIÇÃO MUNICIPAL', dados.prestador.inscricaoMunicipal || 'Isento')],
      ],
    },
    layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => '#D1D5DB', vLineColor: () => '#D1D5DB' },
  })
  content.push({ text: 'TOMADOR DO SERVIÇO', style: 'sectionHeader' })
  content.push({
    table: {
      widths: ['*', 140],
      body: [
        [buildCell('NOME / RAZÃO SOCIAL', dados.tomador.razaoSocial), buildCell('CPF / CNPJ', formatCnpjCpf(dados.tomador.cpfCnpj || ''))],
        [buildCell('ENDEREÇO', `${dados.tomador.endereco?.logradouro || ''}, ${dados.tomador.endereco?.numero || 'S/N'} - ${dados.tomador.endereco?.bairro || ''}`), buildCell('MUNICÍPIO / UF', `${dados.tomador.endereco?.uf ? `${dados.tomador.endereco.uf}` : 'Lucrécia/RN'}`)],
        [buildCell('CEP / EMAIL', `${formatCep(dados.tomador.endereco?.cep || '')} ${dados.tomador.email ? `| ${dados.tomador.email}` : ''}`), buildCell('INSCRIÇÃO MUNICIPAL / OUTROS', dados.tomador.inscricaoMunicipal || 'Isento / Não Informado')],
      ],
    },
    layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => '#D1D5DB', vLineColor: () => '#D1D5DB' },
  })
  content.push({ text: 'DESCRIÇÃO DOS SERVIÇOS', style: 'sectionHeader' })
  content.push({
    table: {
      widths: ['*'],
      body: [
        [{ stack: [{ text: dados.servico.descricao || 'Sem descrição disponível.', style: 'valueDescription' }], minHeight: 110, margin: [4, 6, 4, 6] as [number, number, number, number] }],
      ],
    },
    layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => '#4B5563', vLineColor: () => '#4B5563' },
  })
  content.push({ text: 'TRIBUTAÇÃO MUNICIPAL (ISSQN)', style: 'sectionHeader', color: '#065F46' })
  content.push({
    table: {
      widths: ['*', '*', '*', '*', '*', '*'],
      body: [
        [
          buildCell('CÓD. TRIB. NACIONAL', dados.servico.codigoTributacaoNacional),
          buildCell('CÓD. LISTA SERV. MUN.', dados.servico.codigoTributacaoMunicipal || 'Não Aplicável'),
          buildCell('BASE DE CÁLCULO ISSQN', formatCurrency(dados.impostos.valorBC)),
          buildCell('ALÍQUOTA APLICADA', formatPercentage(dados.impostos.aliquotaAplicada)),
          buildCell('VALOR DO ISSQN DEVIDO', formatCurrency(dados.impostos.valorISSQN)),
          buildCell('MUNICÍPIO PRESTAÇÃO', 'Rio de Janeiro / RJ'),
        ],
      ],
    },
    layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => '#4B5563', vLineColor: () => '#4B5563' },
  })
  content.push({ text: 'TRIBUTAÇÃO FEDERAL', style: 'sectionHeader', color: '#1E3A8A' })
  content.push({
    table: {
      widths: ['*', '*', '*', '*', '*', '*'],
      body: [
        [
          buildCell('BC PIS/COFINS', formatCurrency(dados.impostos.pis?.valorBC)),
          buildCell('PIS RETIDO', `${formatCurrency(dados.impostos.pis?.valor)} (${formatPercentage(dados.impostos.pis?.aliquota)})`),
          buildCell('COFINS RETIDO', `${formatCurrency(dados.impostos.cofins?.valor)} (${formatPercentage(dados.impostos.cofins?.aliquota)})`),
          buildCell('INSS RETIDO', 'R$ 0,00 (0,00%)'),
          buildCell('IRRF RETIDO', 'R$ 0,00 (0,00%)'),
          buildCell('CSLL RETIDA', 'R$ 0,00 (0,00%)'),
        ],
      ],
    },
    layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => '#4B5563', vLineColor: () => '#4B5563' },
  })
  const valorServicoBase = dados.valores.valorServico || 0
  const fedAproxVal = valorServicoBase * 0.1345
  const munAproxVal = valorServicoBase * 0.03
  const totAproxVal = fedAproxVal + munAproxVal
  content.push({ text: 'TOTAIS APROXIMADOS DOS TRIBUTOS (LEI DAS FISCAIS Nº 12.741/2012 / IBPT)', style: 'sectionHeader', color: '#B45309' })
  content.push({
    table: {
      widths: ['*', '*', '*'],
      body: [
        [
          buildCell('TRIBUTOS FEDERAIS APROX. (13,45%)', formatCurrency(fedAproxVal)),
          buildCell('TRIBUTOS MUNICIPAIS APROX. (3,00%)', formatCurrency(munAproxVal)),
          buildCell('VALOR TOTAL APROXIMADO DE IMPOSTOS (16,45%)', formatCurrency(totAproxVal)),
        ],
      ],
    },
    layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => '#4B5563', vLineColor: () => '#4B5563' },
  })
  const hasIbsCbs = !!(dados.impostos.ibs?.valorTotalIBS || dados.impostos.cbs?.valorCBS)
  if (hasIbsCbs) {
    content.push({ text: 'REFORMA TRIBUTÁRIA: IBS & CBS (LEI DE TRANSIÇÃO)', style: 'sectionHeader', color: '#1E3A8A' })
    content.push({
      table: {
        widths: ['*', '*', '*', '*', '*', '*', '*'],
        body: [
          [
            buildCell('BASE DE CÁLCULO', formatCurrency(dados.impostos.ibs?.valorBC)),
            buildCell('ALÍQ. IBS UF', formatPercentage(dados.impostos.ibs?.aliquotaUF)),
            buildCell('VALOR IBS UF', formatCurrency(dados.impostos.ibs?.valIBSUF)),
            buildCell('ALÍQ. IBS MUN', formatPercentage(dados.impostos.ibs?.aliquotaMun)),
            buildCell('VALOR IBS MUN', formatCurrency(dados.impostos.ibs?.valIBSMun)),
            buildCell('ALÍQ. CBS', formatPercentage(dados.impostos.cbs?.aliquotaCBS)),
            buildCell('VALOR CBS', formatCurrency(dados.impostos.cbs?.valorCBS)),
          ],
        ],
      },
      layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => '#4B5563', vLineColor: () => '#4B5563' },
    })
  }
  content.push({ text: 'VALORES TOTAIS DA NOTA FISCAL', style: 'sectionHeader' })
  content.push({
    table: {
      widths: ['*', '*', '*', '*', '*'],
      body: [
        [
          buildCell('VALOR TOTAL DO SERVIÇO', formatCurrency(dados.valores.valorServico), 'valueRight', 'labelRight'),
          buildCell('DESCONTO INCONDICIONADO', formatCurrency(dados.valores.descontoIncondicionado), 'valueRight', 'labelRight'),
          buildCell('DESCONTO CONDICIONADO', formatCurrency(dados.valores.descontoCondicionado), 'valueRight', 'labelRight'),
          buildCell('VALOR ISSQN DEVIDO', formatCurrency(dados.impostos.valorISSQN), 'valueRight', 'labelRight'),
          buildCell('VALOR LÍQUIDO DA NOTA', formatCurrency(dados.valores.valorLiquido), 'valueRight', 'labelRight'),
        ],
      ],
    },
    layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => '#4B5563', vLineColor: () => '#4B5563' },
  })
  content.push({ text: 'INFORMAÇÕES COMPLEMENTARES / OBSERVAÇÕES', style: 'sectionHeader', color: '#374151' })
  content.push({
    table: {
      widths: ['*'],
      body: [
        [{
          stack: [
            { text: `Razão: ${dados.prestador.razaoSocial || ''} | NBS: ${dados.servico.nbs || ''}`, fontSize: 7, margin: [0, 0, 0, 4] as [number, number, number, number], bold: true },
            { text: dados.servico.informacoesComplementares || 'Sem observações declaradas no arquivo XML.', fontSize: 7, leading: 1.3 },
            options?.hideWarnings ? { text: '' } : { text: '', fontSize: 5 },
            { text: `Regime Especial de Tributação: ${dados.regimeEspecialTributacao || 'Isento'} | Optante pelo Simples Nacional: ${dados.optanteSimplesNacional ? 'Sim (Microempresa / EPP)' : 'Não'}`, fontSize: 6.5, margin: [0, 2, 0, 0] as [number, number, number, number] },
          ],
          minHeight: 50,
          margin: [4, 4, 4, 4] as [number, number, number, number],
        }],
      ],
    },
    layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => '#4B5563', vLineColor: () => '#4B5563' },
  })
  return {
    content,
    styles,
    defaultStyle,
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [30, 25, 30, 25] as [number, number, number, number],
  }
}

export async function generateDanfsePdf(dados: NfseDados, options?: GenerateOptions): Promise<Buffer> {
  const pdfmakeMod = await import('pdfmake/js/index.js')
  const pdfmake = (pdfmakeMod.default ?? pdfmakeMod) as any
  pdfmake.setFonts({ Roboto: ROBOTO_FONTS })
  const definition = getDanfseDefinition(dados, options)
  const doc = pdfmake.createPdf(definition)
  return doc.getBuffer()
}
