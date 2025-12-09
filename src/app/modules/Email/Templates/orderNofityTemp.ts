export const orderCreatedTemplate = (
  partnerName: string,
  orderId: string,
  partName: string,
  qty: number,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Order Created</title>
<style>
  body { font-family: Arial, sans-serif; background:#f6f9fc; color:#1f2937; margin:0; padding:0; }
  .container { max-width:600px; margin:0 auto; background:#fff; border-radius:12px; padding:20px; }
  table { width:100%; border-collapse:collapse; margin-top:16px; }
  td { border:1px solid #e5e7eb; padding:8px; }
  tr:nth-child(odd) { background:#f9fafb; }
</style>
</head>
<body>
  <div class="container">
    <h2>Dear ${partnerName},</h2>
    <p>Your order has been Open successfully. Here are the details:</p>
    <table>
      <tr><td><b>Order ID</b></td><td>${orderId}</td></tr>
      <tr><td><b>Part</b></td><td>${partName}</td></tr>
      <tr><td><b>Quantity</b></td><td>${qty}</td></tr>
    </table>
    <p>We will notify you once the order is processed.</p>
  </div>
</body>
</html>
`;

export const orderStatusUpdatedTemplate = (
  partnerName: string,
  orderId: string,
  statusName: string,
  closeDate?: Date | null,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Order Status Updated</title>
<style>
  body { font-family: Arial, sans-serif; background:#f6f9fc; color:#1f2937; margin:0; padding:0; }
  .container { max-width:600px; margin:0 auto; background:#fff; border-radius:12px; padding:20px; }
  table { width:100%; border-collapse:collapse; margin-top:16px; }
  td { border:1px solid #e5e7eb; padding:8px; }
  tr:nth-child(odd) { background:#f9fafb; }
</style>
</head>
<body>
  <div class="container">
    <h2>Dear ${partnerName},</h2>
    <p>The status of your order has been updated. Here are the details:</p>
    <table>
      <tr><td><b>Order ID</b></td><td>${orderId}</td></tr>
      <tr><td><b>New Status</b></td><td>${statusName}</td></tr>
      ${closeDate ? `<tr><td><b>Closed On</b></td><td>${closeDate.toLocaleString()}</td></tr>` : ""}
    </table>
    <p>If you have any questions, please contact our support team.</p>
  </div>
</body>
</html>
`;

export const customerRequestTemplate = (
  userName: string,
  requestId: string,
  partName: string,
  qty: number,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Customer Request Received</title>
<style>
  body { font-family: Arial, sans-serif; background:#f6f9fc; color:#1f2937; margin:0; padding:0; }
  .container { max-width:600px; margin:0 auto; background:#fff; border-radius:12px; padding:20px; }
  table { width:100%; border-collapse:collapse; margin-top:16px; }
  td { border:1px solid #e5e7eb; padding:8px; }
  tr:nth-child(odd) { background:#f9fafb; }
</style>
</head>
<body>
    <div style="text-align: center">
        <img
          style="height: 50px; width: 70px"
          src="https://necgroupbd.com/wp-content/uploads/2024/03/cropped-NEC-1-e1710062416429.png"
          alt=""
        />
    <h2 style="color: #007bff">NEC Group!</h2>
  </div>
  <div class="container">
    <h2>Hello ${userName},</h2>
    <p>Your customer request has been received. Here are the details:</p>
    <table>
      <tr><td><b>Request ID</b></td><td>${requestId}</td></tr>
      <tr><td><b>Part</b></td><td>${partName}</td></tr>
      <tr><td><b>Quantity</b></td><td>${qty}</td></tr>
    </table>
    <p>We will notify you once your request is reviewed.</p>
  </div>
</body>
</html>
`;

export const customerRequestApprovedTemplate = (
  userName: string,
  requestId: string,
  partName: string,
  qty: number,
  orderId: string,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Customer Request Approved</title>
<style>
  body { font-family: Arial, sans-serif; background:#f6f9fc; color:#1f2937; margin:0; padding:0; }
  .container { max-width:600px; margin:0 auto; background:#fff; border-radius:12px; padding:20px; }
  table { width:100%; border-collapse:collapse; margin-top:16px; }
  td { border:1px solid #e5e7eb; padding:8px; }
  tr:nth-child(odd) { background:#f9fafb; }
</style>
</head>
<body>
  <div class="container">
    <h2>Hello ${userName},</h2>
    <p>Your customer request has been approved. An order has been created based on your request:</p>
    <table>
      <tr><td><b>Request ID</b></td><td>${requestId}</td></tr>
      <tr><td><b>Order ID</b></td><td>${orderId}</td></tr>
      <tr><td><b>Part</b></td><td>${partName}</td></tr>
      <tr><td><b>Quantity</b></td><td>${qty}</td></tr>
    </table>
    <p>Thank you for using our service!</p>
  </div>
</body>
</html>
`;
