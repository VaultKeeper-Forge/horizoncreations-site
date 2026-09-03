export const commerceToolCatalog = [
  { name: "get_horizon_operations_snapshot", readOnly: true, mutation: false },
  { name: "list_horizon_products", readOnly: true, mutation: false },
  { name: "get_horizon_inventory", readOnly: true, mutation: false },
  { name: "get_horizon_product", readOnly: true, mutation: false },
  { name: "list_horizon_orders", readOnly: true, mutation: false },
  { name: "get_horizon_fulfillment_readiness", readOnly: true, mutation: false },
  { name: "prepare_horizon_inventory_adjustment", readOnly: false, mutation: false },
  { name: "approve_horizon_mutation", readOnly: false, mutation: false },
  { name: "execute_horizon_inventory_adjustment", readOnly: false, mutation: true },
  { name: "prepare_horizon_product", readOnly: false, mutation: false },
  { name: "publish_horizon_product", readOnly: false, mutation: false },
  { name: "update_horizon_order_state", readOnly: false, mutation: false },
] as const;
