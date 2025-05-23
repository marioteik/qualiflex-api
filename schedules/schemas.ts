import { z } from "zod";

// Schema for 'grades' inside 'itensNf'
export const gradeSchema = z.object({
  movimento: z.string(),
  numeracao: z.string(),
  codigoEspecif3: z.string(),
  lote: z.string(),
  quantidade: z.string(),
  sequencia: z.string(),
});

// Schema for 'grades' inside 'itensNf' -> Each grade is an object
export const itemNfGradesSchema = z.array(gradeSchema);

// Schema for 'itensNf'
export const itemNfSchema = z.object({
  movimento: z.string(),
  tipoOperacao: z.string(),
  dataMovimento: z.string(),
  codigoMaterial: z.string(),
  especif1: z.string(),
  especif2: z.string(),
  centroArmazenagem: z.string(),
  grade: z.string(),
  quantidade: z.string(),
  precoUnitario: z.string(),
  descricao: z.string(),
  documento: z.string(),
  empresa: z.string(),
  contaGerencial: z.string(),
  tipoDocumento: z.string(),
  tabelaPreco: z.string(),
  incidenciaIss: z.string(),
  tipoNota: z.string(),
  icmsOutros: z.string().optional(),
  ipiOutras: z.string(),
  serie: z.string(),
  notaFiscal: z.string(),
  CFOP: z.string(),
  codigoTipoDocumento: z.string(),
  retencaoInformada: z.string(),
  complementoIncidIpi: z.string(),
  icmsPresumido: z.string(),
  cstPis: z.string(),
  cstCofins: z.string(),
  codBaseCreditoPisCofinsEntrad: z.string(),
  sequenciaNota: z.string(),
  valorContabil: z.string(),
  incidenciaIpi: z.string(),
  incidenciaIcms: z.string(),
  incidenciaPis: z.string().optional(),
  incidenciaCofins: z.string(),
  incidenciaIcmsEntrada: z.string(),
  complementoIncidenciaIcms: z.string(),
  incidenciaContribSocial: z.string(),
  transfCentroArmaz: z.string(),
  estorno: z.string(),
  pedidoOc: z.string(),
  indice: z.string(),
  ordenacao: z.string(),
  transfUnNegocio: z.string(),
  contrato: z.string(),
  contabil: z.string(),
  codigoRetorno: z.string(),
  contabilidade: z.string(),
  excecaoNcm: z.string(),
  etiquetaHex: z.string(),
  inspecao: z.string(),
  classePedidoExclusivo4: z.string(),
  saidaSemSaldo: z.string(),
  usrmovi2: z.string(),
  precoTotalCusto: z.string(),
  contraPartTransferencia: z.string(),
  sequenciaDia: z.string(),
  grades: itemNfGradesSchema,
  comissoesItem: z.array(z.any()), // Update with specific schema if available
  codigoGrupo: z.string(),
  codigoSubGrupo: z.string(),
  centroControle: z.string(),
  codigoUnidadeMedida: z.string(),
  quantidadeRelacaoPaiFilho: z.string(),
  percentualPis: z.string(),
  percentualCofins: z.string(),
  percentualPisRetencao: z.string(),
  percentualCofinsRetencao: z.string(),
  quantidadeRefComposicaoGeral: z.string(),
  precoCusto: z.string(),
  revisaoEngenharia: z.string(),
  percentualCsll: z.string(),
  percentualIcmsSinief: z.string(),
  codigoContaGerencial: z.string(),
  peso: z.string(),
  percentualMedioIcms: z.string(),
  percentualIrrf: z.string(),
  percentualIpi: z.string(),
  order: z.string(),
  percentualFrete: z.string(),
  percentualEmbalagem: z.string(),
  percentualComissao: z.string(),
  percentualReajuste: z.string(),
  codigoFiscal: z.string(),
  dataUltimaRevisao: z.string(),
  dataReajuste: z.string(),
  codigoFabricante: z.string(),
  codigoFabrica: z.string(),
  referencia: z.string(),
  codigoReduzido: z.string(),
  precoStPisCofins: z.string(),
  conversorCompra: z.string(),
  encargosFinanceiros: z.string(),
  valorFrete: z.string(),
  aplicacao: z.string(),
  codigoEspecif1: z.string(),
  codigoEspecif2: z.string(),
  codigoEspecif3: z.string(),
  codigoEspecif4: z.string(),
  codigoEspecif5: z.string(),
  codigoEspecif6: z.string(),
  percentualRoyaltie: z.string(),
  percentualImpostoImportacao: z.string(),
  dataCadastro: z.string(),
  garantiaCompra: z.string(),
  garantiaVenda: z.string(),
  regraCusteio: z.string(),
  regraIpi: z.string(),
  sufixoContabil: z.string(),
  codigoContabil: z.string(),
  localizacao: z.string(),
  tipo: z.string(),
  volume: z.string(),
  origemMercadoria: z.string(),
  contabilPrincipalInvSped: z.string(),
  precoPauta: z.string(),
  percIcmsPisCofisImportacao: z.string(),
  conversorVenda: z.string(),
  codigoUnidadeCompra: z.string(),
  codigoUnidadeVenda: z.string(),
  pesoEmbalagem: z.string(),
  percentualInss: z.string(),
  valorIpi: z.string(),
  codigoUnidadeNegocio: z.string(),
  sessao: z.string(),
  codigoUsuarioModificacao: z.string(),
  codigoUsuarioCriacao: z.string(),
  dataModificacao: z.string(),
  dataLiberaColecao: z.string(),
  dataLiberaEsqueleto: z.string(),
  configuracaoReposicao: z.string(),
  configuracao: z.string(),
  codigoCentroArmazenagemPadrao: z.string(),
  tabPrecosEstruturaComercial: z.string(),
  utilizaGrade: z.string(),
  tipoFormacaoPrecos: z.string(),
  classificacaoAbc: z.string(),
  qualidadeProduto: z.string(),
  manterPedidoNf: z.string(),
  zerarSaldo: z.string(),
  codigoTributario: z.string(),
  usuarioUltRevisaoEngenharia: z.string(),
  tipoBaixaOp: z.string(),
  estruturaComercial: z.string(),
  controlaNumeroSerie: z.string(),
  criarProdutoClienteNaVenda: z.string(),
  ordemExibicao: z.string(),
  questionarioAfericaoGa: z.string(),
  usrmate1: z.string(),
  usrmate2: z.string(),
  usrmate3: z.string(),
  usrmate4: z.string(),
  usrmate5: z.string(),
  existeImagem: z.string(),
  existeDocumento: z.string(),
  altura: z.string(),
  largura: z.string(),
  comprimento: z.string(),
  resumoTecnico: z.string(),
  product: z.unknown(),
});

// Schema for 'itensNf' array
export const itensNfSchema = z.array(itemNfSchema);

// Schema for 'seamstress'
export const seamstressSchema = z.object({
  codigoEmpresa: z.string(),
  nomeCompleto: z.string(),
  contato: z.string(),
  fone: z.string(),
  faxFone: z.string(),
  endereco: z.string(),
  bairro: z.string(),
  municipio: z.string(),
  uf: z.string(),
  cep: z.string(),
  cnpjCpf: z.string(),
  inscrito: z.string(),
  inscricao: z.string(),
  conceito: z.string(),
  codigoDivisao: z.string(),
  dataNascimento: z.string(),
  ultimoMovimento: z.string(),
  cadastro: z.string(),
  codigoIndicacao: z.string(),
  codigoRepresentante: z.string(),
  percentualComissaoBaixa: z.string(),
  contabilCliente: z.string(),
  codigoResponsavel: z.string(),
  fantasia: z.string(),
  pessoa: z.string(),
  codigoContabilFornecedor: z.string(),
  codigoCondicaoPagamento: z.string(),
  codigoTipoPagamento: z.string(),
  codigoTipoOperacao: z.string(),
  irrfAcumulado: z.string(),
  tipoEmpresa: z.string(),
  atividade: z.string(),
  funcionarios: z.string(),
  faturamento: z.string(),
  limiteCredito: z.string(),
  codigoMercado: z.string(),
  codigoUsuarioModificacao: z.string(),
  enviarCarta: z.string(),
  tabelaPrecos: z.string(),
  agendaInterna: z.string(),
  codigoPais: z.string(),
  codigoCentralizadora: z.string(),
  atrasoMedio: z.string(),
  numero: z.string(),
  complemento: z.string(),
  inscricaoMunicipal: z.string(),
  suframa: z.string(),
  tipoFrete: z.string(),
  percentualIndenizacao: z.string(),
  percDescontoSugestaoItens: z.string(),
  percentualDesconto2: z.string(),
  jurosPadrao: z.string(),
  ultimaAtualizacao: z.string(),
  codigoUnidadeNegocio: z.string(),
  codigoPortadorPadrao: z.string(),
  ativo: z.string(),
  sessao: z.string(),
  codigoContabilAdiantamentoCli: z.string(),
  codigoContabilAdiantamentoForn: z.string(),
  codigoCentroArmazenagem: z.string(),
  codigoIndiceCredito: z.string(),
  codigoUsuarioCriacao: z.string(),
  dataModificacao: z.string(),
  codigoRegiaoEntrega: z.string(),
  dataValidadeCredito: z.string(),
  codigoSetor: z.string(),
  codigoRegimeTriburario: z.string(),
  ultimaConsultaCredito: z.string(),
  validadeCobrancaAdmin: z.string(),
  ultimaVenda: z.string(),
  prefixoCnae: z.string(),
  basePrazoDiferenciado: z.string(),
  possuiRetencaoIss: z.string(),
  codigoCentroArmazenagemMatAlte: z.string(),
  filtroDataDirf: z.string(),
  tipoImovel: z.string(),
  listarIss: z.string(),
  diaVencimento: z.string(),
  limiteFaturamento: z.string(),
  grauRelacionamento: z.string(),
  sufixoCnae: z.string(),
  toleranciaVencimento: z.string(),
  nivelCredito: z.string(),
  listarDirf: z.string(),
  conveniada: z.string(),
  creditoLiberado: z.string(),
  percentualFrete: z.string(),
  codigoEan: z.string(),
  percentualAcrescimoLimite: z.string(),
  percentualAcrescimoPreco: z.string(),
  utilizaPrazoDiferenciado: z.string(),
  tgPadraoNfs: z.string(),
  limiteCreditoMensal: z.string(),
  optanteSimples: z.string(),
  usrempr1: z.string(),
  usrempr2: z.string(),
  cnaeServico: z.string(),
  usrempr4: z.string(),
  valorFrete: z.string(),
  diasDuplicata: z.string(),
  descontoAteVencimento: z.string(),
  contabClienteLongoPrazo: z.string(),
  utilizaTransferPrice: z.string(),
  contribuinteExclusivoIss: z.string(),
});

// Main Schema
export const mainSchema = z.object({
  unidadeNegocio: z.string(),
  nf: z.string(),
  serie: z.string(),
  tipoOperacao: z.string(),
  cfop: z.string().optional(),
  dataEmissao: z.string(),
  viaTransporte: z.string(),
  documentoFiscal: z.string(),
  cliente: z.string(),
  cobranca: z.string(),
  representante: z.string(),
  icmsOutros: z.string(),
  ipiOutros: z.string().optional(),
  incidenciaPis: z.string(),
  incidenciaCofins: z.string(),
  totalMercadorias: z.string(),
  totalNF: z.string(),
  transportadora: z.string(),
  consignatario: z.string(),
  marca: z.string(),
  volume: z.string(),
  quantidade: z.string(),
  especie: z.string(),
  conta: z.string(),
  portador: z.string(),
  fatura: z.string(),
  cobrarPauta: z.string(),
  remessa: z.string(),
  pedido: z.string(),
  dataSaida: z.string(),
  horaSaida: z.string(),
  itemsNaNota: z.string(),
  tipoFrete: z.string(),
  uf: z.string(),
  placa: z.string(),
  especieNota: z.string(),
  incidenciaIss: z.string().optional(),
  ateNota: z.string(),
  substitutoTributario: z.string(),
  notaReferencia: z.string(),
  condicaoPagamento: z.string(),
  complementoFatura: z.string(),
  contabilizado: z.string(),
  faturaAglutinada: z.string(),
  gerouInss: z.string().optional(),
  serieReferencia: z.string(),
  codigoMunicipio: z.string(),
  quantidadeTotal: z.string(),
  impressa: z.string(),
  declaracaoImportacao: z.string(),
  indiceIndexador: z.string(),
  modeloCupom: z.string(),
  numeroControleFormulario: z.string(),
  romaneio: z.string(),
  ufPlacaTransportador: z.string(),
  codigoCancelamento: z.string(),
  codigoDevolucao: z.string(),
  ordemCompra: z.string(),
  projeto: z.string(),
  modeloFormulario: z.string(),
  ordemDeCompraGerada: z.string(),
  totalItensServico: z.string(),
  usrnota1: z.string(),
  chaveNFe: z.string(),
  numeroProtocolo: z.string(),
  numeroLote: z.string(),
  gerouPedidoConsignacao: z.string(),
  incluiSubstituicaoTributaria: z.string(),
  listarLivros: z.string(),
  tipoNota: z.string(),
  classificacaoDocumento: z.string(),
  mercado: z.string(),
  grade: z.string(),
  incidenciaContribSocial: z.string(),
  folhaLivroSaida: z.string(),
  tgConversaoUnidades: z.string(),
  fornecedor: z.string(),
  volumeAtualizado: z.string(),
  ordemEnderecoCobranca: z.string(),
  ordemEnderecoEntrega: z.string(),
  forma: z.string(),
  tipoFreteConsignatario: z.string(),
  conferido: z.string(),
  numeroLivroSaida: z.string(),
  usuarioAutorizado: z.string(),
  entregMercAposFatur: z.string(),
  status: z.string(),
  operacaoPresencial: z.string(),
  itensNf: itensNfSchema,
  comissoesNf: z.array(z.any()), // Update with specific schema if available
  parcelasNf: z.array(z.any()), // Update with specific schema if available
  seamstress: seamstressSchema,
});

export type MainType = z.infer<typeof mainSchema>;
export type ItensNfType = z.infer<typeof itensNfSchema>;
export type ItemNfType = z.infer<typeof itemNfSchema>;
export type SeamstressType = z.infer<typeof seamstressSchema>;
