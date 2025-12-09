-- AlterTable
ALTER TABLE "user_activities" ADD COLUMN     "principalId" INTEGER;

-- CreateTable
CREATE TABLE "PrincipalOtp" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PrincipalOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "principals" (
    "id" SERIAL NOT NULL,
    "contact_person" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "company" TEXT,
    "profileImage" TEXT,
    "contactNo" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "principals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "principals_email_key" ON "principals"("email");

-- CreateIndex
CREATE UNIQUE INDEX "principals_verificationToken_key" ON "principals"("verificationToken");

-- AddForeignKey
ALTER TABLE "PrincipalOtp" ADD CONSTRAINT "PrincipalOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "principals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_principalId_fkey" FOREIGN KEY ("principalId") REFERENCES "principals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
