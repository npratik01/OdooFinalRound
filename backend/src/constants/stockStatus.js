'use strict';

const STOCK_STATUS = Object.freeze({
  NORMAL: 'NORMAL',
  LOW_STOCK: 'LOW_STOCK',
});

const PRODUCT_TYPES = Object.freeze({
  FINISHED_GOOD: 'FINISHED_GOOD',
  RAW_MATERIAL: 'RAW_MATERIAL',
  COMPONENT: 'COMPONENT',
});

const PROCUREMENT_STRATEGY = Object.freeze({
  MTS: 'MTS', // Make to Stock
  MTO: 'MTO', // Make to Order
});

const PROCUREMENT_TYPE = Object.freeze({
  PURCHASE: 'PURCHASE',
  MANUFACTURING: 'MANUFACTURING',
});

module.exports = {
  STOCK_STATUS,
  PRODUCT_TYPES,
  PROCUREMENT_STRATEGY,
  PROCUREMENT_TYPE,
};
