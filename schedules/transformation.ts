import { toNumber } from "@/helpers/utils";
import type { InsertShipment } from "@/schemas/shipments";
import type { MainType } from "./schemas";
import { parse } from "date-fns";

export const transformShipmentData = (data: MainType): InsertShipment => {
  return {
    number: data.nf?.trim(),
    accessKey: data.chaveNFe?.trim() ? data.chaveNFe?.trim() : undefined,
    series: data.serie?.trim(),
    type: data.tipoOperacao?.trim(),
    authorizationProtocol: data.numeroProtocolo?.trim()
      ? data.numeroProtocolo?.trim()
      : undefined,
    issueDate: parse(data.dataEmissao?.trim(), "dd/MM/yyyy", new Date()),
    entryExitDate: data.dataSaida
      ? parse(data.dataSaida?.trim(), "dd/MM/yyyy", new Date())
      : null,
    entryExitTime: data.horaSaida?.trim() || undefined,
    transportationType: data.tipoFrete?.trim(),
    recipient: {
      internalCode: data.seamstress.codigoEmpresa?.trim() || undefined,
      createdAt: parse(data.dataEmissao?.trim(), "dd/MM/yyyy", new Date()),
      updatedAt: null,
      deletedAt: null,
      location: {
        route: data.seamstress.endereco?.trim(),
        subpremise: data.seamstress.complemento?.trim(),
        streetNumber: data.seamstress.numero?.trim(),
        sublocality: data.seamstress.bairro?.trim(),
        locality: data.seamstress.municipio?.trim(),
        administrativeAreaLevel1: data.seamstress.uf?.trim(),
        administrativeAreaLevel2: undefined,
        country: "BRA",
        formattedAddress: `${data.seamstress.endereco?.trim()}, ${data.seamstress.numero?.trim()}${
          !!data.seamstress.complemento?.trim()
            ? " / " + data.seamstress.complemento?.trim()
            : ""
        } - ${data.seamstress.bairro?.trim()}, ${data.seamstress.municipio?.trim()} - ${data.seamstress.uf?.trim()}, ${data.seamstress.cep?.trim()}`,
        postalCode: data.seamstress.cep?.trim(),
      },
      businessInfo: {
        nameCorporateReason: data.seamstress.nomeCompleto?.trim(),
        cnpjCpf: data.seamstress.cnpjCpf?.trim(),
        phoneFax: data.seamstress.fone.replace(/\-/g, "")?.trim(),
        stateRegistration: data.seamstress.inscricao?.trim(),
        tradeName: data.seamstress.fantasia?.trim(),
        contact: data.seamstress.contato?.trim(),
        modificationDate: data.seamstress.dataModificacao?.trim(),
      },
    },
    products: data.itensNf.map((item) => {
      return {
        code: item.codigoMaterial?.trim(),
        description: item.descricao?.trim(),
        ncm: item.codigoFiscal?.trim() || "",
        cst:
          item.cstPis?.trim() ||
          item.cstCofins?.trim() ||
          item.codigoTributario?.trim() ||
          "",
        cfop: item.CFOP?.trim() || "",
        unit: item.codigoUnidadeMedida?.trim() || "",
        quantity: item.quantidade?.trim(),
        unitPrice: item.precoUnitario?.trim(),
        totalPrice: item.valorContabil?.trim() || item.precoTotalCusto?.trim(),
        bcIcms: item.incidenciaIcms?.trim() || "",
        icmsValue: item.icmsOutros?.trim() || "",
        ipiValue: item.valorIpi?.trim() || item.ipiOutras?.trim(),
        icmsRate:
          item.percentualIcmsSinief?.trim() || item.percentualMedioIcms?.trim(),
        ipiRate: item.percentualIpi?.trim(),
        order: item.order?.split("OP ")[1],
      };
    }),
    financialCalc: {
      icmsBase: 0,
      icmsValue: 0,
      stIcmsBase: 0,
      stIcmsValue: 0,
      fcpValue: 0,
      pisValue: 0,
      totalProductValue: data.totalMercadorias?.trim()
        ? toNumber(data.totalMercadorias?.trim())
        : 0,
      freightValue: 0,
      insuranceValue: 0,
      discount: 0,
      otherExpenses: 0,
      ipiValue: 0,
      cofinsValue: 0,
      totalInvoiceValue: data.totalNF ? toNumber(data.totalNF?.trim()) : 0,
    },
    updatedAt: null,
    createdAt: new Date(),
    deletedAt: null,
  };
};
