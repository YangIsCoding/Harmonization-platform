import bs58 from "bs58";
import fs from "fs";

const raw = JSON.parse(fs.readFileSync("/Users/yong/.config/solana/id.json", "utf-8"));
const base58 = bs58.encode(Uint8Array.from(raw));
console.log("Base58:", base58);
