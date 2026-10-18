export interface ExpenseItem {
  id: number;
  item_name: string;
  price: string; // desimal dari backend
  quantity: number;
  subtotal: string;
}

export interface Expense {
  id: number;
  expense_date: string; // "YYYY-MM-DD"
  items_total: string;
  adjustment: string;
  total: string;
  items: ExpenseItem[];
}

export interface SummaryRow {
  period: string; // "YYYY-MM-DD"
  total: string;
}

export interface DraftItem {
  item_name: string;
  price: string;
  quantity: number;
}

export interface ScanDraft {
  expense_date: string;
  items: DraftItem[];
  adjustment: string;
  needs_review: boolean;
  warnings: string[];
}

export interface ExpenseInput {
  expense_date: string;
  items: { item_name: string; price: number; quantity: number }[];
  adjustment: number;
}

export interface ExpensePage {
  results: Expense[];
  total: number;
  limit: number;
  offset: number;
}