/** Hardcoded in the WhiteOps's .js script */
const obfuscatedStringHeader: string = "2GAM";
const ve: number[] = [
  85, 19, 48, 77, 11, 40, 69, 3, 32, 61, 90, 24, 53, 82, 16, 45, 74, 8, 37, 66, 0, 29, 58, 87, 21, 50, 79, 13, 42, 71, 5, 34, 63, 92, 26, 55, 84, 18,
  47, 76, 10, 39, 68, 2, 31, 60, 89, 23, 52, 81, 15, 44, 73, 7, 36, 65, 94, 28, 57, 86, 20, 49, 78, 12, 41, 70, 4, 33, 62, 91, 25, 54, 83, 17, 46, 75,
  9, 38, 67, 1, 30, 59, 88, 22, 51, 80, 14, 43, 72, 6, 35, 64, 93, 27, 56,
];

/** Swap 2 elements in an array */
function swapInArray(array: number[], pos1: number, pos2: number): void {
  let temp = array[pos1];
  array[pos1] = array[pos2];
  array[pos2] = temp;
}

/** Generate the encryption key (depends of OZ_TC) */
function genEncryptionKey(oz_tc: string): number[] {
  let u: number[] = ve;
  let r = 95;

  for (let h = 95; r--; ) {
    h = (h + u[r] + oz_tc.charCodeAt(r % oz_tc.length)) % 95;
    let n = u[r];
    u[r] = u[h];
    u[h] = n;
  }
  return u;
}

/** Decrypt a single character */
function treatCharacter(r: number, h: number, encryptionKey: number[], iterator: number, stringToDecrypt: string) {
  let chrUnicode: number = stringToDecrypt.charCodeAt(iterator);

  r = (r + 1) % 95;
  h = (h + encryptionKey[r % 95]) % 95;
  swapInArray(encryptionKey, r, h);
  chrUnicode -= encryptionKey[(encryptionKey[r] + encryptionKey[h]) % 95];

  if (chrUnicode < 32) {
    chrUnicode += 95;
  }

  if (chrUnicode > 125) {
    chrUnicode -= 95;
  }

  return { chrUnicode, r, h };
}

/** Decrypt the whole OZ_SG */
export function decryptWhiteOps(oz_tc: string, stringToDecrypt: string): string {
  let originalString: string = "";
  let r: number = 0;
  let h: number = 0;
  let encryptionKey: number[] = genEncryptionKey(obfuscatedStringHeader + oz_tc);
  let chrUnicode = 0;

  for (let iterator = 0; iterator < stringToDecrypt.length; iterator++) {
    ({ chrUnicode, r, h } = treatCharacter(r, h, encryptionKey, iterator, stringToDecrypt));

    if (chrUnicode < 32 || chrUnicode > 125) {
      let sum = 0;
      let mod = 0;

      iterator++;
      ({ chrUnicode, r, h } = treatCharacter(r, h, encryptionKey, iterator, stringToDecrypt));
      sum += chrUnicode;
      mod = chrUnicode;

      iterator++;
      ({ chrUnicode, r, h } = treatCharacter(r, h, encryptionKey, iterator, stringToDecrypt));
      sum += chrUnicode;

      if (mod >= 81) {
        iterator++;
        ({ chrUnicode, r, h } = treatCharacter(r, h, encryptionKey, iterator, stringToDecrypt));
        sum += chrUnicode;
      }

      chrUnicode = sum + (-33 + (mod - 49) * 63);
      console.log(chrUnicode);
      originalString += String.fromCharCode(chrUnicode);
      continue;
    }

    originalString += String.fromCharCode(chrUnicode);
  }
  return originalString;
}

console.log(decryptWhiteOps("OZ_TC", "OZ_SG"));
