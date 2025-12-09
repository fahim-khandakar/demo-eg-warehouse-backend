import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const baseAppUrl = process.env.APP_URL || "http://localhost:5000/api/v1";

export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  default_super_admin:
    process.env.DEFAULT_SUPER_ADMIN ?? "admin@necgroupbd.net",
  default_pass: process.env.DEFAULT_PASS,
  bycrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  email: process.env.EMAIL,
  appPass: process.env.APP_PASS,
  APP_URL: baseAppUrl,
  verifyUrl: `${baseAppUrl}/auth/verify`,
  jwt: {
    secret: process.env.JWT_SECRET,
    refresh_secret: process.env.JWT_REFRESH_SECRET,
    expires_in: process.env.JWT_EXPIRES_IN,
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  },
  redis: {
    url: process.env.REDIS_URL,
    exprires_in: process.env.REDIS_TOKEN_EXPRES_IN,
  },
};
