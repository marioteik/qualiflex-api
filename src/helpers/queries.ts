import { and, eq, inArray, type InferInsertModel } from "drizzle-orm";
import { shipments } from "@/db/schemas/shipments";
import {
  orders,
  shipmentItemToOrder,
  shipmentsToOrder,
} from "@/db/schemas/orders";
import { locations } from "@/db/schemas/locations";
import { businessInfos } from "@/db/schemas/business-info";
import { seamstress } from "@/db/schemas/seamstress";
import { financialCalculations } from "@/db/schemas/financial-calcs";
import { products } from "@/db/schemas/products";
import type { InsertFinancialCalculation } from "@/db/schemas/financial-calcs";
import { shipmentItems, units } from "@/db/schemas/shipment-items";
import { geocodeAddress } from "@/helpers/geocode-address";

// Function to get or create a Location

type LocationData = InferInsertModel<typeof locations>;

async function getOrCreateLocation(tx: any, locationData: LocationData) {
  const existing = await tx.query.locations.findFirst({
    where: eq(locations.formattedAddress, locationData.formattedAddress),
  });
  if (existing) {
    return existing;
  }

  const { lat, lng } = await geocodeAddress(locationData.formattedAddress);

  const [locationRecord] = await tx
    .insert(locations)
    .values({ ...locationData, lat, lng })
    .returning();

  return locationRecord;
}

// Function to get or create Business Info
type BusinessInfoData = InferInsertModel<typeof businessInfos>;

async function getOrCreateBusinessInfo(
  tx: any,
  businessInfoData: BusinessInfoData
) {
  let [businessInfoRecord] = await tx
    .select()
    .from(businessInfos)
    .where(
      eq(
        businessInfos.nameCorporateReason,
        businessInfoData.nameCorporateReason ?? ""
      )
    )
    .limit(1);

  if (!businessInfoRecord) {
    [businessInfoRecord] = await tx
      .insert(businessInfos)
      .values(businessInfoData)
      .returning();
  }

  return businessInfoRecord;
}

// Function to get or create Seamstress

type SeamstressData = {
  internalCode: string;
  locationId: string;
  businessInfoId: string;
};

async function getOrCreateSeamstress(tx: any, seamstressData: SeamstressData) {
  let [seamstressRecord] = await tx
    .select()
    .from(seamstress)
    .where(eq(seamstress.internalCode, seamstressData.internalCode))
    .limit(1);

  if (!seamstressRecord) {
    [seamstressRecord] = await tx
      .insert(seamstress)
      .values(seamstressData)
      .onConflictDoNothing()
      .returning();

    if (!seamstressRecord) {
      [seamstressRecord] = await tx
        .select()
        .from(seamstress)
        .where(eq(seamstress.internalCode, seamstressData.internalCode))
        .limit(1);
    }
  }

  return seamstressRecord;
}

// Function to get or create Financial Calculation

type FinancialCalcData = InferInsertModel<typeof financialCalculations>;

async function createFinancialCalculation(
  tx: any,
  financialCalcData: InsertFinancialCalculation
) {
  return (
    await tx
      .insert(financialCalculations)
      .values(financialCalcData)
      .onConflictDoNothing()
      .returning()
  )[0];
}

// Function to get or create Products and return their IDs
type ProductData = InferInsertModel<typeof products>;
type ShipmentItemData = InferInsertModel<typeof shipmentItems>;

type UnitData = InferInsertModel<typeof units>;

async function getOrCreateShipmentItems(
  tx: any,
  shipmentId: string,
  productList: Omit<
    ProductData & ShipmentItemData & { unit: string; order?: string },
    "productId" | "shipmentId"
  >[]
) {
  const shipmentItemIds = await Promise.all(
    productList.map(async (product) => {
      // Get or create Unit
      let [unitRecord] = await tx
        .select()
        .from(units)
        .where(eq(units.unitName, product.unit))
        .limit(1);

      if (!unitRecord) {
        [unitRecord] = await tx
          .insert(units)
          .values({ unitName: product.unit })
          .returning();
      }

      const unitId = unitRecord.id;

      // Get or create Product
      let [productRecord] = await tx
        .select()
        .from(products)
        .where(eq(products.code, product.code))
        .limit(1);

      if (!productRecord) {
        [productRecord] = await tx
          .insert(products)
          .values({
            code: product.code,
            description: product.description,
            price: product.price,
            category: product.category,
          })
          .onConflictDoNothing()
          .returning();

        if (!productRecord) {
          [productRecord] = await tx
            .select()
            .from(products)
            .where(eq(products.code, product.code))
            .limit(1);
        }
      }

      const productId = productRecord.id;

      // Get or create ShipmentItem
      let [shipmentItem] = await tx
        .select()
        .from(shipmentItems)
        .where(
          and(
            eq(shipmentItems.shipmentId, shipmentId),
            eq(shipmentItems.productId, productId),
            eq(shipmentItems.quantity, product.quantity)
          )
        )
        .limit(1);

      if (!shipmentItem) {
        [shipmentItem] = await tx
          .insert(shipmentItems)
          .values({
            shipmentId,
            productId,
            unitId,
            quantity: product.quantity,
            unitPrice: product.unitPrice,
          })
          .onConflictDoNothing()
          .returning();
      }

      return [shipmentItem.id, product.order ?? ""];
    })
  );

  return shipmentItemIds;
}

type ShipmentData = InferInsertModel<typeof shipments>;

async function createShipment(tx: any, shipmentData: ShipmentData) {
  const [newShipment] = await tx
    .insert(shipments)
    .values(shipmentData)
    .onConflictDoNothing()
    .returning();

  if (!newShipment) {
    const [existingShipment] = await tx
      .select()
      .from(shipments)
      .where(eq(shipments.number, shipmentData.number ?? ""))
      .limit(1);

    return existingShipment;
  }

  return newShipment;
}

// Function to get or create Order

type OrderData = InferInsertModel<typeof orders>;

async function getOrCreateOrder(tx: any, orderList: OrderData[]) {
  const list = orderList.filter((o) => o.codeReference);

  if (list.length > 0) {
    await tx.insert(orders).values(list).onConflictDoNothing();

    const codes = list.map((o) => o.codeReference);

    const orderRecords = await tx
      .select()
      .from(orders)
      .where(inArray(orders.codeReference, codes));

    return orderRecords;
  }
}

// Function to link Shipment to Orders in Join Table

type LinkShipmentToOrderData = { shipmentId: string; orderIds: string[] };

async function linkShipmentToOrder(
  tx: any,
  { shipmentId, orderIds }: LinkShipmentToOrderData
) {
  return tx
    .insert(shipmentsToOrder)
    .values(
      orderIds.map((orderId) => ({
        orderId,
        shipmentId,
      }))
    )
    .onConflictDoNothing();
}

interface LinkShipmentItemToOrderData {
  shipmentItemId: number;
  orderId: number;
}

async function linkShipmentItemToOrder(
  tx: any,
  data: LinkShipmentItemToOrderData[]
) {
  await tx.insert(shipmentItemToOrder).values(data).onConflictDoNothing();
}

export {
  getOrCreateLocation,
  getOrCreateBusinessInfo,
  getOrCreateSeamstress,
  getOrCreateOrder,
  createFinancialCalculation,
  getOrCreateShipmentItems,
  createShipment,
  linkShipmentToOrder,
  linkShipmentItemToOrder,
};
