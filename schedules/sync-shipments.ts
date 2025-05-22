import axios, { type AxiosResponse } from "axios";
import { type ItemNfType, type MainType, type SeamstressType } from "./schemas";
import { type InsertShipment, insertShipmentSchema } from "@/schemas/shipments";
import { transformShipmentData } from "./transformation";
import { db } from "@/db";
import minimist from "minimist";
import {
  createFinancialCalculation,
  createShipment,
  getOrCreateBusinessInfo,
  getOrCreateLocation,
  getOrCreateOrder,
  getOrCreateSeamstress,
  getOrCreateShipmentItems,
  linkShipmentItemToOrder,
  linkShipmentToOrder,
} from "@/helpers/queries";
import { shipments } from "@/db/schemas/shipments";
import { eq, inArray } from "drizzle-orm";
import { shipmentImports } from "@/db/schemas/shipment-imports";

export default async function syncShipments() {
  try {
    const args = minimist(process.argv.slice(2));

    const currentDate = new Date();
    console.log("Scheduled job is running at", currentDate.toISOString());

    const { data } = await fetchShipments(currentDate);

    if ("exception" in data) {
      console.log(data.exception.Message);
      return;
    }

    const { notasFiscais } = data;

    // Fetch seamstress by client code
    const clientsRes = await Promise.all(
      notasFiscais.map((nf) => fetchCompanyByCode(nf.cliente))
    );

    // Filter seamstress by client code
    const seamstress = clientsRes
      .filter((client) => client.data[0].codigoDivisao === "CT")
      .map((client) => client.data[0]);

    // Filter shipment notes by seamstress
    const shipmentNotes = notasFiscais
      .map((nf) => ({
        ...nf,
        seamstress: seamstress.find((st) => nf.cliente === st.codigoEmpresa),
      }))
      .filter((nf) => nf.seamstress);

    // Fetch products by code
    const products = (
      await Promise.all(
        shipmentNotes
          .map((nf) => nf.itensNf)
          .flat()
          .map((prod) => fetchProductByCode(prod?.codigoMaterial.trim()))
      )
    )
      .map((prod) => prod.data)
      .flat();

    // Transform shipment data
    const finalPayload: InsertShipment[] = shipmentNotes
      .map((nf) => {
        const product = products.find((prod) => {
          return (
            prod?.codigoMaterial.trim() === nf.itensNf[0]?.codigoMaterial.trim()
          );
        });

        return transformShipmentData({
          ...nf,
          itensNf: nf.itensNf.map((item) => {
            return {
              ...item,
              order: item.descricao,
              ...product,
            };
          }),
        } as MainType);
      })
      .filter((item) => item.products?.length && item.products?.length > 0);

    const parsed = await insertShipmentSchema
      .array()
      .safeParseAsync(finalPayload);

    if (!parsed.success) {
      console.log(JSON.stringify(parsed.error, null, 2));
      throw new Error("Error parsing");
    }

    const res = await db.transaction(async (tx) => {
      const items = (
        await Promise.all(
          parsed.data.map(async (shipment) => {
            const [existingShipment] = await tx
              .select()
              .from(shipments)
              .where(eq(shipments.number, shipment.number ?? ""))
              .limit(1);

            if (existingShipment) {
              return null;
            }

            const location = await getOrCreateLocation(
              tx,
              shipment.recipient.location
            );
            const locationId = location.id;

            const businessInfo = await getOrCreateBusinessInfo(
              tx,
              shipment.recipient.businessInfo
            );
            const businessInfoId = businessInfo.id;

            const seamstressData = await getOrCreateSeamstress(tx, {
              internalCode: shipment.recipient.internalCode!,
              locationId,
              businessInfoId,
            });
            const seamstressId = seamstressData.id;

            const financialCalc = await createFinancialCalculation(
              tx,
              shipment.financialCalc
            );
            const financialCalcId = financialCalc.id;

            const newShipment = await createShipment(tx, {
              ...shipment,
              recipientId: seamstressId,
              financialCalcId,
              issueDate: shipment.issueDate || currentDate,
            });

            const shipmentItemIds = await getOrCreateShipmentItems(
              tx,
              newShipment.id,
              shipment.products!
            );

            const orderData = await getOrCreateOrder(
              tx,
              shipment.products!.map((prod) => ({ codeReference: prod.order! }))
            );

            const orderIds =
              orderData?.map((item: { id: string }) => item.id) || [];

            if (orderIds.length > 0) {
              await linkShipmentToOrder(tx, {
                shipmentId: newShipment.id,
                orderIds,
              });

              await linkShipmentItemToOrder(
                tx,
                shipmentItemIds.map((item) => ({
                  shipmentItemId: item[0],
                  orderId: orderData.find(
                    (order: { codeReference: string }) =>
                      order.codeReference === item[1]
                  ).id,
                }))
              );
            }

            return newShipment;
          })
        )
      ).filter((item) => item !== null);

      if (items.length > 0) {
        await tx.insert(shipmentImports).values({
          shipments: items.map((item) => item.number),
        });
      }

      return items;
    });

    if (res.length > 0) {
      console.log("Finished importing " + res.length + " shipments!");
    }
  } catch (error) {
    console.error("Error running scheduled job:", error);
  }
}

async function fetchShipments(
  runDate: Date
): Promise<
  AxiosResponse<
    | { notasFiscais: MainType[] }
    | { exception: { Code: number; Message: string } }
  >
> {
  const requestData = new FormData();
  const formattedDate = runDate.toISOString().split("T")[0];

  requestData.append("pin", "492");
  requestData.append("tipoNota", "A");
  requestData.append("dataEmissaoInicial", formattedDate);
  requestData.append("dataEmissaoFinal", formattedDate);

  return await axios.post(
    "https://qualiflexintegrador.cigam.cloud/webservices/cigam/integrador/CadastroNotaFiscal.integrador.ashx/ListarNotasFiscais",
    requestData
  );
}

async function fetchCompanyByCode(
  code: string
): Promise<AxiosResponse<SeamstressType[]>> {
  const requestData = new FormData();
  requestData.append("pin", "492");
  requestData.append("codigoEmpresa", code);

  return await axios.post(
    "https://qualiflexintegrador.cigam.cloud/webservices/cigam/integrador/CadastroEmpresas.integrador.ashx/ListarIndividual",
    requestData
  );
}

async function fetchProductByCode(
  code: string
): Promise<AxiosResponse<ItemNfType[]>> {
  const requestData = new FormData();
  requestData.append("pin", "492");
  requestData.append("codigoMaterial", code);

  return await axios.post(
    "https://qualiflexintegrador.cigam.cloud/webservices/cigam/integrador/CadastroMateriais.integrador.ashx/ListarIndividual",
    requestData
  );
}

async function fetchOrderByCode(code: string): Promise<AxiosResponse<any[]>> {
  const requestData = new FormData();
  requestData.append("pin", "492");
  requestData.append("movimento", code);

  return await axios.post(
    "https://qualiflexintegrador.cigam.cloud/webservices/cigam/integrador/CadastroMovimento.integrador.ashx/ListarIndividual",
    requestData
  );
}

async function fetchOrderItemsByCode(
  code: string
): Promise<AxiosResponse<any[]>> {
  const requestData = new FormData();
  requestData.append("pin", "492");
  requestData.append("codigoOrdem", code);

  return await axios.post(
    "https://qualiflexintegrador.cigam.cloud/webservices/cigam/integrador/CadastroMovimento.integrador.ashx/ListarIndividual",
    requestData
  );
}
