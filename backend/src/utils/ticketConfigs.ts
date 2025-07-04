export type TicketType = "repair" | "cartridge" | "purchase";

export type TicketConfig = {
  label: string; // отображаемое название
  color?: string; // для UI, если нужно
  icon?: string; // emoji или иконка
  description?: string;
};

export const ticketConfigs: Record<TicketType, TicketConfig> = {
  repair: {
    label: "Repair Request",
    icon: "🛠️",
    color: "#FF8C00",
    description: "Repair of printers, PCs, laptops and other office equipment.",
  },
  cartridge: {
    label: "Cartridge Refill",
    icon: "🖨️",
    color: "#2E8B57",
    description: "Toner cartridge refilling at office or customer location.",
  },
  purchase: {
    label: "Product Purchase",
    icon: "🛒",
    color: "#1E90FF",
    description: "Order of printers, cartridges or consumables.",
  },
};
