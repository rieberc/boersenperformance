import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPortfolioSummary } from "@/lib/portfolio/summary";
import { getTransactions } from "@/lib/portfolio/transactions";

const ASSET_TYPE_LABEL: Record<string, string> = {
  STOCK: "Aktie",
  ETF: "ETF",
  CRYPTO: "Crypto",
};

const TRANSACTION_TYPE_LABEL: Record<string, string> = {
  BUY: "Kauf",
  SELL: "Verkauf",
  DIVIDEND: "Dividende",
};

const EUR_FORMAT = '#,##0.00 "€"';
const PERCENT_FORMAT = "0.00%";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const [summary, transactions] = await Promise.all([
    getPortfolioSummary(session.user.id),
    getTransactions(session.user.id),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Mein Depot";
  workbook.created = new Date();

  const positionsSheet = workbook.addWorksheet("Positionen");
  positionsSheet.columns = [
    { header: "Name", key: "name", width: 40 },
    { header: "Typ", key: "assetType", width: 12 },
    { header: "Symbol", key: "symbol", width: 14 },
    { header: "Menge", key: "quantity", width: 14 },
    { header: "Ø Einstiegspreis", key: "avgPrice", width: 16, style: { numFmt: EUR_FORMAT } },
    { header: "Aktueller Kurs", key: "currentPrice", width: 16, style: { numFmt: EUR_FORMAT } },
    { header: "Investiert", key: "investedValue", width: 14, style: { numFmt: EUR_FORMAT } },
    { header: "Wert", key: "currentValue", width: 14, style: { numFmt: EUR_FORMAT } },
    { header: "Kursgewinn", key: "gain", width: 14, style: { numFmt: EUR_FORMAT } },
    { header: "Kursgewinn %", key: "gainPercent", width: 14, style: { numFmt: PERCENT_FORMAT } },
    { header: "Dividenden", key: "dividends", width: 14, style: { numFmt: EUR_FORMAT } },
    { header: "Realisiert", key: "realizedGain", width: 14, style: { numFmt: EUR_FORMAT } },
    { header: "Allokation %", key: "allocationPercent", width: 14, style: { numFmt: PERCENT_FORMAT } },
  ];
  positionsSheet.getRow(1).font = { bold: true };
  for (const h of summary.holdings) {
    positionsSheet.addRow({
      name: h.name,
      assetType: ASSET_TYPE_LABEL[h.assetType] ?? h.assetType,
      symbol: h.symbol,
      quantity: h.quantity,
      avgPrice: h.avgPrice,
      currentPrice: h.currentPrice,
      investedValue: h.investedValue,
      currentValue: h.currentValue,
      gain: h.gain,
      gainPercent: h.gainPercent / 100,
      dividends: h.dividends,
      realizedGain: h.realizedGain,
      allocationPercent: h.allocationPercent / 100,
    });
  }

  const closedSheet = workbook.addWorksheet("Verkaufte Positionen");
  closedSheet.columns = [
    { header: "Name", key: "name", width: 40 },
    { header: "Typ", key: "assetType", width: 12 },
    { header: "Symbol", key: "symbol", width: 14 },
    { header: "Dividenden", key: "dividends", width: 14, style: { numFmt: EUR_FORMAT } },
    { header: "Realisiert", key: "realizedGain", width: 14, style: { numFmt: EUR_FORMAT } },
    { header: "Realisiert %", key: "realizedGainPercent", width: 14, style: { numFmt: PERCENT_FORMAT } },
  ];
  closedSheet.getRow(1).font = { bold: true };
  for (const p of summary.closedPositions) {
    closedSheet.addRow({
      name: p.name,
      assetType: ASSET_TYPE_LABEL[p.assetType] ?? p.assetType,
      symbol: p.symbol,
      dividends: p.dividends,
      realizedGain: p.realizedGain,
      realizedGainPercent: p.realizedGainPercent / 100,
    });
  }

  const transactionsSheet = workbook.addWorksheet("Transaktionen");
  transactionsSheet.columns = [
    { header: "Datum", key: "date", width: 14 },
    { header: "Typ", key: "type", width: 12 },
    { header: "Name", key: "name", width: 40 },
    { header: "Symbol", key: "symbol", width: 14 },
    { header: "Anlageklasse", key: "assetType", width: 12 },
    { header: "Menge", key: "quantity", width: 14 },
    { header: "Preis", key: "price", width: 14 },
    { header: "Gebühr", key: "fee", width: 12 },
    { header: "Steuer", key: "tax", width: 12 },
    { header: "Währung", key: "currency", width: 10 },
  ];
  transactionsSheet.getRow(1).font = { bold: true };
  for (const t of transactions) {
    transactionsSheet.addRow({
      date: new Date(t.date).toLocaleDateString("de-DE"),
      type: TRANSACTION_TYPE_LABEL[t.type] ?? t.type,
      name: t.name,
      symbol: t.symbol,
      assetType: ASSET_TYPE_LABEL[t.assetType] ?? t.assetType,
      quantity: t.quantity,
      price: t.price,
      fee: t.fee,
      tax: t.tax,
      currency: t.currency,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `depot-export-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
