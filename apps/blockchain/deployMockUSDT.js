const {
  Connection,
  Keypair,
  clusterApiUrl,
} = require("@solana/web3.js");
const {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} = require("@solana/spl-token");
const fs = require("fs");

(async () => {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const raw = fs.readFileSync("/Users/yong/.config/solana/id.json", "utf8");
  const keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));

  console.log("🔑 使用錢包:", keypair.publicKey.toBase58());

  const mint = await createMint(
    connection,
    keypair,
    keypair.publicKey,
    null,
    6
  );

  console.log("✅ 已建立 USDT Mint:", mint.toBase58());

  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    keypair,
    mint,
    keypair.publicKey
  );

  await mintTo(
    connection,
    keypair,
    mint,
    ata.address,
    keypair,
    1_000_000_000
  );

  console.log("✅ 已發送 1000 USDT 至 ATA:", ata.address.toBase58());
})();
