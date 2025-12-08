"use server";

import fs from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/app/_server/actions/auth";
import {
  encryptFileData,
  decryptFileData,
  getKeyStatus,
} from "@/app/_server/actions/pgp";
import { revalidatePath } from "next/cache";

const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "data/uploads");

interface EncryptResult {
  success: boolean;
  message: string;
  encryptedFilePath?: string;
}

interface DecryptResult {
  success: boolean;
  message: string;
  decryptedFilePath?: string;
}

export async function encryptFile(
  fileId: string,
  deleteOriginal: boolean = false,
  customPublicKey?: string
): Promise<EncryptResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: "Not authenticated" };
    }

    if (!customPublicKey) {
      const keyStatus = await getKeyStatus();
      if (!keyStatus.hasKeys) {
        return {
          success: false,
          message: "No PGP keys found. Please generate keys in Settings first.",
        };
      }
    }

    const filePath = path.join(UPLOAD_DIR, fileId);

    try {
      await fs.access(filePath);
    } catch {
      return { success: false, message: "File not found" };
    }

    const fileBuffer = await fs.readFile(filePath);
    const fileName = path.basename(fileId);
    const encryptResult = await encryptFileData(
      new Uint8Array(fileBuffer),
      fileName,
      undefined,
      customPublicKey
    );

    if (!encryptResult.success || !encryptResult.encryptedData) {
      return { success: false, message: encryptResult.message };
    }

    const encryptedFilePath = `${filePath}.gpg`;
    await fs.writeFile(encryptedFilePath, encryptResult.encryptedData);

    if (deleteOriginal) {
      await fs.unlink(filePath);
    }

    revalidatePath("/", "layout");
    revalidatePath("/files", "page");

    return {
      success: true,
      message: "File encrypted successfully",
      encryptedFilePath: `${fileId}.gpg`,
    };
  } catch (error) {
    console.error("Error encrypting file:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to encrypt file",
    };
  }
}

export async function decryptFile(
  fileId: string,
  password: string,
  outputName: string,
  deleteEncrypted: boolean = false,
  customPrivateKey?: string
): Promise<DecryptResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: "Not authenticated" };
    }

    if (!customPrivateKey) {
      const keyStatus = await getKeyStatus();
      if (!keyStatus.hasKeys) {
        return {
          success: false,
          message: "No PGP keys found. Please generate keys in Settings first.",
        };
      }
    }

    const filePath = path.join(UPLOAD_DIR, fileId);

    try {
      await fs.access(filePath);
    } catch {
      return { success: false, message: "File not found" };
    }

    if (!fileId.endsWith(".gpg")) {
      return { success: false, message: "File is not encrypted" };
    }

    const encryptedContent = await fs.readFile(filePath, "utf-8");

    const decryptResult = await decryptFileData(
      encryptedContent,
      password,
      undefined,
      customPrivateKey
    );

    if (!decryptResult.success || !decryptResult.decryptedData) {
      return { success: false, message: decryptResult.message };
    }

    const folderPath = path.dirname(fileId);
    const decryptedFilePath = path.join(UPLOAD_DIR, folderPath, outputName);

    await fs.writeFile(
      decryptedFilePath,
      Buffer.from(decryptResult.decryptedData)
    );

    if (deleteEncrypted) {
      await fs.unlink(filePath);
    }

    revalidatePath("/", "layout");
    revalidatePath("/files", "page");

    return {
      success: true,
      message: "File decrypted successfully",
      decryptedFilePath: path.join(folderPath, outputName),
    };
  } catch (error) {
    console.error("Error decrypting file:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to decrypt file",
    };
  }
}
