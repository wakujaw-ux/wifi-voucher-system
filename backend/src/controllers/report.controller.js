const reportService = require("../services/report.service");
const { success, error } = require("../utils/response");
const ExcelJS = require("exceljs");

const buildFilters = (query) => {
  const filters = {};
  if (query.site_id) filters.site_id = query.site_id;
  if (query.from_date) filters.from_date = query.from_date;
  if (query.to_date) filters.to_date = query.to_date;
  if (query.group_by) filters.group_by = query.group_by;
  return filters;
};

const getSales = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    const report = await reportService.getSalesReport(filters);
    return success(res, { report }, "Sales report imepatikana");
  } catch (err) {
    console.error("sales report error:", err.message);
    return error(
      res,
      err.message,
      err.code || "REPORT_FAILED",
      err.status || 500,
    );
  }
};

const getVouchers = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    const report = await reportService.getVoucherReport(filters);
    return success(res, { report }, "Voucher report imepatikana");
  } catch (err) {
    return error(
      res,
      err.message,
      err.code || "REPORT_FAILED",
      err.status || 500,
    );
  }
};

const getRevenue = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    const report = await reportService.getRevenueReport(filters);
    return success(res, { report }, "Revenue report imepatikana");
  } catch (err) {
    return error(
      res,
      err.message,
      err.code || "REPORT_FAILED",
      err.status || 500,
    );
  }
};

const getSessions = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    const report = await reportService.getSessionReport(filters);
    return success(res, { report }, "Session report imepatikana");
  } catch (err) {
    return error(
      res,
      err.message,
      err.code || "REPORT_FAILED",
      err.status || 500,
    );
  }
};

const getExpenses = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    const report = await reportService.getExpensesReport(filters);
    return success(res, { report }, "Expenses report imepatikana");
  } catch (err) {
    return error(
      res,
      err.message,
      err.code || "REPORT_FAILED",
      err.status || 500,
    );
  }
};

const getProfitLoss = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    const report = await reportService.getProfitLossReport(filters);
    return success(res, { report }, "Profit & Loss report imepatikana");
  } catch (err) {
    return error(
      res,
      err.message,
      err.code || "REPORT_FAILED",
      err.status || 500,
    );
  }
};

const exportSalesXlsx = async (req, res) => {
  try {
    const filters = buildFilters(req.query);
    // Tunatumia ile function yetu ya awali kuchukua data
    const reportData = await reportService.getSalesReport(filters);
    const data = reportData.by_package; // Tunachukua data ya by_package

    // 1. Unda Workbook mpya
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Ripoti ya Mauzo");

    // 2. Weka Title
    worksheet.mergeCells("A1:D1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "RIPOTI YA MAUZO - WIFI VOUCHER SYSTEM";
    titleCell.font = { size: 14, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" },
    }; // Bluu
    titleCell.alignment = { vertical: "middle", horizontal: "center" };

    // 3. Weka Tarehe ya Ripoti
    worksheet.mergeCells("A2:D2");
    worksheet.getCell("A2").value =
      `Kipindi: ${filters.from_date || "Mwanzo"} hadi ${filters.to_date || "Leo"}`;
    worksheet.getCell("A2").alignment = { horizontal: "center" };

    // 4. Weka Vichwa vya Habari (Headers)
    worksheet.getRow(4).values = [
      "Tarehe",
      "Jina la Kifurushi",
      "Idadi ya Mauzo",
      "Mapato (TZS)",
    ];
    worksheet.getRow(4).font = { bold: true };

    // 5. Weka Data
    let currentRow = 5;
    let totalMauzo = 0;
    let totalMapato = 0;

    data.forEach((item) => {
      const row = worksheet.addRow([
        item.sale_date || "-",
        item.package_name,
        item.sales_count,
        parseFloat(item.revenue),
      ]);

      // Format ya Namba na Pesa
      row.getCell(1).alignment = { horizontal: "center" };
      row.getCell(3).alignment = { horizontal: "center" };
      row.getCell(4).numFmt = "#,##0.00"; // Inaweka comma vizuri kwenye Excel

      totalMauzo += item.sales_count;
      totalMapato += parseFloat(item.revenue);
      currentRow++;
    });

    // 6. Weka Jumla (Totals) chini
    worksheet.addRow([]); // Mstari mtupu
    const totalRow = worksheet.addRow([
      "",
      "JUMLA KUU",
      totalMauzo,
      totalMapato,
    ]);
    totalRow.font = { bold: true };
    totalRow.getCell(2).alignment = { horizontal: "right" };
    totalRow.getCell(4).numFmt = "#,##0.00";

    // 7. Set Column Widths (Upana wa Column)
    worksheet.columns = [
      { width: 15 }, // Tarehe
      { width: 25 },
      { width: 15 },
      { width: 20 },
    ];

    // 8. Set Response Headers
    const fileName = `Ripoti_Mauzo_${new Date().toISOString().split("T")[0]}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    // 9. Tuma faili
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Export XLSX error:", err);
    return error(res, err.message, "EXPORT_FAILED", 500);
  }
};

module.exports = {
  getSales,
  getVouchers,
  getRevenue,
  getSessions,
  getExpenses,
  getProfitLoss,
  exportSalesXlsx,
};
