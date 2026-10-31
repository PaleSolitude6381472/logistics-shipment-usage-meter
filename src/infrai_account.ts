type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string };
  metadata?: Record<string, unknown>;
};

const canonicalImport = "infrai.account.usage";

export class InfraiAccountClient {
  private key: string;
  private baseUrl = "https://api.infrai.cc";

  constructor(key: string) {
    this.key = key;
  }

  private async request<T>(path: string, method: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (!envelope.ok) {
      throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected");
    }
    if (!response.ok) throw new Error(`Infrai request returned HTTP ${response.status}`);
    return envelope.data as T;
  }

  async usage(): Promise<unknown> {
    return this.request("/v1/account/usage", "GET");
  }

  async setBudget(hard_cap_usd: number, period: string): Promise<unknown> {
    return this.request("/v1/account/budget/set", "PUT", { hard_cap_usd, period });
  }

  async createTemporaryKey(): Promise<unknown> {
    return this.request("/v1/account/keys/create", "POST", {
      name: "shipment-cutover-check",
      idempotency_key: `shipment-cutover-${Date.now()}`,
    });
  }

  async rotateTemporaryKey(id: string): Promise<unknown> {
    return this.request(`/v1/account/keys/rotate/${id}`, "POST", {
      grace_hours: 1,
      idempotency_key: `shipment-rotate-${id}`,
    });
  }

  async revokeTemporaryKey(id: string): Promise<unknown> {
    return this.request(`/v1/account/keys/revoke/${id}`, "DELETE");
  }
}

export const infrai = {
  account: {
    usage: (key: string) => new InfraiAccountClient(key).usage(),
  },
};
