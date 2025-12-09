/* eslint-disable @typescript-eslint/no-explicit-any */

import ExcelJS from "exceljs";
import moment from "moment";
import path from "path";
import ApiError from "../../../../errors/ApiError";

export const exportToExcel = async (data: any) => {
  try {
    if (!data) {
      throw new ApiError(400, "No shipment data provided");
    }

    const workbook = new ExcelJS.Workbook();
    const width = 20;

    const applyStyles = (cell: any) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { horizontal: "center" };
    };

    const createHeaderRow = (worksheet: any, headers: string[]) => {
      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell: any) => {
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFCCCCCC" },
        };
        applyStyles(cell);
      });
    };

    const createDataRow = (worksheet: any, rowData: any[]) => {
      const dataRow = worksheet.addRow(
        rowData.map(value => (value !== undefined ? value : "")),
      );
      dataRow.eachCell((cell: any) => applyStyles(cell));
    };

    const createWorksheet = (worksheetName: string, headers: string[]) => {
      const worksheet = workbook.addWorksheet(worksheetName);
      createHeaderRow(worksheet, headers);
      worksheet.columns.forEach(column => {
        column.width = width;
      });
      return worksheet;
    };

    // Create Event Sheet
    const eventSheet = createWorksheet("Event", [
      "Event ID",
      "Control No.",
      "HAWB",
      "Send By",
      "Shipment Type",
      "Event No.",
      "Part No.",
      "HS Code",
      "Description",
      "BTRC",
      "Value",
      "Net Weight",
      "Product Dimension (LxWxH)",
      "COO",
      "Box No.",
      "Box Dimension (LxWxH)",
      "Gross Weight",
      "Status",
      "Receipt No.",
      "Created At",
    ]);

    // Add Event Data Rows
    data.events?.forEach((event: any) => {
      const {
        id,
        eventNo,
        product,
        description,
        btrc,
        value,
        weight,
        dimensionL,
        dimensionW,
        dimensionH,
        coo,
        ox,
        status,
        receipt,
        createdAt,
      } = event;

      createDataRow(eventSheet, [
        id,
        data.control,
        data.hawb,
        data.sendBy,
        data.type,
        eventNo,
        product?.name,
        product?.hsCode,
        description,
        btrc ? "Yes" : "No",
        value,
        weight,
        `${dimensionL}x${dimensionW}x${dimensionH}`,
        coo,
        ox?.boxNo,
        `${ox?.length}x${ox?.width}x${ox?.height}`,
        ox?.boxWeight,
        status?.name,
        receipt?.receiptNo,
        moment(createdAt).format("YYYY-MM-DD HH:mm:ss"),
      ]);
    });

    const currentDate = moment().format("YYYYMMDD_HHmmss");
    const fileName = `${currentDate}_shipment_export.xlsx`;
    const excelFilePath = path.join(__dirname, fileName);

    await workbook.xlsx.writeFile(excelFilePath);

    return excelFilePath;
  } catch (error: any) {
    throw new ApiError(400, error.message || "Failed to export Excel file");
  }
};
