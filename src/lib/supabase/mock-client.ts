import {
  generateMockValuations,
  MOCK_ACCOUNTS,
  MOCK_ASSETS,
  MOCK_EXPENSES,
  MOCK_EXCHANGE_RATES,
  MOCK_FINANCIAL_EVENTS,
  MOCK_GOAL_CONTRIBUTIONS,
  MOCK_GOAL_INCOME_ALLOCATIONS,
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
  goal_income_allocations: [...MOCK_GOAL_INCOME_ALLOCATIONS],
  goal_contributions: [...MOCK_GOAL_CONTRIBUTIONS],
  financial_events: [...MOCK_FINANCIAL_EVENTS],
  exchange_rates: MOCK_EXCHANGE_RATES,
  valuations: generateMockValuations(),
  achievements: [
    { household_id: "hh-001", key: "foundation", earned_at: new Date().toISOString() },
    { household_id: "hh-001", key: "goal_setter", earned_at: new Date().toISOString() },
    { household_id: "hh-001", key: "diversified", earned_at: new Date().toISOString() },
    { household_id: "hh-001", key: "estate_minded", earned_at: new Date().toISOString() },
    { household_id: "hh-001", key: "global_citizen", earned_at: new Date().toISOString() },
    { household_id: "hh-001", key: "in_the_black", earned_at: new Date().toISOString() },
    { household_id: "hh-001", key: "nw_1m", earned_at: new Date().toISOString() },
    { household_id: "hh-001", key: "nw_5m", earned_at: new Date().toISOString() },
  ],
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
    const rows = Array.isArray(record) ? record : [record];
    const created = rows.map((r) => ({ id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...r }));
    table.push(...created);
    TABLE_DATA[this.tableName] = table;
    return Promise.resolve({ data: Array.isArray(record) ? created : created[0], error: null });
  }

  upsert(record: any) {
    return this.insert(record);
  }

  update(record: any) {
    const table = TABLE_DATA[this.tableName] || [];
    for (const filter of this.filters) {
      for (const item of table) {
        if (item[filter.col] === filter.val) {
          Object.assign(item, record);
        }
      }
    }
    return {
      eq: (col: string, val: any) => {
        this.filters.push({ col, val });
        for (const item of table) {
          if (item[col] === val) Object.assign(item, record);
        }
        return Promise.resolve({ data: record, error: null });
      },
      then: (resolve: (res: any) => void) => resolve({ data: record, error: null }),
    };
  }

  delete() {
    return {
      eq: (col: string, val: any) => {
        const table = TABLE_DATA[this.tableName] || [];
        TABLE_DATA[this.tableName] = table.filter((item) => item[col] !== val);
        return Promise.resolve({ data: null, error: null });
      },
      then: (resolve: (res: any) => void) => resolve({ data: null, error: null }),
    };
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
