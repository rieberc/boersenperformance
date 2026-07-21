declare module "xirr" {
  type XirrTransaction = { amount: number; when: Date };
  type XirrOptions = { guess?: number; maxIterations?: number };
  function xirr(transactions: XirrTransaction[], options?: XirrOptions): number;
  export default xirr;
}
