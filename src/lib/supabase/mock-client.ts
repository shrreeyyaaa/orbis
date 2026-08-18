import {
  generateMockValuations,
  MOCK_ACCOUNTS,
  MOCK_ASSETS,
  MOCK_EXPENSES,
  MOCK_EXCHANGE_RATES,
  MOCK_GOALS,
  MOCK_HOLDINGS,
  MOCK_HOUSEHOLD,
  MOCK_INCOME_SOURCES,
  MOCK_LIABILITIES,
  MOCK_MEMBER,
  MOCK_OWNERS,
  MOCK_OWNERSHIP,
  MOCK_USER,
} from "../mock-data";

const TABLE_DATA: Record<string, any[]> = {
  households: [MOCK_HOUSEHOLD],
  household_members: [MOCK_MEMBER],
  owners: MOCK_OWNERS,
  accounts: MOCK_ACCOUNTS,
  holdings: MOCK_HOLDINGS,
  assets: MOCK_ASSETS,
  liabilities: MOCK_LIABILITIES,
  ownership: MOCK_OWNERSHIP,
  income_sources: MOCK_INCOME_SOURCES,
  expenses: MOCK_EXPENSES,
  goals: MOCK_GOALS,
  exchange_rates: MOCK_EXCHANGE_RATES,
  valuations: generateMockValuations(),
  achievements: [],
  health_score_history: [],
};

class MockQueryBuilder {
  private tableName: string;
  private filters: { col: string; val: any }[] = [];
  private isSingle = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(_query?: string) {
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ col, val });
    return this;
  }

  order(_col: string, _opts?: any) {
    return this;
  }

  limit(_count: number) {
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  then(resolve: (res: any) => void) {
    let list = TABLE_DATA[this.tableName] || [];

    for (const filter of this.filters) {
      list = list.filter((item) => item[filter.col] === filter.val);
    }

    if (this.isSingle) {
      resolve({ data: list[0] || null, error: null });
    } else {
      resolve({ data: list, error: null, count: list.length });
    }
  }

  insert(record: any) {
    const table = TABLE_DATA[this.tableName] || [];
    const newRecord = { id: `mock-${Date.now()}`, ...record };
    table.push(newRecord);
    TABLE_DATA[this.tableName] = table;
    return Promise.resolve({ data: newRecord, error: null });
  }

  upsert(record: any) {
    return this.insert(record);
  }

  update(record: any) {
    return Promise.resolve({ data: record, error: null });
  }

  delete() {
    return Promise.resolve({ data: null, error: null });
  }
}

export function createMockSupabaseClient() {
  return {
    auth: {
      async getUser() {
        if (typeof document !== "undefined") {
          const cookies = document.cookie.split(";").map((c) => c.trim());
          const hasSession = cookies.some((c) => c === "orbis_demo_logged_in=true");
          if (!hasSession) {
            return { data: { user: null }, error: null };
          }
        }
        return { data: { user: MOCK_USER }, error: null };
      },
      async signInWithPassword(_credentials: any) {
        if (typeof document !== "undefined") {
          document.cookie = "orbis_demo_logged_in=true; path=/; max-age=31536000; SameSite=Lax";
        }
        return { data: { user: MOCK_USER, session: {} }, error: null };
      },
      async signUp(_credentials: any) {
        if (typeof document !== "undefined") {
          document.cookie = "orbis_demo_logged_in=true; path=/; max-age=31536000; SameSite=Lax";
        }
        return { data: { user: MOCK_USER, session: {} }, error: null };
      },
      async signOut() {
        if (typeof document !== "undefined") {
          document.cookie = "orbis_demo_logged_in=false; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
        return { error: null };
      },
      onAuthStateChange(callback: any) {
        callback("SIGNED_IN", { user: MOCK_USER });
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    },
    from(tableName: string) {
      return new MockQueryBuilder(tableName);
    },
    async rpc(_fnName: string, _args?: any) {
      return { data: null, error: null };
    },
  };
}
