import { Router } from 'express';
import { IfsSyncController } from '../controllers/ifs-sync.controller';

const router = Router();
const controller = new IfsSyncController();

// Supported tables
const SUPPORTED_TABLES = [
  'supplier_info_tab',
  'payment_address_tab', 
  'supplier_document_tax_info_tab'
];

// Create dynamic routes for each table
SUPPORTED_TABLES.forEach(table => {
  router.post(`/${table}`, (req, res) => 
    controller.handleRequest(req, res, table)
  );
});

export { router as ifsSyncRoutes };
