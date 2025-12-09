/* eslint-disable @typescript-eslint/no-explicit-any */

import ExcelJS from "exceljs";
import moment from "moment";
import path from "path";
import ApiError from "../../../../errors/ApiError";
import { InventoryItem } from "./inventory.interface";

export const exportToExcel = async (data: InventoryItem[]) => {
  try {
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

    // Create productSheet worksheet
    const productSheet = createWorksheet("Products", [
      "Id",
      "name",
      "Roll Name",
      "Roll Name",
      "description",
      "Poll",
      "Quantity In Location",
      "Location",
      "Total In Hand",
      "Loan Quantity",
      "Total Order",
      "Total Purchase",
    ]);

    // Add data to Product worksheet
    data.forEach(inventory => {
      createDataRow(productSheet, [
        inventory?.part?.id,
        inventory?.part?.name,
        inventory?.part?.alternatePartName,
        inventory?.part?.alternatePartNametwo,
        inventory?.part?.description,
        inventory?.poll,
        inventory?.qty,
        inventory?.location?.rack,
        inventory?.part?.availableQty,
        inventory?.part?.loanQty,
        inventory?.part?.sell,
        inventory?.part?.totalQty,
      ]);
    });

    const currentDate = moment().format("YYYYMMDD");
    const excelFilePath = path.join(
      __dirname,
      `${currentDate}_inventory_data.xlsx`,
    );
    await workbook.xlsx.writeFile(excelFilePath);

    return excelFilePath;
  } catch (error: any) {
    throw new ApiError(400, error.message);
  }
};
