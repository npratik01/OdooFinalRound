'use strict';

const Traceability = require('../models/Traceability.model');
const SalesOrder = require('../models/SalesOrder.model');
const ManufacturingOrder = require('../models/ManufacturingOrder.model').ManufacturingOrder;
const PurchaseOrder = require('../models/PurchaseOrder.model').PurchaseOrder;
const Delivery = require('../models/Delivery.model');
const GoodsReceipt = require('../models/GoodsReceipt.model');

const { sendSuccess, sendError } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Traverses document relationships to build a complete traceability flow graph
 */
const getTraceabilityFlow = async (req, res) => {
  try {
    const startDocId = req.params.docId;
    
    // We will perform a BFS traversal to find all connected documents
    const visited = new Set();
    const queue = [startDocId];
    const nodesMap = new Map(); // docIdString -> nodeDetails
    const edges = [];

    // Auxiliary helper to fetch details of a document
    const getDocDetails = async (idStr) => {
      // Try fetching as SalesOrder
      let doc = await SalesOrder.findById(idStr);
      if (doc) {
        return {
          id: idStr,
          label: doc.soNumber,
          type: 'SalesOrder',
          status: doc.status,
          date: doc.orderDate,
          summary: `${doc.items?.length || 0} items — $${doc.totalAmount || 0}`,
        };
      }

      // Try as ManufacturingOrder
      doc = await ManufacturingOrder.findById(idStr).populate('productId', 'productName');
      if (doc) {
        return {
          id: idStr,
          label: doc.moNumber,
          type: 'ManufacturingOrder',
          status: doc.status,
          date: doc.scheduledDate || doc.createdAt,
          summary: `${doc.productId?.productName || 'Product'} (Planned: ${doc.plannedQty})`,
        };
      }

      // Try as PurchaseOrder
      doc = await PurchaseOrder.findById(idStr).populate('vendorId', 'vendorName');
      if (doc) {
        return {
          id: idStr,
          label: doc.poNumber,
          type: 'PurchaseOrder',
          status: doc.status,
          date: doc.orderDate,
          summary: `${doc.vendorId?.vendorName || 'Vendor'} — $${doc.totalAmount || 0}`,
        };
      }

      // Try as GoodsReceipt
      doc = await GoodsReceipt.findById(idStr);
      if (doc) {
        return {
          id: idStr,
          label: doc.grNumber,
          type: 'GoodsReceipt',
          status: 'Processed',
          date: doc.receiptDate,
          summary: `Received ${doc.items?.length || 0} items`,
        };
      }

      // Try as Delivery
      doc = await Delivery.findById(idStr);
      if (doc) {
        return {
          id: idStr,
          label: doc.deliveryNumber,
          type: 'Delivery',
          status: doc.status,
          date: doc.actualDeliveryDate || doc.scheduledDate,
          summary: `${doc.status}`,
        };
      }

      return {
        id: idStr,
        label: 'Unknown Document',
        type: 'Unknown',
        status: 'N/A',
      };
    };

    while (queue.length > 0) {
      const currentId = queue.shift();
      const currentIdStr = currentId.toString();

      if (visited.has(currentIdStr)) continue;
      visited.add(currentIdStr);

      // Fetch details of the current node
      if (!nodesMap.has(currentIdStr)) {
        const details = await getDocDetails(currentIdStr);
        nodesMap.set(currentIdStr, details);
      }

      // Find all Traceability links where current node is source or target
      const links = await Traceability.find({
        $or: [
          { sourceDocId: currentId },
          { targetDocId: currentId }
        ]
      });

      for (const link of links) {
        const srcStr = link.sourceDocId.toString();
        const tgtStr = link.targetDocId.toString();

        // Register edge if not already added
        const edgeId = `${srcStr}_${tgtStr}`;
        if (!edges.some(e => e.id === edgeId)) {
          edges.push({
            id: edgeId,
            source: srcStr,
            target: tgtStr,
            relationType: link.relationType,
            remarks: link.remarks,
          });
        }

        // Add unvisited endpoints to queue
        if (!visited.has(srcStr)) queue.push(link.sourceDocId);
        if (!visited.has(tgtStr)) queue.push(link.targetDocId);
      }
    }

    // Convert map to list of node objects
    const nodes = Array.from(nodesMap.values());

    return sendSuccess(res, {
      data: { nodes, edges },
      message: 'Traceability flow graph constructed successfully',
    });
  } catch (err) {
    logger.error('Error constructing traceability flow:', err);
    return sendError(res, { message: 'Failed to retrieve traceability flow' });
  }
};

module.exports = {
  getTraceabilityFlow,
};
