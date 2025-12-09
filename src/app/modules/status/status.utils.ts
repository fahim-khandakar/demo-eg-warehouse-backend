import prisma from "../../../shared/prisma";

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
