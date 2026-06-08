import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parseNfseXml, getDanfseDefinition, generateDanfsePdf } from '../lib/danfse-pdf-generator.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const XML_PATH = resolve(__dirname, '..', '..', '..', 'xml_teste', 'nfse_teste.xml')

describe('danfse-pdf-generator', () => {
  const xml = readFileSync(XML_PATH, 'utf-8')
  const dados = parseNfseXml(xml)

  it('parseia XML corretamente', () => {
    expect(dados.chaveAcesso).toBeTruthy()
    expect(dados.chaveAcesso).toHaveLength(50)
    expect(dados.prestador.razaoSocial).toBeTruthy()
    expect(typeof dados.prestador.razaoSocial).toBe('string')
    expect(dados.servico.nbs).toBeTruthy()
  })

  it('gera PDF com cabeçalho válido', async () => {
    const buf = await generateDanfsePdf(dados, { ambienteGerador: '1', hideWarnings: true })
    expect(buf.slice(0, 5).toString()).toBe('%PDF-')
    expect(buf.length).toBeGreaterThan(10000)
  })

  it('QR code usa URL no padrão ConsultaPublica', () => {
    const def = getDanfseDefinition(dados, { ambienteGerador: '1', hideWarnings: true })
    const json = JSON.stringify(def)
    const expectedUrl = `https://www.nfse.gov.br/ConsultaPublica/?tpc=1&chave=${dados.chaveAcesso}`
    expect(json).toContain(expectedUrl)
    expect(json).not.toContain('validador?chave=')
  })

  it('inclui Razão/NBS nas informações complementares', () => {
    const def = getDanfseDefinition(dados, { ambienteGerador: '1', hideWarnings: true })
    const json = JSON.stringify(def)
    expect(json).toContain(`Razão: ${dados.prestador.razaoSocial}`)
    expect(json).toContain(`NBS: ${dados.servico.nbs}`)
  })

  it('mascara dados sensíveis com LGPD ativo', () => {
    const def = getDanfseDefinition(dados, { ambienteGerador: '1', hideWarnings: true, lgpdAtivo: true })
    const json = JSON.stringify(def)
    expect(json).not.toContain(dados.prestador.razaoSocial)
    expect(json).not.toContain(dados.tomador.razaoSocial)
    expect(json).not.toContain(dados.chaveAcesso)
    expect(json).toContain('*****')
  })

  it('PDF contém dados normais SEM LGPD', () => {
    const def = getDanfseDefinition(dados, { ambienteGerador: '1', hideWarnings: true })
    const json = JSON.stringify(def)
    expect(json).toContain(dados.prestador.razaoSocial)
    expect(json).toContain(dados.chaveAcesso)
  })

  it('geração LGPD produz PDF válido', async () => {
    const buf = await generateDanfsePdf(dados, { ambienteGerador: '1', hideWarnings: true, lgpdAtivo: true })
    expect(buf.slice(0, 5).toString()).toBe('%PDF-')
    expect(buf.length).toBeGreaterThan(5000)
  })
})
