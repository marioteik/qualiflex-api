import type { SelectShipment } from "@/db/schemas/shipments";

export function determineStatus(shipment: SelectShipment) {
  if (shipment.refusedAt) {
    return "Recusado";
  } else if (shipment.collectedAt) {
    return "Coletado";
  } else if (shipment.finishedAt) {
    return "Finalizado";
  } else if (shipment.deliveredAt) {
    return "Produzindo";
  } else if (shipment.confirmedAt) {
    return "Confirmado";
  } else {
    return "Pendente";
  }
}
