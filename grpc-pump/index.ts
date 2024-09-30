import Client, {
    CommitmentLevel,
    SubscribeRequestAccountsDataSlice,
    SubscribeRequestFilterAccounts,
    SubscribeRequestFilterBlocks,
    SubscribeRequestFilterBlocksMeta,
    SubscribeRequestFilterEntry,
    SubscribeRequestFilterSlots,
    SubscribeRequestFilterTransactions,
  } from "@triton-one/yellowstone-grpc";
  import { SubscribeRequestPing } from "@triton-one/yellowstone-grpc/dist/grpc/geyser";
  import { VersionedTransactionResponse } from "@solana/web3.js";
import { tOutPut } from "./utils/transactionOutput";
import { buyTXN } from "./utils/txnParser/buyTxn";
import { sellTXN } from "./utils/txnParser/sellTxn";
import { TXN } from "./utils/txnParser/tokenAmount";
const pumpfun = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';

  interface SubscribeRequest {
    accounts: { [key: string]: SubscribeRequestFilterAccounts };
    slots: { [key: string]: SubscribeRequestFilterSlots };
    transactions: { [key: string]: SubscribeRequestFilterTransactions };
    transactionsStatus: { [key: string]: SubscribeRequestFilterTransactions };
    blocks: { [key: string]: SubscribeRequestFilterBlocks };
    blocksMeta: { [key: string]: SubscribeRequestFilterBlocksMeta };
    entry: { [key: string]: SubscribeRequestFilterEntry };
    commitment?: CommitmentLevel | undefined;
    accountsDataSlice: SubscribeRequestAccountsDataSlice[];
    ping?: SubscribeRequestPing | undefined;
  }

    async function handleStream(client: Client, args: SubscribeRequest) {
    // Subscribe for events
    const stream = await client.subscribe();
  
    // Create `error` / `end` handler
    const streamClosed = new Promise<void>((resolve, reject) => {
      stream.on("error", (error) => {
        console.log("ERROR", error);
        reject(error);
        stream.end();
      });
      stream.on("end", () => {
        resolve();
      });
      stream.on("close", () => {
        resolve();
      });
    });
  
    // Handle updates
    stream.on("data", async (data) => {
      try{
     const result = await tOutPut(data);
     const buyTxn = buyTXN(result.meta.logMessages);
     const sellTxn = sellTXN(result.meta.logMessages);
     const txnParser = await TXN(result.signature.toString());
     if(buyTxn && txnParser.signer !== undefined){
      
      console.log(`
        TYPE : BUY
        MINT : ${txnParser.token}
        SIGNER : ${txnParser.signer}
        IN  : ${txnParser.solAmount/1000000000} SOL
        OUT : ${txnParser.tokenAmount}
        SIGNATURE : ${result.signature}
        `)
     }
      if(sellTxn && txnParser.signer !== undefined){
      console.log(`
        TYPE : SELL
        MINT : ${txnParser.token}
        SIGNER : ${txnParser.signer}
        IN : ${txnParser.tokenAmount}
        SIGNATURE : ${result.signature}
        `)
     } 
  }catch(error){
    if(error){
      console.log(error)
    }
  }
});
  
    // Send subscribe request
    await new Promise<void>((resolve, reject) => {
      stream.write(args, (err: any) => {
        if (err === null || err === undefined) {
          resolve();
        } else {
          reject(err);
        }
      });
    }).catch((reason) => {
      console.error(reason);
      throw reason;
    });
  
    await streamClosed;
  }
  
  async function subscribeCommand(client: Client, args: SubscribeRequest) {
    while (true) {
      try {
        await handleStream(client, args);
      } catch (error) {
        console.error("Stream error, restarting in 1 second...", error);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
  
  const client = new Client(
    'gRPC REGION URL',
    'gRPC TOKEN',
    undefined,
  );
const req = {
  accounts: {},
  slots: {},
  transactions: {
    bondingCurve: {
      vote: false,
      failed: false,
      signature: undefined,
      accountInclude: ['6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'], //Address 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
      accountExclude: [],
      accountRequired: [],
    },
  },
  transactionsStatus: {},
  entry: {},
  blocks: {},
  blocksMeta: {},
  accountsDataSlice: [],
  ping: undefined,
  commitment: CommitmentLevel.CONFIRMED, //for receiving confirmed txn updates
};
  subscribeCommand(client, req);
  
