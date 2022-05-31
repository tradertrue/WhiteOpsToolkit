import { CycleTLSClient, CycleTLSResponse } from "cycletls";

interface ICycleBaseInterface {
  ja3: string;
  userAgent: string;
  baseHeader: Record<string, string | number>;
}

/** Simple wrapper class for CycleTLSS */
export class CyleTlsWrapper {
  private cycle: CycleTLSClient;
  private baseParams: ICycleBaseInterface;

  constructor(cycle: CycleTLSClient, baseParams: ICycleBaseInterface) {
    this.cycle = cycle;
    this.baseParams = baseParams;
  }

  public async get(url: string): Promise<CycleTLSResponse> {
    const response = await this.cycle(
      url,
      {
        body: "",
        ja3: this.baseParams.ja3,
        userAgent: this.baseParams.userAgent,
      },
      "get"
    );

    return response;
  }

  public async post(url: string, params: string): Promise<CycleTLSResponse> {
    const response = await this.cycle(
      url,
      {
        body: params,
        ja3: this.baseParams.ja3,
        proxy: "",
        userAgent: this.baseParams.userAgent,
      },
      "post"
    );

    return response;
  }
}
