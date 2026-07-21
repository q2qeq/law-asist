// src/types.ts

export interface Executive {
  id?: number;
  name: string;
  position: string;
  appointed_at: string;
  expired_at: string;
  phone: string;
}

export interface CorporateData {
  id: number;
  corporate_name: string;
  registration_number: string;
  head_office_address: string;
  capital_amount: string;
  total_shares_to_issue: string;
  total_shares_issued: string;
  purposes: string[];
  executives: Executive[];
}

export interface UpcomingAlert {
  id: number;
  corporate_name: string;
  name: string;
  position: string;
  expired_at: string;
  phone: string;
  d_day: number;
}