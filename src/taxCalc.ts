export type CalcInput = {
  province:
    | "AB"
    | "BC"
    | "NB"
    | "NL"
    | "NS"
    | "NT"
    | "NU"
    | "ON"
    | "PE"
    | "QC"
    | "SK"
    | "YT";
  otherIncome: number;
  employmentIncome: number;
  selfEmploymentIncome: number;
  capitalGains: number;
  eligibleDividends: number;
  ineligibleDividends: number;
  incomeTaxesPaid: number;
  rrspDeduction: number;
};

export const lastUpdate = new Date("2023-06-07"); // For the "Rates are up to that as of" label

export const calculate = (inputs: CalcInput) => {
  const prov = inputs.province;
  const income_a = inputs.employmentIncome + inputs.otherIncome;
  const income_emp = inputs.employmentIncome;
  const income_se = inputs.selfEmploymentIncome;
  const c_g = inputs.capitalGains;
  const e_div = inputs.eligibleDividends;
  const i_div = inputs.ineligibleDividends;
  const tax_paid = inputs.incomeTaxesPaid;
  const rrsp_d = inputs.rrspDeduction;

  let f_tax = 0;
  let p_tax = 0;
  let s_tax = 0;
  let se_cpp_premiums = 0;
  let m_rate = 0;

  // Tax Credits & Deductions
  // ------------------------------------------------------
  // Canada Employment Amount
  const can_emp_amt = Math.min(1368, income_emp); /* 2023 */

  // CPP Premiums
  const cpp_max = 66600; /* 2023 */
  const cpp_exemption = 3500; /* 2023 */
  const cppqpp_rate = prov === "QC" ? 0.128 : 0.119; /* 2023 */
  const cpp_deduction_rate = 0.01; /* 2023 */
  const total_income = income_emp + income_se;

  // Employment CPP Premiums; assume employer properly withheld premiums and takes exemption into account
  const emp_cpp_premiums =
    (Math.max(0, Math.min(income_emp, cpp_max) - cpp_exemption) * cppqpp_rate) /
    2;
  const emp_cpp_deduction =
    Math.max(0, Math.min(income_emp, cpp_max) - cpp_exemption) *
    cpp_deduction_rate;

  let se_cpp_deduction = 0;

  // SE CPP Premiums
  if (income_se > 0 && income_emp === 0) {
    // if no employment income, just use SE income to do calc
    se_cpp_premiums =
      Math.max(0, Math.min(income_se, cpp_max) - cpp_exemption) * cppqpp_rate;
    se_cpp_deduction =
      Math.max(0, Math.min(income_se, cpp_max) - cpp_exemption) *
      cpp_deduction_rate *
      2;
  } else if (income_se > 0 && income_emp > 0) {
    se_cpp_premiums =
      Math.max(0, Math.min(total_income, cpp_max) - cpp_exemption) *
      cppqpp_rate;
    se_cpp_premiums -= emp_cpp_premiums * 2;
    se_cpp_deduction =
      Math.max(0, Math.min(income_se, cpp_max) - cpp_exemption) *
      cpp_deduction_rate *
      2;
    se_cpp_deduction -= emp_cpp_deduction * 2;
  } else {
    se_cpp_premiums = 0;
    se_cpp_deduction = 0;
  }

  // EI Premiums
  const ei_max = 61500; /* 2023 */
  const ei_rate = prov === "QC" ? 0.0127 : 0.0163; /* 2023 */
  const ei_premiums = Math.max(0, Math.min(income_emp, ei_max)) * ei_rate;

  // QPIP Premiums
  const qpip_max = 91000; /* 2023 */
  const qpip_ee_rate = 0.00494; /* 2023 */

  const qpip_premiums =
    prov === "QC"
      ? Math.max(0, Math.min(income_emp, qpip_max)) * qpip_ee_rate
      : 0;

  // Payroll Deductions
  const payroll_deductions = emp_cpp_premiums + ei_premiums + qpip_premiums;

  // Payroll Tax Credits
  const payroll_tax_credits =
    emp_cpp_premiums -
    emp_cpp_deduction +
    se_cpp_premiums / 2 -
    se_cpp_deduction / 2 +
    ei_premiums +
    qpip_premiums;

  // Taxable dividends
  const taxable_e_div = e_div * 1.38; /* 2023 */
  const taxable_i_div = i_div * 1.15; /* 2023 */

  // Taxable Income
  // ------------------------------------------------------
  const income =
    income_a +
    income_se +
    taxable_e_div +
    taxable_i_div +
    c_g / 2 -
    rrsp_d -
    se_cpp_premiums / 2 -
    emp_cpp_deduction -
    se_cpp_deduction / 2;

  // Debugging
  console.log("Canada Employment Amount: " + can_emp_amt);
  console.log("CPP Premiums (Emp): " + emp_cpp_premiums);
  console.log("CPP Premiums (SE): " + se_cpp_premiums);
  console.log("EI Premiums: " + ei_premiums);
  console.log("Taxable Income: " + income);
  console.log("////////////////////////////////////");

  // Federal Tax
  // ------------------------------------------------------

  if (income <= 53359) {
    /* 2023 */
    f_tax = income * 0.15;
    m_rate = 0.15;
  } else if (income <= 106717) {
    /* 2023 */
    f_tax = (income - 53359) * 0.205 + 8003.85;
    m_rate = 0.205;
  } else if (income <= 165430) {
    /* 2023 */
    f_tax = (income - 106717) * 0.26 + 18942.24;
    m_rate = 0.26;
  } else if (income <= 235675) {
    /* 2023 */
    f_tax = (income - 165430) * 0.29 + 34207.62;
    m_rate = 0.29;
  } else {
    /* 2023 */
    f_tax = (income - 235675) * 0.33 + 54578.67;
    m_rate = 0.33;
  }

  let fed_bpa = 13521; /* 2023 */
  if (income < 165430) {
    fed_bpa += 1479;
  } else if (income < 235675) {
    fed_bpa += 1479 - (income - 165430) * 0.021054879;
  }

  f_tax = Math.max(
    f_tax - (fed_bpa + can_emp_amt + payroll_tax_credits) * 0.15,
    0
  ); /* 2023 */
  f_tax = Math.max(
    f_tax - taxable_e_div * 0.150198 - taxable_i_div * 0.090301,
    0
  ); /* 2023 */

  if (prov === "QC") {
    f_tax *= 0.835;
    m_rate *= 0.835;
  }

  // Provincial Tax
  // ------------------------------------------------------

  switch (prov) {
    // Alberta
    case "AB":
      /* NOTE: we expect another bracket <60000 at 8%, pending bill */
      if (income <= 142292) {
        /* 2023 */
        p_tax = income * 0.1;
        m_rate += 0.1;
      } else if (income <= 170751) {
        /* 2023 */
        p_tax = (income - 142292) * 0.12 + 14229.2;
        m_rate += 0.12;
      } else if (income <= 227668) {
        /* 2023 */
        p_tax = (income - 170751) * 0.13 + 17644.28;
        m_rate += 0.13;
      } else if (income <= 341502) {
        /* 2023 */
        p_tax = (income - 227668) * 0.14 + 25043.49;
        m_rate += 0.14;
      } else {
        /* 2023 */
        p_tax = (income - 341502) * 0.15 + 40980.25;
        m_rate += 0.15;
      }
      p_tax = Math.max(
        p_tax - (21003 + payroll_tax_credits) * 0.1,
        0
      ); /* 2023 */
      p_tax = Math.max(
        p_tax - taxable_e_div * 0.0812 - taxable_i_div * 0.0218,
        0
      ); /* 2023 */
      break;

    // British Columbia
    case "BC":
      if (income <= 45654) {
        /* 2023 */
        p_tax = income * 0.0506;
        m_rate += 0.0506;
      } else if (income <= 91310) {
        /* 2023 */
        p_tax = (income - 45654) * 0.077 + 2310.09;
        m_rate += 0.077;
      } else if (income <= 104835) {
        /* 2023 */
        p_tax = (income - 91310) * 0.105 + 5825.6;
        m_rate += 0.105;
      } else if (income <= 127299) {
        /* 2023 */
        p_tax = (income - 104835) * 0.1229 + 7245.73;
        m_rate += 0.1229;
      } else if (income <= 172602) {
        /* 2023 */
        p_tax = (income - 127299) * 0.147 + 10006.56;
        m_rate += 0.147;
      } else if (income <= 240716) {
        /* 2023 */
        p_tax = (income - 172602) * 0.168 + 16666.1;
        m_rate += 0.168;
      } else {
        /* 2023 */
        p_tax = (income - 227091) * 0.205 + 28109.25;
        m_rate += 0.205;
      }
      p_tax = Math.max(
        p_tax - (11981 + payroll_tax_credits) * 0.0506,
        0
      ); /* 2023 */
      p_tax = Math.max(
        p_tax - taxable_e_div * 0.12 - taxable_i_div * 0.0196,
        0
      ); /* 2023 */
      break;

    // Manitoba
    case "MB":
      if (income <= 36842) {
        /* 2023 */
        p_tax = income * 0.108;
        m_rate += 0.108;
      } else if (income <= 79625) {
        /* 2023 */
        p_tax = (income - 36842) * 0.1275 + 3978.94;
        m_rate += 0.1275;
      } else {
        /* 2023 */
        p_tax = (income - 79625) * 0.174 + 9433.77;
        m_rate += 0.174;
      }
      p_tax = Math.max(
        p_tax - (15000 + payroll_tax_credits) * 0.108,
        0
      ); /* 2023 */
      p_tax = Math.max(
        p_tax - taxable_e_div * 0.08 - taxable_i_div * 0.007835,
        0
      ); /* 2023 */
      break;

    // New Brunswick
    case "NB":
      if (income <= 47715) {
        /* 2023 */
        p_tax = income * 0.094;
        m_rate += 0.094;
      } else if (income <= 95431) {
        /* 2023 */
        p_tax = (income - 47715) * 0.14 + 4485.21;
        m_rate += 0.14;
      } else if (income <= 176756) {
        /* 2023 */
        p_tax = (income - 95431) * 0.16 + 11165.45;
        m_rate += 0.16;
      } else {
        /* 2023 */
        p_tax = (income - 176756) * 0.195 + 24177.45;
        m_rate += 0.195;
      }

      p_tax = Math.max(
        p_tax - (12458 + payroll_tax_credits) * 0.094,
        0
      ); /* 2023 */
      p_tax = Math.max(
        p_tax - taxable_e_div * 0.14 - taxable_i_div * 0.0275,
        0
      ); /* 2023 */
      break;

    // Newfoundland
    case "NL":
      if (income <= 41457) {
        /* 2023 */
        p_tax = income * 0.087;
        m_rate += 0.087;
      } else if (income <= 82913) {
        /* 2023 */
        p_tax = (income - 41457) * 0.145 + 3606.76;
        m_rate += 0.145;
      } else if (income <= 148027) {
        /* 2023 */
        p_tax = (income - 82913) * 0.158 + 9617.88;
        m_rate += 0.158;
      } else if (income <= 207239) {
        /* 2023 */
        p_tax = (income - 148027) * 0.178 + 19905.89;
        m_rate += 0.178;
      } else if (income <= 264750) {
        /* 2023 */
        p_tax = (income - 207239) * 0.198 + 30445.63;
        m_rate += 0.198;
      } else if (income <= 529500) {
        /* 2023 */
        p_tax = (income - 264750) * 0.208 + 41832.81;
        m_rate += 0.208;
      } else if (income <= 1059000) {
        /* 2023 */
        p_tax = (income - 529500) * 0.213 + 96900.81;
        m_rate += 0.213;
      } else {
        /* 2023 */
        p_tax = (income - 1059000) * 0.218 + 209684.31;
        m_rate += 0.218;
      }
      p_tax = Math.max(
        p_tax - (10382 + payroll_tax_credits) * 0.087,
        0
      ); /* 2023 */
      p_tax = Math.max(
        p_tax - taxable_e_div * 0.063 - taxable_i_div * 0.032,
        0
      ); /* 2023 */
      break;

    // Nova Scotia
    case "NS":
      if (income <= 29590) {
        /* 2023 */
        p_tax = income * 0.0879;
        m_rate += 0.0879;
      } else if (income <= 59180) {
        /* 2023 */
        p_tax = (income - 29590) * 0.1495 + 2600.96;
        m_rate += 0.1495;
      } else if (income <= 93000) {
        /* 2023 */
        p_tax = (income - 59180) * 0.1667 + 7024.67;
        m_rate += 0.1667;
      } else if (income <= 150000) {
        /* 2023 */
        p_tax = (income - 93000) * 0.175 + 12662.46;
        m_rate += 0.175;
      } else {
        /* 2023 */
        p_tax = (income - 150000) * 0.21 + 22637.46;
        m_rate += 0.21;
      }

      // eslint-disable-next-line no-case-declarations
      let ns_bpa = 8481; /* 2023 */
      if (income < 25000) {
        ns_bpa += 3000;
      } else if (income < 75000) {
        ns_bpa += (75000 - income) * 0.06;
      }
      // console.log(ns_bpa);

      p_tax = Math.max(
        p_tax - (ns_bpa + payroll_tax_credits) * 0.0879,
        0
      ); /* 2023 */
      p_tax = Math.max(
        p_tax - taxable_e_div * 0.0885 - taxable_i_div * 0.0299,
        0
      ); /* 2023 */
      break;

    // Northwest Territories
    case "NT":
      if (income <= 48326) {
        /* 2023 */
        p_tax = income * 0.059;
        m_rate += 0.059;
      } else if (income <= 96655) {
        /* 2023 */
        p_tax = (income - 48326) * 0.086 + 2851.23;
        m_rate += 0.086;
      } else if (income <= 157139) {
        /* 2023 */
        p_tax = (income - 96655) * 0.122 + 7007.53;
        m_rate += 0.122;
      } else {
        /* 2023 */
        p_tax = (income - 157139) * 0.1405 + 14386.58;
        m_rate += 0.1405;
      }
      p_tax = Math.max(
        p_tax - (16593 + payroll_tax_credits) * 0.059,
        0
      ); /* 2023 */
      p_tax = Math.max(
        p_tax - taxable_e_div * 0.115 - taxable_i_div * 0.06,
        0
      ); /* 2023 */
      break;

    // Nunavut
    case "NU":
      if (income <= 50877) {
        /* 2023 */
        p_tax = income * 0.04;
        m_rate += 0.04;
      } else if (income <= 101754) {
        /* 2023 */
        p_tax = (income - 50877) * 0.07 + 2035.08;
        m_rate += 0.07;
      } else if (income <= 165429) {
        /* 2023 */
        p_tax = (income - 101754) * 0.09 + 5596.47;
        m_rate += 0.09;
      } else {
        /* 2023 */
        p_tax = (income - 165429) * 0.115 + 11327.22;
        m_rate += 0.115;
      }
      p_tax = Math.max(
        p_tax - (17925 + payroll_tax_credits) * 0.04,
        0
      ); /* 2023 */
      p_tax = Math.max(
        p_tax - taxable_e_div * 0.0551 - taxable_i_div * 0.0261,
        0
      ); /* 2023 */
      break;

    // Ontario
    case "ON":
      if (income <= 49231) {
        /* 2023 */
        p_tax = income * 0.0505;
        m_rate += 0.0505;
      } else if (income <= 98463) {
        /* 2023 */
        p_tax = (income - 49231) * 0.0915 + 2486.17;
        m_rate += 0.0915;
      } else if (income <= 150000) {
        /* 2023 */
        p_tax = (income - 98463) * 0.1116 + 6990.89;
        m_rate += 0.1116;
      } else if (income <= 220000) {
        /* 2023 */
        p_tax = (income - 150000) * 0.1216 + 12742.42;
        m_rate += 0.1216;
      } else {
        /* 2023 */
        p_tax = (income - 220000) * 0.1316 + 21254.42;
        m_rate += 0.1316;
      }
      p_tax = Math.max(
        p_tax - (11865 + payroll_tax_credits) * 0.0505,
        0
      ); /* 2023 */

      /* ON Surtax 2023 */
      if (p_tax >= 6802) {
        s_tax = (p_tax - 5315) * 0.2 + (p_tax - 6802) * 0.36;
      } else if (p_tax >= 5315) {
        s_tax = (p_tax - 5315) * 0.2;
      } else {
        s_tax = 0;
      }

      // marginal rate increase
      if (income > 220000) {
        m_rate += 0.1316 * 0.56;
      } else if (income > 150000) {
        m_rate += 0.1216 * 0.56;
      } else if (income > 102135) {
        /* 2023 */ /* higher surtax starts here */
        m_rate += 0.1116 * 0.56;
      } else if (income > 98463) {
        /* 2023 */ /* next tax bracket starts here */
        m_rate += 0.1116 * 0.2;
      } else if (income > 86698) {
        /* 2023 */ /* lower surtax starts here */
        m_rate += 0.0915 * 0.2;
      }
      /* End ON Surtax 2023 */

      /* ON DTC After Surtax 2023 */
      p_tax += s_tax;
      p_tax = Math.max(
        p_tax - taxable_e_div * 0.1 - taxable_i_div * 0.029863,
        0
      ); /* 2023 */

      // Ontario Health Premium 2023
      // eslint-disable-next-line no-case-declarations
      let on_health = 0;
      if (income > 200600) {
        on_health = 900;
      } else if (income > 200000) {
        on_health = (income - 200000) * 0.25 + 750;
      } else if (income > 72600) {
        on_health = 750;
      } else if (income > 72000) {
        on_health = (income - 72000) * 0.25 + 600;
      } else if (income > 48600) {
        on_health = 600;
      } else if (income > 48000) {
        on_health = (income - 48000) * 0.25 + 450;
      } else if (income > 38500) {
        on_health = 450;
      } else if (income > 36000) {
        on_health = (income - 36000) * 0.06 + 300;
      } else if (income > 25000) {
        on_health = 300;
      } else if (income > 20000) {
        on_health = (income - 20000) * 0.06 + 0;
      }
      p_tax += on_health;
      break;

    // Prince Edward Island
    case "PE":
      if (income <= 31984) {
        /* 2023 */
        p_tax = income * 0.098;
        m_rate += 0.098;
      } else if (income <= 63969) {
        /* 2023 */
        p_tax = (income - 31984) * 0.138 + 3134.43;
        m_rate += 0.138;
      } else {
        /* 2023 */
        p_tax = (income - 63969) * 0.167 + 7548.36;
        m_rate += 0.167;
      }
      /* NOTE: this will be 12,750 soon (https://www.princeedwardisland.ca/en/news/government-introduces-changes-to-income-tax) */
      p_tax = Math.max(
        p_tax - (12000 + payroll_tax_credits) * 0.098,
        0
      ); /* 2023 */
      p_tax = Math.max(
        p_tax - taxable_e_div * 0.105 - taxable_i_div * 0.013,
        0
      ); /* 2023 */

      /* PE Surtax 2023 */
      if (p_tax >= 12500) {
        s_tax = (p_tax - 12500) * 0.1;
      } else {
        s_tax = 0;
      }

      // marginal rate increase
      if (income > 100664) {
        /* 2023 */
        m_rate += 0.167 * 0.1;
      }
      /* End PE Surtax 2023 */

      p_tax += s_tax;
      break;

    // Quebec
    case "QC":
      if (income <= 49275) {
        /* 2023 */
        p_tax = income * 0.14;
        m_rate += 0.14;
      } else if (income <= 98540) {
        /* 2023 */
        p_tax = (income - 49275) * 0.19 + 6898.5;
        m_rate += 0.19;
      } else if (income <= 119910) {
        /* 2023 */
        p_tax = (income - 98540) * 0.24 + 16258.85;
        m_rate += 0.24;
      } else {
        /* 2023 */
        p_tax = (income - 119910) * 0.2575 + 21387.65;
        m_rate += 0.2575;
      }
      p_tax = Math.max(p_tax - 17183 * 0.14, 0); /* 2023 */
      p_tax = Math.max(
        p_tax - taxable_e_div * 0.117 - taxable_i_div * 0.0342,
        0
      ); /* 2023 */
      break;

    // Saskatchewan
    case "SK":
      if (income <= 49720) {
        /* 2023 */
        p_tax = income * 0.105;
        m_rate += 0.105;
      } else if (income <= 142058) {
        /* 2023 */
        p_tax = (income - 49720) * 0.125 + 5220.6;
        m_rate += 0.125;
      } else {
        /* 2023 */
        p_tax = (income - 142058) * 0.145 + 16762.85;
        m_rate += 0.145;
      }
      p_tax = Math.max(
        p_tax - (17661 + payroll_tax_credits) * 0.105,
        0
      ); /* 2023 */
      p_tax = Math.max(
        p_tax - taxable_e_div * 0.11 - taxable_i_div * 0.02105,
        0
      ); /* 2023 */
      break;

    // Yukon
    case "YT":
      if (income <= 53359) {
        /* 2023 */
        p_tax = income * 0.064;
        m_rate += 0.064;
      } else if (income <= 106717) {
        /* 2023 */
        p_tax = (income - 53359) * 0.09 + 3414.98;
        m_rate += 0.09;
      } else if (income <= 165430) {
        /* 2023 */
        p_tax = (income - 106717) * 0.109 + 8217.2;
        m_rate += 0.109;
      } else if (income <= 500000) {
        /* 2023 */
        p_tax = (income - 165430) * 0.128 + 14616.91;
        m_rate += 0.128;
      } else {
        /* 2023 */
        p_tax = (income - 500000) * 0.15 + 57441.87;
        m_rate += 0.15;
      }
      p_tax = Math.max(
        p_tax - (fed_bpa + can_emp_amt + payroll_tax_credits) * 0.064,
        0
      ); /* 2023 */
      p_tax = Math.max(
        p_tax - taxable_e_div * 0.1202 - taxable_i_div * 0.0067,
        0
      ); /* 2023 */
      break;
    default:
      // console
      break;
  }

  // Totals
  // ------------------------------------------------------

  // Total Tax
  const totalTax = f_tax + p_tax + payroll_deductions + se_cpp_premiums;

  // Effective Rate
  const e_rate = totalTax / (income_a + income_se + c_g + e_div + i_div) || 0;

  // Tax Refund or Owing
  // doesn't include payroll deductions
  const refundOrAmountOwing = tax_paid - (f_tax + p_tax + se_cpp_premiums);
  const absoluteRefundOrAmountOwing = Math.abs(refundOrAmountOwing);
  const isRefund = refundOrAmountOwing >= 0;

  const totalIncome = income_a + income_se + c_g + e_div + i_div;
  const afterTaxIncome = totalIncome - totalTax;

  // RRSP difference
  let rrspDifference = 0;
  if (rrsp_d > 0) {
    rrspDifference = Math.max(
      0,
      calculate({ ...inputs, rrspDeduction: 0 }).totalTax - totalTax
    );
  }

  return {
    totalTax,
    federalTax: f_tax,
    provincialTax: p_tax,
    refundOrAmountOwing: absoluteRefundOrAmountOwing,
    isRefund,
    totalIncome,
    afterTaxIncome,
    payrollDeductions: payroll_deductions,
    selfEmploymentCPPPremiums: se_cpp_premiums,
    rrspDifference,
    marginalRate: !prov ? 0 : m_rate,
    averageRate: e_rate
  };
};
