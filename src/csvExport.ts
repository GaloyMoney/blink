import { MainBook } from "./mongodb";

const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;

export class CSVExport {
  csvWriter
  entries = []

  constructor() {
    this.csvWriter = createCsvStringifier({
      header: [
        { id: 'voided', title: 'voided' },
        { id: 'approved', title: 'approved' },
        { id: '_id', title: '_id' },
        { id: 'accounts', title: 'accounts' },
        { id: 'credit', title: 'credit' },
        { id: 'debit', title: 'debit' },
        { id: '_journal', title: '_journal' },
        { id: 'book', title: 'book' },
        { id: 'datetime', title: 'datetime' },
        { id: 'currency', title: 'currency' },
        { id: 'username', title: 'username' },
        { id: 'type', title: 'type' },
        { id: 'hash', title: 'hash' },
        { id: 'txid', title: 'txid' },
        { id: 'fee', title: 'fee' },
        { id: 'feeUsd', title: 'feeUsd' },
        { id: 'sats', title: 'sats' },
        { id: 'usd', title: 'usd' },
        { id: 'memo', title: 'memo' },
        { id: 'memoPayer', title: 'memoPayer' },
        { id: 'meta', title: 'meta' },
      ]
    })    
  }

  getBase64(): string {
    const header = this.csvWriter.getHeaderString();
    const records = this.csvWriter.stringifyRecords(this.entries)

    console.log({records, entries: this.entries})

    const str = header + records

    // create buffer from string
    const binaryData = Buffer.from(str, "utf8");

    // decode buffer as base64
    const base64Data = binaryData.toString("base64");

    return base64Data
  }

  async addAccount({account}): Promise<void> {
    const { results: transactions } = await MainBook.ledger({
      account
    })

    transactions.forEach(tx => tx.meta = JSON.stringify(tx.meta))

    // @ts-ignore
    this.entries.push(...transactions);
  }
  
}