/* eslint-disable @typescript-eslint/no-explicit-any */
import ExcelJS from "exceljs";
import moment from "moment";
import path from "path";
import ApiError from "../../../../errors/ApiError";
import prisma from "../../../../shared/prisma";
import { ICustomerRequestProduct, IOrderProduct } from "./order.interface";

export const findLastOrder = async () => {
  const lastOrder = await prisma.order.findFirst({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      invoiceId: true,
    },
  });
  return lastOrder?.invoiceId ? lastOrder?.invoiceId.substring(7) : undefined;
};
export const generateOrderId = async () => {
  const currentId = (await findLastOrder()) || (0).toString().padStart(5, "0");

  let incrementedId = (parseInt(currentId) + 1).toString().padStart(5, "0");
  incrementedId = `BD-NEC-${incrementedId}`;
  return incrementedId;
};

export const exportToExcel = async (data: {
  orderData: IOrderProduct[];
  customerPartsRequestData: ICustomerRequestProduct[];
}) => {
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

    const OrdersSheet = createWorksheet("Orders", [
      "Id",
      "Invoice No",
      "Customer",
      "part Number",
      "Quantity",
      "Status",
    ]);

    const customerRequestPartSheet = createWorksheet("Order Request", [
      "Id",
      "Customer",
      "part Number",
      "Quantity",
      "Status",
    ]);

    // Add data to Product worksheet
    data?.orderData?.forEach(order => {
      createDataRow(OrdersSheet, [
        order?.id,
        order?.order?.invoiceId,
        order?.order?.partner?.contact_person,
        order?.part?.name,
        order?.qty,
        order?.order?.status?.name,
      ]);
    });
    // Add data to Product worksheet
    data?.customerPartsRequestData?.forEach(request => {
      createDataRow(customerRequestPartSheet, [
        request?.id,
        request?.customerRequest?.partner?.contact_person,
        request?.part?.name,
        request?.qty,
        request?.customerRequest?.status?.name,
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
